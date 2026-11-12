using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DoctorPlantTest.API.Diagnosis;
using DoctorPlantTest.DAL.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Xunit;

namespace DoctorPlantTest.Tests
{
    public class FakeLocalModel : ILocalModel
    {
        public IReadOnlyList<LocalPrediction>? Result { get; set; }
        public Task<IReadOnlyList<LocalPrediction>?> PredictAsync(byte[] jpeg, CancellationToken ct) => Task.FromResult(Result);
    }

    public class FakeVision : IVisionDiagnoser
    {
        public bool IsEnabled { get; set; } = true;
        public VisionDiagnosis? Result { get; set; }
        public int Calls { get; private set; }
        public IReadOnlyList<string> LastHints { get; private set; } = [];
        public CatalogueCrop? LastUserCrop { get; private set; }

        public Task<VisionDiagnosis?> DiagnoseAsync(byte[] jpeg, IReadOnlyList<CatalogueCrop> catalogue, IReadOnlyList<string> localHints, CatalogueCrop? userCrop, CancellationToken ct)
        {
            Calls++;
            LastHints = localHints;
            LastUserCrop = userCrop;
            return Task.FromResult(Result);
        }
    }

    /// <summary>The real API with the local model and the AI replaced by fakes.</summary>
    public sealed class DiagnosisApiFactory : ApiFactory
    {
        public FakeLocalModel Local { get; } = new();
        public FakeVision Vision { get; } = new();
        private readonly Dictionary<string, string> _settings;

