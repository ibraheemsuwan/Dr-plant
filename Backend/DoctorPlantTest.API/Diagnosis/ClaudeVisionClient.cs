using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Anthropic;
using Anthropic.Exceptions;
using Anthropic.Models.Beta;
using Anthropic.Models.Beta.Messages;
using Microsoft.Extensions.Options;

namespace DoctorPlantTest.API.Diagnosis
{
    /// <summary>One crop and the diseases the app has records for (from the crops/cropdiseases tables).</summary>
    public record CatalogueCrop(long CropId, string NameEn, string NameAr, IReadOnlyList<(long Id, string Name)> Diseases);

    /// <summary>Structured answer from Claude (matches <see cref="ClaudeVisionClient.Schema"/>).</summary>
    public class VisionDiagnosis
    {
        [JsonPropertyName("is_plant")] public bool IsPlant { get; set; }
        [JsonPropertyName("image_usable")] public bool ImageUsable { get; set; }
        [JsonPropertyName("crop_id")] public long? CropId { get; set; }
        [JsonPropertyName("crop_name_en")] public string CropNameEn { get; set; } = "";
        [JsonPropertyName("crop_name_ar")] public string CropNameAr { get; set; } = "";
        [JsonPropertyName("status")] public string Status { get; set; } = "unknown";
        [JsonPropertyName("disease_id")] public long? DiseaseId { get; set; }
        [JsonPropertyName("disease_name_en")] public string? DiseaseNameEn { get; set; }
        [JsonPropertyName("disease_name_ar")] public string? DiseaseNameAr { get; set; }
        [JsonPropertyName("confidence")] public double Confidence { get; set; }
        [JsonPropertyName("description_en")] public string? DescriptionEn { get; set; }
        [JsonPropertyName("description_ar")] public string? DescriptionAr { get; set; }
        [JsonPropertyName("symptoms_en")] public string? SymptomsEn { get; set; }
        [JsonPropertyName("symptoms_ar")] public string? SymptomsAr { get; set; }
        [JsonPropertyName("treatment_en")] public string? TreatmentEn { get; set; }
        [JsonPropertyName("treatment_ar")] public string? TreatmentAr { get; set; }
    }

    /// <summary>
    /// Vision fallback: asks Claude to diagnose the photo when the local model is unsure or doesn't know the crop.
    /// The API key stays on the server (Claude:ApiKey or ANTHROPIC_API_KEY).
    /// </summary>
    public class ClaudeVisionClient
    {
        private readonly ClaudeOptions _options;
        private readonly ILogger<ClaudeVisionClient> _logger;
        private readonly AnthropicClient? _client;

        public ClaudeVisionClient(IOptions<ClaudeOptions> options, ILogger<ClaudeVisionClient> logger)
        {
            _options = options.Value;
            _logger = logger;

            var apiKey = string.IsNullOrWhiteSpace(_options.ApiKey)
                ? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
                : _options.ApiKey;

            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                _client = string.IsNullOrWhiteSpace(_options.BaseUrl)
                    ? new AnthropicClient
                    {
                        ApiKey = apiKey,
                        Timeout = TimeSpan.FromSeconds(_options.TimeoutSeconds),
                        MaxRetries = 2,
                    }
                    : new AnthropicClient
                    {
                        ApiKey = apiKey,
                        Timeout = TimeSpan.FromSeconds(_options.TimeoutSeconds),
                        MaxRetries = 2,
                        BaseUrl = _options.BaseUrl,
                    };
            }
        }

        public bool IsEnabled => _client != null;

