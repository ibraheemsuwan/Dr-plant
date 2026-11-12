using DoctorPlantTest.API.Authorization;
using Microsoft.AspNetCore.Authorization;
using DoctorPlantTest.BLL.DTOs.Crop;
using DoctorPlantTest.BLL.Services;
using Microsoft.AspNetCore.Mvc;

namespace DoctorPlantTest.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CropDetailsController : ControllerBase
    {
        private readonly ICropDetailService _cropDetailService;

        public CropDetailsController(ICropDetailService cropDetailService)
        {
            _cropDetailService = cropDetailService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _cropDetailService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{cropId}")]
        public async Task<IActionResult> GetByCropId(long cropId)
        {
            var result = await _cropDetailService.GetByCropIdAsync(cropId);

            if (result == null)
                return NotFound(new { message = "Crop details not found." });

            return Ok(result);
        }

        [HttpPost]
        [Authorize(Policy = Policies.Admin)]
        public async Task<IActionResult> Create([FromBody] CreateCropDetailDto dto)
        {
            var result = await _cropDetailService.CreateAsync(dto);
            return Ok(result);
        }

        [HttpPut("{cropId}")]
        [Authorize(Policy = Policies.Admin)]
        public async Task<IActionResult> Update(long cropId, [FromBody] CreateCropDetailDto dto)
        {
            var result = await _cropDetailService.UpdateAsync(cropId, dto);

            if (result == null)
                return NotFound(new { message = "Crop details not found." });

            return Ok(result);
        }

        [HttpDelete("{cropId}")]
        [Authorize(Policy = Policies.Admin)]
        public async Task<IActionResult> Delete(long cropId)
        {
            var deleted = await _cropDetailService.DeleteAsync(cropId);

            if (!deleted)
                return NotFound(new { message = "Crop details not found." });

            return Ok(new { message = "Crop details deleted successfully." });
        }
    }
}