using System.Text.Json;
using System.Text.RegularExpressions;
using DoctorPlantTest.API.Diagnosis;
using Xunit;

namespace DoctorPlantTest.Tests
{
    /// <summary>
    /// Guards the link between what the AI model outputs and the diseases/crops in the database.
    /// If someone retrains the model (new class names) or edits the seed data, these fail instead of
    /// showing farmers a wrong or missing diagnosis.
    /// </summary>
    public class ModelClassMapTests
    {
        private static readonly string Root = FindRepoRoot();

        private static string FindRepoRoot()
        {
            var dir = new DirectoryInfo(AppContext.BaseDirectory);
            while (dir != null && !File.Exists(Path.Combine(dir.FullName, "AI-model", "class_names.json")))
                dir = dir.Parent;
            return dir?.FullName ?? throw new InvalidOperationException("Repo root not found");
        }

        private static readonly string MapPath = Path.Combine(Root, "Backend", "DoctorPlantTest.API", "Diagnosis", "model_class_map.json");
        private static readonly string SeedPath = Path.Combine(Root, "Backend", "DoctorPlantTest.API", "Seed", "reference_data.sql");
        private static readonly string ClassNamesPath = Path.Combine(Root, "AI-model", "class_names.json");

        private static readonly ModelClassMap Map = new(MapPath);
        private static readonly string[] ModelClasses = JsonSerializer.Deserialize<string[]>(File.ReadAllText(ClassNamesPath))!;
        private static readonly string Seed = File.ReadAllText(SeedPath);

        private static HashSet<long> DiseaseIds() =>
            Regex.Matches(Seed, @"INSERT INTO `Diseases` \([^)]*\) VALUES \((\d+),").Select(m => long.Parse(m.Groups[1].Value)).ToHashSet();

        private static HashSet<long> CropIds() =>
            Regex.Matches(Seed, @"INSERT INTO `Crops` \([^)]*\) VALUES \((\d+),").Select(m => long.Parse(m.Groups[1].Value)).ToHashSet();

        private static HashSet<(long Crop, long Disease)> CropDiseaseLinks() =>
            Regex.Matches(Seed, @"INSERT INTO `CropDiseases` \([^)]*\) VALUES \((\d+),(\d+)\)")
                .Select(m => (long.Parse(m.Groups[1].Value), long.Parse(m.Groups[2].Value))).ToHashSet();

        [Fact]
        public void The_seed_data_is_what_the_test_expects()
        {
            Assert.Equal(83, DiseaseIds().Count);
            Assert.Equal(24, CropIds().Count);
            Assert.NotEmpty(CropDiseaseLinks());
        }

        [Fact]
        public void Every_class_the_model_can_output_has_a_mapping()
        {
            var missing = ModelClasses.Where(c => Map.Find(c) == null).ToList();
            Assert.True(missing.Count == 0, "Classes without a mapping: " + string.Join(", ", missing));
        }

        [Fact]
        public void The_map_has_no_entries_for_classes_the_model_does_not_have()
        {
            var json = JsonDocument.Parse(File.ReadAllText(MapPath)).RootElement.GetProperty("classes");
            var extra = json.EnumerateArray().Select(e => e.GetProperty("class").GetString()!)
                .Where(c => !ModelClasses.Contains(c)).ToList();
            Assert.True(extra.Count == 0, "Mapped classes the model does not output: " + string.Join(", ", extra));
        }

        [Fact]
        public void Every_mapped_disease_and_crop_exists_in_the_database_seed()
        {
            var diseases = DiseaseIds();
            var crops = CropIds();

            foreach (var cls in ModelClasses)
            {
                var entry = Map.Find(cls)!;
                Assert.True(diseases.Contains(entry.DiseaseId), $"{cls}: disease {entry.DiseaseId} not in seed");
                if (entry.DiseaseId != Map.NotRecognizedDiseaseId)
                    Assert.True(entry.CropId is long c && crops.Contains(c), $"{cls}: crop {entry.CropId} not in seed");
            }
        }

        [Fact]
        public void Every_mapped_disease_is_linked_to_its_crop()
        {
            var links = CropDiseaseLinks();
            foreach (var cls in ModelClasses)
            {
                var entry = Map.Find(cls)!;
                if (entry.DiseaseId == Map.NotRecognizedDiseaseId) continue;
                Assert.True(links.Contains((entry.CropId!.Value, entry.DiseaseId)),
                    $"{cls}: crop {entry.CropId} is not linked to disease {entry.DiseaseId} in CropDiseases");
            }
        }

        [Fact]
        public void Same_named_disease_on_different_crops_stays_on_the_right_crop()
        {
            // Regression: name matching used to merge all of these into one record
            Assert.Equal(24, Map.Find("Apple Black rot")!.CropId);
            Assert.Equal(21, Map.Find("Grape Black_rot")!.CropId);
            Assert.Equal(22, Map.Find("Cauliflower Black Rot")!.CropId);
            Assert.NotEqual(Map.Find("Apple healthy")!.CropId, Map.Find("Tomato healthy")!.CropId);
        }

        [Fact]
        public void Healthy_classes_point_to_the_healthy_record_and_unknown_to_not_recognized()
        {
            foreach (var cls in ModelClasses.Where(c => c.Contains("ealthy", StringComparison.OrdinalIgnoreCase) || c.Contains("Fresh leaf")))
                Assert.Equal(Map.HealthyDiseaseId, Map.Find(cls)!.DiseaseId);

            Assert.Equal(Map.NotRecognizedDiseaseId, Map.Find("Not Recognize")!.DiseaseId);
            Assert.Null(Map.Find("Not Recognize")!.CropId);
        }

        [Fact]
        public void Unknown_class_returns_null_instead_of_guessing()
        {
            Assert.Null(Map.Find("Banana Black Sigatoka"));
        }
    }
}
