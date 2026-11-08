using DoctorPlantTest.API.Services;
using DoctorPlantTest.BLL.DTOs.ImageDiagnosis;
using DoctorPlantTest.BLL.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text.Json;

namespace DoctorPlantTest.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DiagnosesController : ControllerBase
    {
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
            { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

        private static readonly string[] PlantNames =
        {
            "Pepper bell",
            "Apple",
            "Apricot",
            "Carambola",
            "Cauliflower",
            "Corn",
            "Cucumber",
            "Eggplant",
            "Grape",
            "Guava",
            "Lemon",
            "Lettuce",
            "Mango",
            "Olive",
            "Orange",
            "Pea",
            "Pomegranate",
            "Potato",
            "Pumpkin",
            "Radish",
            "Soybean",
            "Strawberry",
            "Tomato",
            "Watermelon" 
        };

        private readonly IImageDiagnosisService _diagnosisService;
        private readonly IDiseaseService _diseaseService;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ICloudinaryService _cloudinary;
        private readonly IConfiguration _configuration;
        private readonly ILogger<DiagnosesController> _logger;

        public DiagnosesController(
            IImageDiagnosisService diagnosisService,
            IDiseaseService diseaseService,
            IHttpClientFactory httpClientFactory,
            ICloudinaryService cloudinary,
            IConfiguration configuration,
            ILogger<DiagnosesController> logger)
        {
            _diagnosisService = diagnosisService;
            _diseaseService = diseaseService;
            _httpClientFactory = httpClientFactory;
            _cloudinary = cloudinary;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost("predict")]
        [Authorize]
        public async Task<IActionResult> Predict(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No image uploaded." });

            var extension = Path.GetExtension(file.FileName);
            if (!AllowedExtensions.Contains(extension))
                return BadRequest(new { message = "Invalid file type. Only .jpg, .jpeg, .png, .gif, .webp are allowed." });

            var flaskBaseUrl = _configuration["FlaskApi:BaseUrl"];
            if (string.IsNullOrWhiteSpace(flaskBaseUrl))
                return StatusCode(500, new { message = "Flask API BaseUrl is not configured." });

            string imageUrl;

            try
            {
                imageUrl = await _cloudinary.UploadImageAsync(file, "diagnoses");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cloudinary upload failed");

                return StatusCode(500, new
                {
                    message = "The image size exceeds 10 MB. Please upload a smaller image.",
                    error = ex.Message
                });
            }

            var client = _httpClientFactory.CreateClient();

            using var content = new MultipartFormDataContent();
            await using var stream = file.OpenReadStream();
            using var streamContent = new StreamContent(stream);

            streamContent.Headers.ContentType = new MediaTypeHeaderValue(
                string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType
            );

            content.Add(streamContent, "file", file.FileName);

            var response = await client.PostAsync($"{flaskBaseUrl}/predict", content);
            var responseBody = await response.Content.ReadAsStringAsync();

            _logger.LogInformation("Flask Response: {Response}", responseBody);

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, new
                {
                    message = "Flask API error",
                    details = responseBody
                });
            }

            string predictedClass = "";
            decimal confidence = 0;

            try
            {
                using var jsonDoc = JsonDocument.Parse(responseBody);
                var root = jsonDoc.RootElement;

                if (root.TryGetProperty("predicted_class", out var p1))
                    predictedClass = p1.GetString() ?? "";
                else if (root.TryGetProperty("predictedClass", out var p2))
                    predictedClass = p2.GetString() ?? "";
                else if (root.TryGetProperty("class", out var p3))
                    predictedClass = p3.GetString() ?? "";
                else if (root.TryGetProperty("prediction", out var p4))
                    predictedClass = p4.GetString() ?? "";
                else if (root.TryGetProperty("label", out var p5))
                    predictedClass = p5.GetString() ?? "";

                if (root.TryGetProperty("confidence", out var c) && c.ValueKind == JsonValueKind.Number)
                    confidence = c.GetDecimal();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse Flask response");
                return StatusCode(500, new
                {
                    message = "Invalid Flask response.",
                    details = responseBody
                });
            }

            if (string.IsNullOrWhiteSpace(predictedClass))
            {
                return StatusCode(500, new
                {
                    message = "No predicted class",
                    flaskResponse = responseBody
                });
            }

            var diseaseName = GetDiseaseNameFromPredictedClass(predictedClass);
            var diseaseKey = ToKey(diseaseName);

            _logger.LogInformation("PredictedClass = {PredictedClass}", predictedClass);
            _logger.LogInformation("ExtractedDiseaseName = {DiseaseName}", diseaseName);
            _logger.LogInformation("DiseaseKey = {DiseaseKey}", diseaseKey);

            var allDiseases = (await _diseaseService.GetAllAsync()).ToList();

            var disease = allDiseases.FirstOrDefault(d =>
                string.Equals(d.Name, diseaseName, StringComparison.OrdinalIgnoreCase));

            disease ??= allDiseases.FirstOrDefault(d =>
            {
                var dbKey = ToKey(d.Name);

                return dbKey == diseaseKey ||
                       diseaseKey.Contains(dbKey) ||
                       dbKey.Contains(diseaseKey);
            });

            if (disease == null)
            {
                return NotFound(new
                {
                    message = "Disease not found in database.",
                    predictedClass,
                    extractedDiseaseName = diseaseName,
                    diseaseKey,
                    availableExample = allDiseases.Take(10).Select(d => d.Name)
                });
            }

            await _diagnosisService.AddAsync(new CreateImageDiagnosisDto
            {
                ImageUrl = imageUrl,
                DiseaseId = disease.DiseaseId,
                ConfidencePercent = confidence,
                Status = "Completed"
            });

            return Ok(new
            {
                imageUrl,
                predictedClass,
                diseaseName = disease.Name,
                diseaseId = disease.DiseaseId,
                confidence,

                description = disease.Description,
                descriptionAr = disease.DescriptionAr,
                symptoms = disease.Symptoms,
                symptomsAr = disease.SymptomsAr,
                treatment = disease.Treatment,
                treatmentAr = disease.TreatmentAr,

                disease = new
                {
                    disease.DiseaseId,
                    disease.Name,
                    disease.NameAr,
                    disease.Description,
                    disease.DescriptionAr,
                    disease.Symptoms,
                    disease.SymptomsAr,
                    disease.Treatment,
                    disease.TreatmentAr
                }
            });
        }

        private static string GetDiseaseNameFromPredictedClass(string predictedClass)
        {
            if (string.IsNullOrWhiteSpace(predictedClass))
                return "";

            var value = CleanText(predictedClass);

            if (IsHealthyClass(value))
                return "Healthy";

            if (value.Contains("not recognize", StringComparison.OrdinalIgnoreCase) ||
                value.Contains("not recognized", StringComparison.OrdinalIgnoreCase))
                return "Not Recognize";

            foreach (var plant in PlantNames.OrderByDescending(p => p.Length))
            {
                if (value.StartsWith(plant + " ", StringComparison.OrdinalIgnoreCase))
                {
                    value = value.Substring(plant.Length).Trim();
                    break;
                }
            }

            return NormalizeDiseaseName(value);
        }

        private static bool IsHealthyClass(string predictedClass)
        {
            if (string.IsNullOrWhiteSpace(predictedClass))
                return false;

            var value = predictedClass.ToLower();

            return value.Contains("healthy") ||
                   value.Contains("normal") ||
                   value.Contains("fresh");
        }

        private static string NormalizeDiseaseName(string rawDiseaseName)
        {
            var name = CleanText(rawDiseaseName);

            return name.ToLower() switch
            {
                "apple scab" => "Apple Scab",
                "black rot" => "Black Rot",
                "cedar apple rust" => "Cedar Apple Rust",
                "blight leaf disease" => "Blight Leaf Disease",
                "shot hole" => "Shot Hole",

                "anthracnose disease" => "Anthracnose",
                "anthracnose" => "Anthracnose",
                "bed bugs disease" => "Bed Bugs Disease",
                "early blight disease" => "Early Blight Disease",
                "fruit borer disease" => "Fruit Borer Disease",
                "hooded hopper insect disease" => "Hooded Hopper Insect Disease",
                "leaf insect pest disease" => "Leaf Insect Pest Disease",
                "stem borer disease" => "Stem Borer Disease",

                "alternaria leaf spot" => "Alternaria Leaf Spot",
                "bacterial spot rot" => "Bacterial Spot Rot",
                "cabbage aphid colony" => "Cabbage Aphid Colony",
                "downy mildew" => "Downy Mildew",
                "downey mildew" => "Downy Mildew",
                "club root" => "Club Root",
                "ring spot" => "Ring Spot",

                "cercospora leaf spot gray leaf spot" => "Cercospora Leaf Spot",
                "gray leaf spot" => "Cercospora Leaf Spot",
                "cercospora leaf spot" => "Cercospora Leaf Spot",
                "common rust" => "Common Rust",
                "northern leaf blight" => "Northern Leaf Blight",
                "powdery mildew" => "Powdery Mildew",
                "powder mildew" => "Powdery Mildew",

                "insect pest disease" => "Insect Pest Disease",
                "leaf spot disease" => "Leaf Spot Disease",
                "mosaic virus disease" => "Mosaic Virus Disease",
                "small leaf disease" => "Small Leaf Disease",
                "white mold disease" => "White Mold Disease",
                "wilt disease" => "Wilt Disease",

                "esca black measles" => "Esca (Black Measles)",
                "leaf blight isariopsis leaf spot" => "Leaf Blight (Isariopsis Leaf Spot)",

                "canker" => "Canker",
                "dot" => "Dot",
                "mummification" => "Mummification",
                "rust" => "Rust",

                "bacterial blight" => "Bacterial Blight",
                "bacterial canker" => "Bacterial Canker",
                "citrus canker" => "Citrus Canker",
                "citrus canker diseases leaf" => "Citrus Canker Diseases Leaf",
                "curl virus" => "Curl Virus",
                "deficiency leaf" => "Deficiency Leaf",
                "dry leaf" => "Dry Leaf",
                "sooty mould" => "Sooty Mould",
                "spider mites" => "Spider Mites",

                "bacterial" => "Bacterial",
                "downy mildew on lettuce" => "Downy Mildew on Lettuce",
                "powdery mildew on lettuce" => "Powdery Mildew on Lettuce",
                "septoria light" => "Septoria Blight on Lettuce",
                "septoria blight" => "Septoria Blight on Lettuce",
                "septoria blight on lettuce" => "Septoria Blight on Lettuce",
                "shepherd purse weeds" => "Shepherd Purse Weeds",
                "viral" => "Viral",

                "cutting weevil" => "Cutting Weevil",
                "die back" => "Die Back",
                "gall midge" => "Gall Midge",
                "aculus olearius" => "Aculus olearius",
                "peacock spot" => "Peacock Spot",

                "citrus nutrient deficiency yellow leaf" => "Citrus Nutrient Deficiency Yellow",
                "citrus nutrient deficiency yellow" => "Citrus Nutrient Deficiency Yellow",
                "multiple diseases leaf" => "Multiple Diseases Leaf",

                "leafminner" => "Leafminer Leaf",
                "leafminner leaf" => "Leafminer Leaf",
                "bacterial spot" => "Bacterial Spot",
                "alternaria" => "Alternaria",
                "cercospora" => "Cercospora",
                "early blight" => "Early Blight",
                "late blight" => "Late Blight",

                "bacterial leaf spot" => "Bacterial Leaf Spot",
                "mosaic" => "Mosaic Disease",
                "mosaic disease" => "Mosaic Disease",
                "black leaf spot" => "Black Leaf Spot",
                "mosaic virus" => "Mosaic Virus",
                "flea beetle" => "Flea Beetle",

                "mossaic virus" => "Mosaic Virus",
                "southern blight" => "Southern Blight",
                "sudden death syndrone" => "Sudden Death Syndrome",
                "sudden death syndrome" => "Sudden Death Syndrome",
                "yellow mosaic" => "Yellow Mosaic",
                "brown spot" => "Brown Spot",
                "crestamento" => "Crestamento",
                "ferrugen" => "Ferrugen",
                "septoria" => "Septoria",

                "leaf scorch" => "Leaf Scorch",
                "leaf mold" => "Leaf Mold",
                "septoria leaf spot" => "Septoria Leaf Spot",
                "spider mites two spotted spider mite" => "Spider Mites",
                "target spot" => "Target Spot",
                "tomato yellowleaf curl virus" => "Tomato Yellow Leaf Curl Virus",
                "tomato yellow leaf curl virus" => "Tomato Yellow Leaf Curl Virus",
                "tomato mosaic virus" => "Tomato Mosaic Virus",

                "not recognize" => "Not Recognize",

                _ => ToTitleCaseWords(name)
            };
        }

        private static string CleanText(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return "";

            return text
                .Replace("___", " ")
                .Replace("__", " ")
                .Replace("_", " ")
                .Replace("-", " ")
                .Replace("(", " ")
                .Replace(")", " ")
                .Replace("  ", " ")
                .Trim();
        }

        private static string ToKey(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return "";

            return CleanText(text)
                .ToLower()
                .Replace(" ", "");
        }

        private static string ToTitleCaseWords(string text)
        {
            var words = text.Split(' ', StringSplitOptions.RemoveEmptyEntries);

            for (int i = 0; i < words.Length; i++)
            {
                var w = words[i];
                words[i] = w.Length > 1
                    ? char.ToUpper(w[0]) + w[1..].ToLower()
                    : w.ToUpper();
            }

            return string.Join(" ", words);
        }
    }
}