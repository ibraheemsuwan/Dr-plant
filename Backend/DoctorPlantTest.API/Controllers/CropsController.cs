using DoctorPlantTest.API.Services;
using DoctorPlantTest.BLL.DTOs.Crop;
using DoctorPlantTest.BLL.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoctorPlantTest.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CropsController : ControllerBase
    {
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
            { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        private const long MaxFileSizeBytes = 5 * 1024 * 1024;

        private readonly ICropService _cropService;
        private readonly ICloudinaryService _cloudinary;
        private readonly ILogger<CropsController> _logger;

        public CropsController(ICropService cropService, ICloudinaryService cloudinary, ILogger<CropsController> logger)
        {
            _cropService = cropService;
            _cloudinary = cloudinary;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var crops = await _cropService.GetAllAsync();
            return Ok(crops);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            var crop = await _cropService.GetByIdAsync(id);
            if (crop == null) return NotFound(new { message = "Crop not found." });
            return Ok(crop);
        }

        [HttpPost]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Create([FromForm] CreateCropDto dto, IFormFile? file)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (file != null && file.Length > 0)
            {
                var validationError = ValidateFile(file);
                if (validationError != null) return BadRequest(new { message = validationError });

                try { dto.ImageUrl = await _cloudinary.UploadImageAsync(file, "crops"); }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to upload crop image");
                    return StatusCode(500, new { message = "Failed to upload image." });
                }
            }

            await _cropService.AddAsync(dto);
            return StatusCode(201, new { message = "Crop created successfully." });
        }

        [HttpPut("{id}")]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Update(long id, [FromForm] UpdateCropDto dto, IFormFile? file)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (file != null && file.Length > 0)
            {
                var validationError = ValidateFile(file);
                if (validationError != null) return BadRequest(new { message = validationError });

                try { dto.ImageUrl = await _cloudinary.UploadImageAsync(file, "crops"); }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to upload crop image");
                    return StatusCode(500, new { message = "Failed to upload image." });
                }
            }

            try { await _cropService.UpdateAsync(id, dto); }
            catch (KeyNotFoundException) { return NotFound(new { message = "Crop not found." }); }

            return Ok(new { message = "Crop updated successfully." });
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(long id)
        {
            await _cropService.DeleteAsync(id);
            return Ok(new { message = "Crop deleted successfully." });
        }

        private static string? ValidateFile(IFormFile file)
        {
            if (file.Length > MaxFileSizeBytes)
                return $"File size exceeds the {MaxFileSizeBytes / 1024 / 1024}MB limit.";

            var extension = Path.GetExtension(file.FileName);
            if (!AllowedExtensions.Contains(extension))
                return "Only image files (.jpg, .jpeg, .png, .gif, .webp) are allowed.";

            return null;
        }
    }
}