        public DiagnosisApiFactory(Dictionary<string, string>? settings = null) => _settings = settings ?? [];

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            foreach (var (k, v) in _settings) builder.UseSetting(k, v);
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<ILocalModel>();
                services.RemoveAll<IVisionDiagnoser>();
                services.AddSingleton<ILocalModel>(Local);
                services.AddSingleton<IVisionDiagnoser>(Vision);
            });
        }

        /// <summary>Minimal reference data: Apples (24) and Apricots (3) with a few diseases, plus Healthy/Not Recognize.</summary>
        public async Task SeedAsync()
        {
            await WithDb(async db =>
            {
                db.Diseases.AddRange(
                    new Disease { DiseaseId = 1, Name = "Apple Scab", NameAr = "جرب التفاح", Description = "d", Symptoms = "s", Treatment = "t", TreatmentAr = "علاج" },
                    new Disease { DiseaseId = 2, Name = "Black Rot", Description = "d", Symptoms = "s", Treatment = "t" },
                    new Disease { DiseaseId = 5, Name = "Shot Hole", NameAr = "الثقوب الطلقية", Description = "d", Symptoms = "s", Treatment = "t" },
                    new Disease { DiseaseId = 82, Name = "Healthy", NameAr = "سليم", Description = "d", Symptoms = "s", Treatment = "t" },
                    new Disease { DiseaseId = 83, Name = "Not Recognize", Description = "d", Symptoms = "s", Treatment = "t" });
                db.Crops.AddRange(
                    new Crop { CropId = 24, Name = "Apples", NameArabic = "التفاح", UserId = 1 },
                    new Crop { CropId = 3, Name = "Apricot", NameArabic = "المشمش", UserId = 1 });
                db.CropDiseases.AddRange(
                    new CropDisease { CropId = 24, DiseaseId = 1 }, new CropDisease { CropId = 24, DiseaseId = 2 },
                    new CropDisease { CropId = 24, DiseaseId = 82 }, new CropDisease { CropId = 3, DiseaseId = 5 },
                    new CropDisease { CropId = 3, DiseaseId = 82 });
                await db.SaveChangesAsync();
            });
        }

        public static VisionDiagnosis AiSays(long? cropId, string status, long? diseaseId, double confidence, bool isPlant = true, bool usable = true) =>
            new()
            {
                IsPlant = isPlant, ImageUsable = usable, CropId = cropId, CropNameEn = "Apples", CropNameAr = "تفاح",
                Status = status, DiseaseId = diseaseId, DiseaseNameEn = "Apple Scab", Confidence = confidence,
            };
    }

    /// <summary>
    /// The scenario that motivated these tests: the local model said "Apricot shot hole, 99%" about an apple leaf.
    /// </summary>
    public class DiagnosisFlowTests
    {
        private static readonly byte[] Photo = File.ReadAllBytes(Path.Combine(AppContext.BaseDirectory, "TestData", "rot6_640x480.jpg"));

        private static LocalPrediction[] Guess(string cls, double conf, params (string Cls, double Conf)[] others) =>
            new[] { new LocalPrediction(cls, conf) }.Concat(others.Select(o => new LocalPrediction(o.Cls, o.Conf))).ToArray();

        private static async Task<(HttpStatusCode Status, JsonElement Body)> PredictAsync(DiagnosisApiFactory f, TestUser user, long? cropId = null)
        {
            using var form = new MultipartFormDataContent();
            if (cropId != null) form.Add(new StringContent(cropId.Value.ToString()), "cropId");
            var file = new ByteArrayContent(Photo);
            file.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
            form.Add(file, "file", "leaf.jpg");
            var response = await user.Client.PostAsync("/api/Diagnoses/predict", form);
            var body = response.Content.Headers.ContentType?.MediaType == "application/json"
                ? await response.Content.ReadFromJsonAsync<JsonElement>() : default;
            return (response.StatusCode, body);
        }

        private static async Task<(DiagnosisApiFactory F, TestUser U)> StartAsync(Dictionary<string, string>? settings = null)
        {
            var f = new DiagnosisApiFactory(settings);
            f.CreateClient(); // starts the host
            await f.SeedAsync();
            return (f, await f.RegisterAsync());
        }

        [Fact]
        public async Task Without_an_AI_a_confident_local_answer_is_returned_directly()
        {
            var (f, user) = await StartAsync();
            f.Vision.IsEnabled = false;
            f.Local.Result = Guess("Apple Apple scab", 97);

            var (status, body) = await PredictAsync(f, user);

            Assert.Equal(HttpStatusCode.OK, status);
            Assert.Equal("local", body.GetProperty("source").GetString());
            Assert.Equal(24, body.GetProperty("cropId").GetInt64());
            Assert.Equal(1, body.GetProperty("diseaseId").GetInt64());
            Assert.Equal(0, f.Vision.Calls);
        }

        [Fact]
        public async Task A_confident_but_wrong_local_answer_is_corrected_by_the_AI_second_opinion()
        {
            var (f, user) = await StartAsync();
            f.Local.Result = Guess("Apricot shot hole", 98.9, ("Potato Early blight", 0.3)); // the real apple-leaf mistake
            f.Vision.Result = DiagnosisApiFactory.AiSays(cropId: 24, status: "diseased", diseaseId: 1, confidence: 90);

            var (status, body) = await PredictAsync(f, user);

            Assert.Equal(HttpStatusCode.OK, status);
            Assert.Equal("ai", body.GetProperty("source").GetString());
            Assert.Equal(24, body.GetProperty("cropId").GetInt64());           // Apples, not Apricot
            Assert.Equal(1, body.GetProperty("diseaseId").GetInt64());
            Assert.Equal(1, f.Vision.Calls);
        }

        [Fact]
        public async Task The_verifier_is_not_shown_the_local_guess_so_it_cannot_be_anchored_by_it()
        {
            var (f, user) = await StartAsync();
            f.Local.Result = Guess("Apricot shot hole", 98.9);
            f.Vision.Result = DiagnosisApiFactory.AiSays(24, "diseased", 1, 90);

            await PredictAsync(f, user);

            Assert.Empty(f.Vision.LastHints);
        }

        [Fact]
        public async Task With_verification_turned_off_a_confident_local_answer_skips_the_AI()
        {
            var (f, user) = await StartAsync(new() { ["Diagnosis:VerifyWithAi"] = "false" });
            f.Local.Result = Guess("Apple Apple scab", 97);
            f.Vision.Result = DiagnosisApiFactory.AiSays(24, "diseased", 2, 90);

            var (_, body) = await PredictAsync(f, user);

            Assert.Equal("local", body.GetProperty("source").GetString());
            Assert.Equal(0, f.Vision.Calls);
        }

        [Fact]
        public async Task If_the_AI_is_unsure_a_confident_local_answer_is_not_shown_as_fact()
        {
            var (f, user) = await StartAsync();
            f.Local.Result = Guess("Apricot shot hole", 98.9);
            f.Vision.Result = DiagnosisApiFactory.AiSays(24, "diseased", 1, confidence: 35);

            var (status, body) = await PredictAsync(f, user);

            Assert.Equal(HttpStatusCode.OK, status);
            Assert.Equal("Uncertain", body.GetProperty("status").GetString());
            Assert.Equal(JsonValueKind.Null, body.GetProperty("diseaseId").ValueKind);
        }

        [Fact]
        public async Task A_photo_that_is_not_a_plant_is_reported_even_if_the_local_model_is_confident()
        {
            var (f, user) = await StartAsync();
            f.Local.Result = Guess("Apple Apple scab", 91);
            f.Vision.Result = DiagnosisApiFactory.AiSays(null, "unknown", null, 95, isPlant: false, usable: false);

            var (_, body) = await PredictAsync(f, user);

            Assert.Equal("Uncertain", body.GetProperty("status").GetString());
            Assert.Equal("not_a_plant", body.GetProperty("reason").GetString());
        }

        [Fact]
        public async Task If_the_AI_call_fails_the_local_answer_is_used()
        {
            var (f, user) = await StartAsync();
            f.Local.Result = Guess("Apple Apple scab", 97);
            f.Vision.Result = null; // outage / refusal

            var (status, body) = await PredictAsync(f, user);

            Assert.Equal(HttpStatusCode.OK, status);
            Assert.Equal("local", body.GetProperty("source").GetString());
            Assert.Equal(1, body.GetProperty("diseaseId").GetInt64());
        }

        [Fact]
        public async Task The_AI_cannot_assign_a_disease_that_does_not_belong_to_the_crop()
        {
            var (f, user) = await StartAsync();
            f.Local.Result = Guess("Apricot shot hole", 98.9);
            // Shot Hole (5) is an Apricot disease, not an Apple one
            f.Vision.Result = DiagnosisApiFactory.AiSays(cropId: 24, status: "diseased", diseaseId: 5, confidence: 90);

            var (_, body) = await PredictAsync(f, user);

            Assert.Equal(JsonValueKind.Null, body.GetProperty("diseaseId").ValueKind);
            Assert.Equal(24, body.GetProperty("cropId").GetInt64());
        }

        [Fact]
        public async Task The_daily_AI_cap_stops_paid_calls_and_the_local_model_takes_over()
        {
            var (f, user) = await StartAsync(new() { ["Diagnosis:MaxAiCallsPerDay"] = "2" });
            f.Local.Result = Guess("Apple Apple scab", 97);
            f.Vision.Result = DiagnosisApiFactory.AiSays(24, "diseased", 1, 90);

            var sources = new List<string>();
            for (var i = 0; i < 4; i++)
                sources.Add((await PredictAsync(f, user)).Body.GetProperty("source").GetString()!);

            Assert.Equal(new[] { "ai", "ai", "local", "local" }, sources);
            Assert.Equal(2, f.Vision.Calls);
        }

        [Fact]
        public async Task Guesses_spread_over_different_crops_mean_an_unsupported_plant_not_a_bad_photo()
        {
            var (f, user) = await StartAsync();
            f.Vision.IsEnabled = false;
            f.Local.Result = Guess("Guava_ Canker", 30.1, ("Potato Early blight", 27.8), ("Pepper bell Bacterial spot", 16.5));

            var (_, body) = await PredictAsync(f, user);

            Assert.Equal("Uncertain", body.GetProperty("status").GetString());
            Assert.Equal("possibly_unsupported", body.GetProperty("reason").GetString());
            Assert.Contains("24 crops", body.GetProperty("message").GetString());
        }

        [Fact]
        public async Task Low_confidence_within_one_crop_asks_for_a_better_photo()
        {
            var (f, user) = await StartAsync();
            f.Vision.IsEnabled = false;
            f.Local.Result = Guess("Apple Apple scab", 45, ("Apple Black rot", 30));

            var (_, body) = await PredictAsync(f, user);

            Assert.Equal("low_confidence", body.GetProperty("reason").GetString());
        }

        [Fact]
        public async Task When_both_the_model_and_the_AI_are_down_the_user_gets_503()
        {
            var (f, user) = await StartAsync();
            f.Local.Result = null;
            f.Vision.Result = null;

            var (status, _) = await PredictAsync(f, user);

            Assert.Equal(HttpStatusCode.ServiceUnavailable, status);
        }

        // ---------- the user selects the crop ----------

        [Fact]
        public async Task Apple_leaf_called_apricot_by_the_model_is_not_diagnosed_when_the_user_selected_apples()
        {
            var (f, user) = await StartAsync();
            f.Vision.IsEnabled = false;
            // the real mistake: 98.9% Apricot shot hole, almost nothing on any apple class
            f.Local.Result = Guess("Apricot shot hole", 98.9, ("Apple Apple scab", 0.4), ("Potato Early blight", 0.3));

            var (status, body) = await PredictAsync(f, user, cropId: 24);

            Assert.Equal(HttpStatusCode.OK, status);
            Assert.Equal("Uncertain", body.GetProperty("status").GetString());
            Assert.Equal("crop_mismatch", body.GetProperty("reason").GetString());
            Assert.Contains("Apples", body.GetProperty("message").GetString());
            Assert.Equal(JsonValueKind.Null, body.GetProperty("diseaseId").ValueKind);
            Assert.Equal(0, body.GetProperty("confidence").GetDouble()); // not the apricot confidence
        }

        [Fact]
        public async Task The_selected_crop_limits_the_answer_to_that_crops_classes_and_rescales_confidence()
        {
            var (f, user) = await StartAsync();
            f.Vision.IsEnabled = false;
            // 75% of the probability is on apple classes: scab 50, black rot 25. Apricot gets 25.
            f.Local.Result = Guess("Apple Apple scab", 50, ("Apple Black rot", 25), ("Apricot shot hole", 25));

            var (_, body) = await PredictAsync(f, user, cropId: 24);

            Assert.Equal("local", body.GetProperty("source").GetString());
            Assert.Equal(24, body.GetProperty("cropId").GetInt64());
            Assert.Equal(1, body.GetProperty("diseaseId").GetInt64());
            Assert.Equal(66.67, body.GetProperty("confidence").GetDouble(), 1); // 50 / 75
        }

        [Fact]
        public async Task A_confident_apricot_answer_is_still_accepted_when_the_user_selected_apricots()
        {
            var (f, user) = await StartAsync();
            f.Vision.IsEnabled = false;
            f.Local.Result = Guess("Apricot shot hole", 97, ("Apple Apple scab", 1));

            var (_, body) = await PredictAsync(f, user, cropId: 3);

            Assert.Equal(3, body.GetProperty("cropId").GetInt64());
            Assert.Equal(5, body.GetProperty("diseaseId").GetInt64());
        }

        [Fact]
        public async Task The_selected_crop_is_given_to_the_AI_as_context()
        {
            var (f, user) = await StartAsync();
            f.Local.Result = Guess("Apricot shot hole", 98.9);
            f.Vision.Result = DiagnosisApiFactory.AiSays(24, "diseased", 1, 90);

            await PredictAsync(f, user, cropId: 24);

            Assert.Equal("Apples", f.Vision.LastUserCrop?.NameEn);
        }

        [Fact]
        public async Task An_unknown_crop_id_is_ignored_and_the_normal_flow_runs()
        {
            var (f, user) = await StartAsync();
            f.Vision.IsEnabled = false;
            f.Local.Result = Guess("Apple Apple scab", 97);

            var (status, body) = await PredictAsync(f, user, cropId: 9999);

            Assert.Equal(HttpStatusCode.OK, status);
            Assert.Equal(1, body.GetProperty("diseaseId").GetInt64());
        }

        [Fact]
        public async Task The_diagnosis_is_saved_for_the_user_with_its_source()
        {
            var (f, user) = await StartAsync();
            f.Local.Result = Guess("Apricot shot hole", 98.9);
            f.Vision.Result = DiagnosisApiFactory.AiSays(24, "diseased", 1, 90);

            await PredictAsync(f, user);

            var row = await f.WithDb(db => db.ImageDiagnoses.SingleAsync(d => d.UserId == user.Id));
            Assert.Equal("Completed/ai", row.Status);
            Assert.Equal(1, row.DiseaseId);

            var mine = await user.Client.GetFromJsonAsync<JsonElement>("/api/Diagnoses/mine");
            Assert.Equal(1, mine.GetProperty("items").GetArrayLength());
        }
    }
}
