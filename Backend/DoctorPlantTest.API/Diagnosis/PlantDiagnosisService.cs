using DoctorPlantTest.API.Services;
using DoctorPlantTest.BLL.DTOs.ImageDiagnosis;
using DoctorPlantTest.BLL.Services;
using DoctorPlantTest.DAL.Data;
using DoctorPlantTest.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace DoctorPlantTest.API.Diagnosis
{
    public static class DiagnosisStatus
    {
        public const string Completed = "Completed"; // diseased
        public const string Healthy = "Healthy";
        public const string Uncertain = "Uncertain";
    }

    public record DiseaseInfo(
        string Name, string? NameAr,
        string? Description, string? DescriptionAr,
        string? Symptoms, string? SymptomsAr,
        string? Treatment, string? TreatmentAr);

    public record DiagnosisAlternative(string? CropName, string? CropNameAr, string? DiseaseName, string? DiseaseNameAr, double Confidence);

    public class DiagnosisResult
    {
        public string Status { get; set; } = DiagnosisStatus.Uncertain;
        /// <summary>"local" (our model) or "ai" (Claude).</summary>
        public string Source { get; set; } = "local";
        public double Confidence { get; set; }
        /// <summary>"high" | "medium" | "low"</summary>
        public string ConfidenceLevel { get; set; } = "low";
        public string? PredictedClass { get; set; }
        public long? CropId { get; set; }
        public string? CropName { get; set; }
        public string? CropNameAr { get; set; }
        public long? DiseaseId { get; set; }
        public DiseaseInfo? Disease { get; set; }
        public List<DiagnosisAlternative> Alternatives { get; set; } = [];
        /// <summary>For Uncertain: not_a_plant | unclear_image | low_confidence | not_recognized</summary>
        public string? Reason { get; set; }
        public string? Message { get; set; }
        public string? MessageAr { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class InvalidImageException : Exception
    {
        public InvalidImageException() : base("The uploaded file is not a valid image.") { }
    }

    public class DiagnosisUnavailableException : Exception
    {
        public DiagnosisUnavailableException() : base("No diagnosis engine is available.") { }
    }

    /// <summary>
    /// Hybrid diagnosis: the local model answers when it is confident; otherwise Claude looks at the photo;
    /// if neither is confident the user is asked for a better photo instead of getting a wrong answer.
    /// </summary>
    public class PlantDiagnosisService
    {
        private readonly ILocalModel _local;
        private readonly IVisionDiagnoser _claude;
        private readonly AiCallBudget _aiBudget;
        private readonly ModelClassMap _map;
        private readonly AppDbContext _db;
        private readonly ICloudinaryService _cloudinary;
        private readonly IImageDiagnosisService _diagnoses;
        private readonly DiagnosisOptions _options;
        private readonly ILogger<PlantDiagnosisService> _logger;

        public PlantDiagnosisService(
            ILocalModel local,
            IVisionDiagnoser claude,
            AiCallBudget aiBudget,
            ModelClassMap map,
            AppDbContext db,
            ICloudinaryService cloudinary,
            IImageDiagnosisService diagnoses,
            IOptions<DiagnosisOptions> options,
            ILogger<PlantDiagnosisService> logger)
        {
            _local = local;
            _claude = claude;
            _aiBudget = aiBudget;
            _map = map;
            _db = db;
            _cloudinary = cloudinary;
            _diagnoses = diagnoses;
            _options = options.Value;
            _logger = logger;
        }

        public async Task<DiagnosisResult> DiagnoseAsync(Stream upload, long userId, long? selectedCropId, CancellationToken ct)
        {
            var jpeg = await ImagePreparer.ToNormalizedJpegAsync(upload, ct) ?? throw new InvalidImageException();

            var result = await DecideAsync(jpeg, selectedCropId, ct);

            result.ImageUrl = await TryUploadAsync(jpeg);
            await _diagnoses.AddAsync(new CreateImageDiagnosisDto
            {
                UserId = userId,
                ImageUrl = result.ImageUrl,
                DiseaseId = result.DiseaseId,
                ConfidencePercent = Math.Round((decimal)result.Confidence, 2),
                Status = $"{result.Status}/{result.Source}",
            });

            _logger.LogInformation(
                "Diagnosis user={UserId} status={Status} source={Source} confidence={Confidence:F1} disease={DiseaseId} reason={Reason}",
                userId, result.Status, result.Source, result.Confidence, result.DiseaseId, result.Reason);

            return result;
        }

        private async Task<DiagnosisResult> DecideAsync(byte[] jpeg, long? selectedCropId, CancellationToken ct)
        {
            var local = await _local.PredictAsync(jpeg, ct);

            // The user told us which plant it is: limit the local model to that crop's classes. If the model puts
            // little probability on that crop it is not recognising this photo as that plant (or this disease on it),
            // and its answer must not be used.
            var userCrop = selectedCropId == null ? null : await LoadCropAsync(selectedCropId.Value, ct);
            var cropMismatch = false;
            if (userCrop != null && local != null)
            {
                var inCrop = local.Where(p => _map.Find(p.RawClass)?.CropId == userCrop.CropId).ToList();
                var mass = inCrop.Sum(p => p.Confidence);
                if (mass >= _options.MinSelectedCropMass)
                {
                    local = inCrop
                        .Select(p => new LocalPrediction(p.RawClass, p.Confidence / mass * 100))
                        .OrderByDescending(p => p.Confidence)
                        .ToList();
                }
                else
                {
                    cropMismatch = true;
                    _logger.LogInformation(
                        "Local model puts only {Mass:F1}% on the selected crop {Crop}; top guess {Top}",
                        mass, userCrop.Name, local.FirstOrDefault()?.RawClass);
                }
            }

            var top = local?.FirstOrDefault();
            var topEntry = top == null ? null : _map.Find(top.RawClass);
            if (top != null && topEntry == null)
                _logger.LogWarning("Model class {Class} is missing from model_class_map.json", top.RawClass);

            var localRecognized = !cropMismatch && topEntry != null && topEntry.DiseaseId != _map.NotRecognizedDiseaseId;
            var alternatives = local == null ? [] : await MapAlternativesAsync(local, ct);

            var verify = _options.VerifyWithAi && _claude.IsEnabled;

            // 1) No AI second opinion wanted and the local model is confident -> answer directly (free, fast)
            if (!verify && localRecognized && top!.Confidence >= _options.HighConfidence)
                return await FromLocalAsync(top, topEntry!, "high", alternatives, ct);

            // 2) Ask the AI: always when verifying, otherwise only when the local model is unsure or does not know the crop
            if (_claude.IsEnabled)
            {
                if (_aiBudget.TryAcquire(_options.MaxAiCallsPerDay))
                {
                    var catalogue = await LoadCatalogueAsync(ct);

                    // A verifier must judge the photo independently: showing it the local guess would anchor it
                    // to that guess (which is exactly what we are checking). Hints only help a pure fallback.
                    var hints = verify
                        ? []
                        : (local ?? [])
                            .Where(p => p.Confidence >= 1)
                            .Select(p => $"{p.RawClass.Replace('_', ' ')} ({p.Confidence:F0}%)")
                            .ToList();

                    var userCropForAi = userCrop == null ? null : catalogue.FirstOrDefault(c => c.CropId == userCrop.CropId);
                    var vision = await _claude.DiagnoseAsync(jpeg, catalogue, hints, userCropForAi, ct);
                    if (vision != null)
                    {
                        var aiResult = await FromVisionAsync(vision, catalogue, alternatives, ct);
                        LogDisagreement(top, topEntry, aiResult);
                        return aiResult;
                    }
                }
                else
                {
                    _logger.LogWarning("Daily AI call cap ({Cap}) reached; answering with the local model only", _options.MaxAiCallsPerDay);
                }
            }

            if (local == null)
                throw new DiagnosisUnavailableException();

            // 3) AI unavailable: accept the local answer if it is confident enough, flagged by its level
            if (localRecognized && top!.Confidence >= _options.MinConfidence)
                return await FromLocalAsync(top, topEntry!, top.Confidence >= _options.HighConfidence ? "high" : "medium", alternatives, ct);

            // 4) Nobody is sure -> ask for a better photo rather than guess
            // When the top guesses point at different crops the model is not recognising this plant at all,
            // so asking for a better photo would not help.
            var reason = cropMismatch
                ? "crop_mismatch"
                : topEntry?.DiseaseId == _map.NotRecognizedDiseaseId
                    ? "not_recognized"
                    : GuessesDisagreeOnCrop(local) ? "possibly_unsupported" : "low_confidence";
            var uncertain = Uncertain(reason, "local", userCrop);
            // For a crop mismatch the local top guess belongs to another plant: do not present its confidence as ours
            uncertain.Confidence = cropMismatch ? 0 : top?.Confidence ?? 0;
            uncertain.PredictedClass = cropMismatch ? null : top?.RawClass;
            uncertain.Alternatives = alternatives;
            return uncertain;
        }

        /// <summary>Logs when the AI contradicts the local answer: the metric that shows how often the local model is wrong.</summary>
        private void LogDisagreement(LocalPrediction? top, ModelClassEntry? entry, DiagnosisResult ai)
        {
            if (top == null || entry == null || entry.DiseaseId == _map.NotRecognizedDiseaseId) return;

            var sameCrop = entry.CropId == ai.CropId;
            var sameOutcome = entry.DiseaseId == ai.DiseaseId ||
                              (entry.DiseaseId == _map.HealthyDiseaseId && ai.Status == DiagnosisStatus.Healthy);
            if (sameCrop && sameOutcome) return;

            _logger.LogInformation(
                "AI disagreed with local model: local={LocalClass} ({LocalConfidence:F1}%) vs ai status={AiStatus} crop={AiCrop} disease={AiDisease} ({AiConfidence:F0}%)",
                top.RawClass, top.Confidence, ai.Status, ai.CropName, ai.Disease?.Name, ai.Confidence);
        }

        private async Task<DiagnosisResult> FromLocalAsync(
            LocalPrediction top, ModelClassEntry entry, string level, List<DiagnosisAlternative> alternatives, CancellationToken ct)
        {
            var disease = await _db.Diseases.AsNoTracking().FirstOrDefaultAsync(d => d.DiseaseId == entry.DiseaseId, ct);
            var crop = entry.CropId == null ? null : await _db.Crops.AsNoTracking().FirstOrDefaultAsync(c => c.CropId == entry.CropId, ct);

            return new DiagnosisResult
            {
                Status = entry.DiseaseId == _map.HealthyDiseaseId ? DiagnosisStatus.Healthy : DiagnosisStatus.Completed,
                Source = "local",
                Confidence = top.Confidence,
                ConfidenceLevel = level,
                PredictedClass = top.RawClass,
                CropId = crop?.CropId,
                CropName = crop?.Name,
                CropNameAr = crop?.NameArabic,
                DiseaseId = disease?.DiseaseId,
                Disease = disease == null ? null : ToInfo(disease),
                Alternatives = alternatives.Skip(1).ToList(),
            };
        }

        private async Task<DiagnosisResult> FromVisionAsync(
            VisionDiagnosis v, IReadOnlyList<CatalogueCrop> catalogue, List<DiagnosisAlternative> alternatives, CancellationToken ct)
        {
            if (!v.IsPlant)
                return Uncertain("not_a_plant", "ai");

            if (!v.ImageUsable || v.Status == "unknown" || v.Confidence < _options.MinConfidence)
            {
                var u = Uncertain(v.ImageUsable ? "low_confidence" : "unclear_image", "ai");
                u.Confidence = v.Confidence;
                u.Alternatives = alternatives;
                return u;
            }

            var crop = catalogue.FirstOrDefault(c => c.CropId == v.CropId);
            var result = new DiagnosisResult
            {
                Source = "ai",
                Confidence = v.Confidence,
                ConfidenceLevel = v.Confidence >= _options.HighConfidence ? "high" : "medium",
                CropId = crop?.CropId,
                CropName = crop?.NameEn ?? v.CropNameEn,
                CropNameAr = crop?.NameAr ?? v.CropNameAr,
            };

            if (v.Status == "healthy")
            {
                var healthy = await _db.Diseases.AsNoTracking().FirstOrDefaultAsync(d => d.DiseaseId == _map.HealthyDiseaseId, ct);
                result.Status = DiagnosisStatus.Healthy;
                result.DiseaseId = healthy?.DiseaseId;
                result.Disease = healthy == null ? null : ToInfo(healthy);
                result.PredictedClass = $"{result.CropName} healthy";
                return result;
            }

            result.Status = DiagnosisStatus.Completed;

            // Only trust a disease id that the catalogue lists for that crop
            var knownDisease = crop != null && v.DiseaseId is long id && crop.Diseases.Any(d => d.Id == id);
            if (knownDisease)
            {
                var disease = await _db.Diseases.AsNoTracking().FirstAsync(d => d.DiseaseId == v.DiseaseId, ct);
                result.DiseaseId = disease.DiseaseId;
                result.Disease = ToInfo(disease);
            }
            else
            {
                // Crop or disease not in our database: use Claude's own description
                result.Disease = new DiseaseInfo(
                    v.DiseaseNameEn ?? "Unidentified condition", v.DiseaseNameAr,
                    v.DescriptionEn, v.DescriptionAr,
                    v.SymptomsEn, v.SymptomsAr,
                    v.TreatmentEn, v.TreatmentAr);
            }

            result.PredictedClass = $"{result.CropName} {result.Disease.Name}";
            return result;
        }

        /// <summary>True when the strongest guesses belong to two or more different crops.</summary>
        private bool GuessesDisagreeOnCrop(IReadOnlyList<LocalPrediction>? predictions)
        {
            if (predictions == null) return false;
            var crops = predictions
                .Where(p => p.Confidence >= 10)
                .Select(p => _map.Find(p.RawClass)?.CropId)
                .Where(c => c != null)
                .Distinct()
                .Count();
            return crops >= 2;
        }

        private DiagnosisResult Uncertain(string reason, string source, Crop? userCrop = null)
        {
            var (en, ar) = reason switch
            {
                "not_a_plant" => (
                    "We couldn't find a plant in this photo. Please photograph a leaf or the affected part of the plant.",
                    "لم نجد نباتًا في هذه الصورة. صوّر ورقة النبات أو الجزء المصاب منه."),
                "crop_mismatch" => (
                    $"Our model could not confirm this {userCrop?.Name ?? "plant"}. The photo may show a problem it was not trained on for this crop, or a different plant. We don't want to guess: please show it to an agronomist or your local agricultural extension service.",
                    $"لم يتمكن نموذجنا من تأكيد هذه النبتة ({userCrop?.NameArabic ?? "النبتة"}). قد تُظهر الصورة مشكلة لم يتدرّب عليها لهذا المحصول أو نبتة مختلفة. لا نريد التخمين: يُفضّل عرضها على مهندس زراعي أو على الإرشاد الزراعي المحلي."),
                "possibly_unsupported" => (
                    "We couldn't recognize this plant. Dr Plant currently covers 24 crops (see the Seasonal Crops page). If your plant is one of them, take a close-up of one affected leaf in daylight and try again; otherwise it may not be supported yet.",
                    "لم نتعرّف على هذه النبتة. يغطي Dr Plant حاليًا 24 محصولًا (انظر صفحة المحاصيل الموسمية). إن كانت نبتتك منها، صوّر ورقة واحدة مصابة عن قرب في ضوء النهار وحاول مرة أخرى، وإلا فقد لا تكون مدعومة بعد."),
                "not_recognized" => (
                    "We couldn't recognize the plant in this photo. Make sure it shows a leaf close up and in focus.",
                    "لم نتعرّف على النبات في هذه الصورة. تأكد أن الصورة تُظهر ورقة النبات عن قرب وبوضوح."),
                "unclear_image" => (
                    "The photo isn't clear enough to diagnose. Take a close-up of one affected leaf in daylight, in focus, filling most of the frame.",
                    "الصورة غير واضحة بما يكفي للتشخيص. صوّر ورقة واحدة مصابة عن قرب، في ضوء النهار، بحيث تكون واضحة وتملأ معظم الصورة."),
                _ => (
                    "We couldn't diagnose this photo with enough confidence. Take a close-up of one affected leaf in daylight and try again.",
                    "لم نتمكن من التشخيص بثقة كافية. صوّر ورقة واحدة مصابة عن قرب في ضوء النهار وحاول مرة أخرى."),
            };

            return new DiagnosisResult
            {
                Status = DiagnosisStatus.Uncertain,
                Source = source,
                ConfidenceLevel = "low",
                Reason = reason,
                Message = en,
                MessageAr = ar,
            };
        }

        private async Task<List<DiagnosisAlternative>> MapAlternativesAsync(IReadOnlyList<LocalPrediction> predictions, CancellationToken ct)
        {
            var entries = predictions
                .Select(p => (Prediction: p, Entry: _map.Find(p.RawClass)))
                .Where(x => x.Entry != null && x.Entry.DiseaseId != _map.NotRecognizedDiseaseId && x.Prediction.Confidence >= 5)
                .ToList();
            if (entries.Count == 0) return [];

            var diseaseIds = entries.Select(e => e.Entry!.DiseaseId).Distinct().ToList();
            var cropIds = entries.Where(e => e.Entry!.CropId != null).Select(e => e.Entry!.CropId!.Value).Distinct().ToList();
            var diseases = await _db.Diseases.AsNoTracking().Where(d => diseaseIds.Contains(d.DiseaseId)).ToDictionaryAsync(d => d.DiseaseId, ct);
            var crops = await _db.Crops.AsNoTracking().Where(c => cropIds.Contains(c.CropId)).ToDictionaryAsync(c => c.CropId, ct);

            return entries.Select(e =>
            {
                diseases.TryGetValue(e.Entry!.DiseaseId, out var d);
                Crop? c = e.Entry.CropId is long cid && crops.TryGetValue(cid, out var found) ? found : null;
                return new DiagnosisAlternative(c?.Name, c?.NameArabic, d?.Name, d?.NameAr, e.Prediction.Confidence);
            }).ToList();
        }

        private Task<Crop?> LoadCropAsync(long cropId, CancellationToken ct) =>
            _db.Crops.AsNoTracking().FirstOrDefaultAsync(c => c.CropId == cropId, ct);

        private async Task<IReadOnlyList<CatalogueCrop>> LoadCatalogueAsync(CancellationToken ct)
        {
            var crops = await _db.Crops.AsNoTracking()
                .OrderBy(c => c.CropId)
                .Select(c => new
                {
                    c.CropId,
                    c.Name,
                    c.NameArabic,
                    Diseases = c.CropDiseases
                        .Where(cd => cd.DiseaseId != _map.HealthyDiseaseId && cd.DiseaseId != _map.NotRecognizedDiseaseId)
                        .OrderBy(cd => cd.DiseaseId)
                        .Select(cd => new { cd.DiseaseId, cd.Disease!.Name })
                        .ToList(),
                })
                .ToListAsync(ct);

            return crops.Select(c => new CatalogueCrop(
                c.CropId, c.Name, c.NameArabic,
                c.Diseases.Select(d => (d.DiseaseId, d.Name)).ToList())).ToList();
        }

        private async Task<string?> TryUploadAsync(byte[] jpeg)
        {
            try
            {
                using var stream = new MemoryStream(jpeg);
                return await _cloudinary.UploadImageAsync(stream, "diagnosis.jpg", "diagnoses");
            }
            catch (Exception ex)
            {
                // A storage failure shouldn't cost the user their diagnosis
                _logger.LogError(ex, "Cloudinary upload failed for diagnosis image");
                return null;
            }
        }

        private static DiseaseInfo ToInfo(Disease d) =>
            new(d.Name, d.NameAr, d.Description, d.DescriptionAr, d.Symptoms, d.SymptomsAr, d.Treatment, d.TreatmentAr);
    }
}