        /// <returns>Claude's diagnosis, or null if disabled, refused, or the call failed.</returns>
        public async Task<VisionDiagnosis?> DiagnoseAsync(
            byte[] jpeg,
            IReadOnlyList<CatalogueCrop> catalogue,
            IReadOnlyList<string> localHints,
            CancellationToken ct)
        {
            if (_client == null) return null;

            var parameters = new MessageCreateParams
            {
                Model = _options.Model,
                MaxTokens = 16000,
                // If a safety classifier declines, the request is re-served by Anthropic's recommended fallback model
                Betas = [AnthropicBeta.ServerSideFallback2026_07_01],
                Fallbacks = new Default(),
                OutputConfig = new BetaOutputConfig
                {
                    Effort = ParseEffort(_options.Effort),
                    Format = new BetaJsonOutputFormat { Schema = Schema },
                },
                // Stable prefix (instructions + catalogue) is cached across requests
                System = new List<BetaTextBlockParam>
                {
                    new() { Text = BuildSystemPrompt(catalogue), CacheControl = new BetaCacheControlEphemeral() },
                },
                Messages =
                [
                    new BetaUserMessageParam
                    {
                        Content = new List<BetaContentBlockParam>
                        {
                            new BetaImageBlockParam
                            {
                                Source = new BetaBase64ImageSource
                                {
                                    Data = Convert.ToBase64String(jpeg),
                                    MediaType = MediaType.ImageJpeg,
                                },
                            },
                            new BetaTextBlockParam { Text = BuildUserPrompt(localHints) },
                        },
                    },
                ],
            };

            try
            {
                BetaMessage response = await _client.Beta.Messages.Create(parameters, ct);

                if (response.StopReason == "refusal")
                {
                    _logger.LogWarning("Claude declined the diagnosis request");
                    return null;
                }

                var text = response.Content.Select(b => b.Value).OfType<BetaTextBlock>().FirstOrDefault()?.Text;
                if (string.IsNullOrWhiteSpace(text))
                {
                    _logger.LogWarning("Claude returned no text (stop reason {StopReason})", response.StopReason);
                    return null;
                }

                _logger.LogInformation(
                    "Claude diagnosis: input={Input} cached={Cached} output={Output} tokens",
                    response.Usage.InputTokens, response.Usage.CacheReadInputTokens, response.Usage.OutputTokens);

                return JsonSerializer.Deserialize<VisionDiagnosis>(text);
            }
            catch (AnthropicApiException ex)
            {
                _logger.LogError(ex, "Claude API error");
                return null;
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
            {
                _logger.LogError(ex, "Claude call failed");
                return null;
            }
        }

        private static Effort ParseEffort(string value) => value.Trim().ToLowerInvariant() switch
        {
            "low" => Effort.Low,
            "high" => Effort.High,
            _ => Effort.Medium,
        };

        private static string BuildUserPrompt(IReadOnlyList<string> localHints)
        {
            if (localHints.Count == 0)
                return "Diagnose the plant in this photo.";

            return "Diagnose the plant in this photo.\n\n" +
                   "Our local image model's top guesses (often wrong on field photos, use only as a hint):\n" +
                   string.Join("\n", localHints.Select(h => "- " + h));
        }

        private static string BuildSystemPrompt(IReadOnlyList<CatalogueCrop> catalogue)
        {
            var sb = new StringBuilder();
            sb.AppendLine("""
                You diagnose plant health from photos for Dr. Plant, an app used by farmers and home gardeners in Arabic-speaking countries. Each request has one photo uploaded by a user. Identify the plant and whether it is healthy or diseased, and fill in the JSON response.

                The app has detailed records for the crops and diseases in the catalogue below. When the photo shows one of these crops, set crop_id; when the condition matches a disease listed under that crop, set disease_id and leave description/symptoms/treatment null, because the app shows its own records for those.
                """);
            sb.AppendLine("<catalogue>");
            foreach (var crop in catalogue)
            {
                sb.Append($"crop_id {crop.CropId}: {crop.NameEn} ({crop.NameAr}) | diseases: ");
                sb.AppendLine(crop.Diseases.Count == 0
                    ? "none"
                    : string.Join("; ", crop.Diseases.Select(d => $"{d.Id} {d.Name}")));
            }
            sb.AppendLine("</catalogue>");
            sb.AppendLine("""

                Field rules:
                - is_plant: false when the photo does not show a plant, leaf, fruit or stem (a person, an object, a screenshot, a drawing).
                - image_usable: false when a plant is visible but too blurry, dark, distant or cropped to judge its health.
                - crop_id: the catalogue crop_id, or null for a crop not in the catalogue. Always fill crop_name_en and crop_name_ar.
                - status: "healthy", "diseased", or "unknown" when you cannot tell. Pests, nutrient deficiencies and weeds listed in the catalogue count as "diseased".
                - disease_id: only an id listed under the same crop_id; null otherwise. When status is "diseased", always fill disease_name_en and disease_name_ar.
                - When status is "diseased" and disease_id is null, fill description, symptoms and treatment in English and Arabic: 2-4 sentences each, plain words a farmer understands, Modern Standard Arabic.
                - confidence: 0-100, how likely your status and disease are correct. Visual diagnosis is uncertain: many diseases look alike, and sunburn, water stress, nutrient deficiency, pests and old-leaf senescence can look like disease. Use a value below 60 when the photo does not let you tell.
                - Treatment advice: cultural measures first (remove infected parts, spacing, watering at the base, sanitation), then active ingredients rather than brand names, and tell the user to follow the product label and local regulations.
                """);
            return sb.ToString();
        }

        /// <summary>JSON schema for structured output; all fields required, nullable where they may not apply.</summary>
        public static readonly Dictionary<string, JsonElement> Schema =
            JsonSerializer.Deserialize<Dictionary<string, JsonElement>>("""
            {
              "type": "object",
              "additionalProperties": false,
              "required": ["is_plant","image_usable","crop_id","crop_name_en","crop_name_ar","status","disease_id",
                           "disease_name_en","disease_name_ar","confidence","description_en","description_ar",
                           "symptoms_en","symptoms_ar","treatment_en","treatment_ar"],
              "properties": {
                "is_plant":        { "type": "boolean" },
                "image_usable":    { "type": "boolean" },
                "crop_id":         { "type": ["integer", "null"] },
                "crop_name_en":    { "type": "string" },
                "crop_name_ar":    { "type": "string" },
                "status":          { "type": "string", "enum": ["healthy", "diseased", "unknown"] },
                "disease_id":      { "type": ["integer", "null"] },
                "disease_name_en": { "type": ["string", "null"] },
                "disease_name_ar": { "type": ["string", "null"] },
                "confidence":      { "type": "integer" },
                "description_en":  { "type": ["string", "null"] },
                "description_ar":  { "type": ["string", "null"] },
                "symptoms_en":     { "type": ["string", "null"] },
                "symptoms_ar":     { "type": ["string", "null"] },
                "treatment_en":    { "type": ["string", "null"] },
                "treatment_ar":    { "type": ["string", "null"] }
              }
            }
            """)!;
    }
}
