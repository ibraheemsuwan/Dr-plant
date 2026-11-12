using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace DoctorPlantTest.API.Diagnosis
{
    public record LocalPrediction(string RawClass, double Confidence);

    /// <summary>Calls the Flask/Keras model service. Returns null when the service is unreachable or errors.</summary>
    public class LocalModelClient
    {
        public const string HttpClientName = "local-model";

        private readonly IHttpClientFactory _httpClientFactory;
        private readonly LocalModelOptions _options;
        private readonly ILogger<LocalModelClient> _logger;

        public LocalModelClient(IHttpClientFactory httpClientFactory, IOptions<LocalModelOptions> options, ILogger<LocalModelClient> logger)
        {
            _httpClientFactory = httpClientFactory;
            _options = options.Value;
            _logger = logger;
        }

        public bool IsConfigured => !string.IsNullOrWhiteSpace(_options.BaseUrl);

        /// <returns>Top predictions, best first; null if the model service failed.</returns>
        public async Task<IReadOnlyList<LocalPrediction>?> PredictAsync(byte[] jpeg, CancellationToken ct)
        {
            if (!IsConfigured) return null;

            var client = _httpClientFactory.CreateClient(HttpClientName);
            client.Timeout = TimeSpan.FromSeconds(_options.TimeoutSeconds);

            using var content = new MultipartFormDataContent();
            var image = new ByteArrayContent(jpeg);
            image.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
            content.Add(image, "file", "image.jpg");

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{_options.BaseUrl.TrimEnd('/')}/predict") { Content = content };
            if (!string.IsNullOrWhiteSpace(_options.ApiKey))
                request.Headers.Add("X-Api-Key", _options.ApiKey);

            try
            {
                using var response = await client.SendAsync(request, ct);
                var body = await response.Content.ReadAsStringAsync(ct);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Local model returned {Status}: {Body}", (int)response.StatusCode, body);
                    return null;
                }

                return Parse(body);
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
            {
                _logger.LogError(ex, "Local model service call failed");
                return null;
            }
        }

        private static IReadOnlyList<LocalPrediction> Parse(string body)
        {
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            if (root.TryGetProperty("top", out var top) && top.ValueKind == JsonValueKind.Array)
            {
                return top.EnumerateArray()
                    .Select(p => new LocalPrediction(p.GetProperty("raw_class").GetString() ?? "", p.GetProperty("confidence").GetDouble()))
                    .ToList();
            }

            // Older service version: single prediction
            var cls = root.TryGetProperty("raw_class", out var rc) ? rc.GetString() : root.GetProperty("class").GetString();
            return [new LocalPrediction(cls ?? "", root.GetProperty("confidence").GetDouble())];
        }
    }
}
