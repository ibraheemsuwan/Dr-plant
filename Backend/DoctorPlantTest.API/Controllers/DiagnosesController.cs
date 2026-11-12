using DoctorPlantTest.API.Authorization;
using DoctorPlantTest.API.Diagnosis;
using DoctorPlantTest.BLL.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace DoctorPlantTest.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DiagnosesController : ControllerBase
    {
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
            { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp" };

        private const long MaxRequestBytes = 11 * 1024 * 1024; // 10 MB image + multipart overhead

        private readonly PlantDiagnosisService _diagnosis;
        private readonly IImageDiagnosisService _history;
        private readonly DiagnosisOptions _options;

        public DiagnosesController(PlantDiagnosisService diagnosis, IImageDiagnosisService history, IOptions<DiagnosisOptions> options)
        {
            _diagnosis = diagnosis;
            _history = history;
            _options = options.Value;
        }

        [HttpPost("predict")]
        [Authorize]
        [EnableRateLimiting(RateLimitPolicies.Predict)]
        [RequestSizeLimit(MaxRequestBytes)]
        public async Task<IActionResult> Predict(IFormFile file, [FromForm] long? cropId, CancellationToken ct)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No image uploaded." });

            if (file.Length > _options.MaxImageBytes)
                return BadRequest(new { message = "The image is larger than 10 MB. Please upload a smaller image." });

            if (!AllowedExtensions.Contains(Path.GetExtension(file.FileName)))
                return BadRequest(new { message = "Invalid file type. Only .jpg, .jpeg, .png, .gif, .webp are allowed." });

            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Invalid token." });

            DiagnosisResult r;
            try
            {
                await using var stream = file.OpenReadStream();
                r = await _diagnosis.DiagnoseAsync(stream, userId.Value, cropId, ct);
            }
            catch (InvalidImageException)
            {
                return BadRequest(new { message = "The uploaded file is not a valid image." });
            }
            catch (DiagnosisUnavailableException)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable,
                    new { message = "The diagnosis service is temporarily unavailable. Please try again in a few minutes." });
            }

            var d = r.Disease;
            return Ok(new
            {
                status = r.Status,                 // Completed | Healthy | Uncertain
                source = r.Source,                 // local | ai
                confidence = Math.Round(r.Confidence, 2),
                confidenceLevel = r.ConfidenceLevel, // high | medium | low
                imageUrl = r.ImageUrl,
                predictedClass = r.PredictedClass,

                cropId = r.CropId,
                cropName = r.CropName,
                cropNameAr = r.CropNameAr,

                diseaseId = r.DiseaseId,
                diseaseName = d?.Name,
                diseaseNameAr = d?.NameAr,
                description = d?.Description,
                descriptionAr = d?.DescriptionAr,
                symptoms = d?.Symptoms,
                symptomsAr = d?.SymptomsAr,
                treatment = d?.Treatment,
                treatmentAr = d?.TreatmentAr,
                disease = d == null ? null : new
                {
                    diseaseId = r.DiseaseId,
                    name = d.Name,
                    nameAr = d.NameAr,
                    description = d.Description,
                    descriptionAr = d.DescriptionAr,
                    symptoms = d.Symptoms,
                    symptomsAr = d.SymptomsAr,
                    treatment = d.Treatment,
                    treatmentAr = d.TreatmentAr,
                },

                alternatives = r.Alternatives,

                // Uncertain only
                reason = r.Reason,
                message = r.Message,
                messageAr = r.MessageAr,
            });
        }

        /// <summary>The signed-in user's diagnosis history, newest first.</summary>
        [HttpGet("mine")]
        [Authorize]
        public async Task<IActionResult> GetMine()
        {
            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Invalid token." });

            var all = await _history.GetByUserAsync(userId.Value);
            return Ok(all);
        }

        [HttpGet]
        [Authorize(Policy = Policies.Admin)]
        public async Task<IActionResult> GetAll()
        {
            var all = await _history.GetAllAsync();
            return Ok(all.OrderByDescending(x => x.CreatedAt));
        }
    }
}
