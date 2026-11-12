using System.Text.Json;
using System.Text.Json.Serialization;

namespace DoctorPlantTest.API.Diagnosis
{
    public record ModelClassEntry(
        [property: JsonPropertyName("class")] string Class,
        [property: JsonPropertyName("cropId")] long? CropId,
        [property: JsonPropertyName("diseaseId")] long DiseaseId);

    /// <summary>
    /// Explicit mapping from the local model's output classes to CropId/DiseaseId in the database
    /// (Diagnosis/model_class_map.json). Replaces the old fuzzy name matching.
    /// </summary>
    public class ModelClassMap
    {
        private readonly Dictionary<string, ModelClassEntry> _byClass;

        public long HealthyDiseaseId { get; }
        public long NotRecognizedDiseaseId { get; }

        public ModelClassMap(string jsonPath)
        {
            using var stream = File.OpenRead(jsonPath);
            var doc = JsonSerializer.Deserialize<MapFile>(stream)
                      ?? throw new InvalidOperationException($"Empty class map: {jsonPath}");

            HealthyDiseaseId = doc.HealthyDiseaseId;
            NotRecognizedDiseaseId = doc.NotRecognizedDiseaseId;
            _byClass = doc.Classes.ToDictionary(c => Normalize(c.Class), StringComparer.OrdinalIgnoreCase);
        }

        public ModelClassEntry? Find(string rawClass) =>
            _byClass.TryGetValue(Normalize(rawClass), out var entry) ? entry : null;

        private static string Normalize(string s) => s.Trim();

        private class MapFile
        {
            [JsonPropertyName("healthyDiseaseId")] public long HealthyDiseaseId { get; set; }
            [JsonPropertyName("notRecognizedDiseaseId")] public long NotRecognizedDiseaseId { get; set; }
            [JsonPropertyName("classes")] public List<ModelClassEntry> Classes { get; set; } = [];
        }
    }
}
