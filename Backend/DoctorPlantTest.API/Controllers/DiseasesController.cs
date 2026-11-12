using DoctorPlantTest.API.Authorization;
using DoctorPlantTest.BLL.DTOs.Disease;
using DoctorPlantTest.BLL.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoctorPlantTest.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DiseasesController : ControllerBase
    {
        private readonly IDiseaseService _diseaseService;

        public DiseasesController(IDiseaseService diseaseService)
        {
            _diseaseService = diseaseService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var diseases = await _diseaseService.GetAllAsync();
            return Ok(diseases);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            var disease = await _diseaseService.GetByIdAsync(id);
            if (disease == null) return NotFound(new { message = "Disease not found." });
            return Ok(disease);
        }

        [HttpPost]
        [Authorize(Policy = Policies.Admin)]
        public async Task<IActionResult> Create([FromBody] CreateDiseaseDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            await _diseaseService.AddAsync(dto);
            return StatusCode(201, new { message = "Disease created successfully." });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = Policies.Admin)]
        public async Task<IActionResult> Update(long id, [FromBody] CreateDiseaseDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                await _diseaseService.UpdateAsync(id, dto);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Disease not found." });
            }

            return Ok(new { message = "Disease updated successfully." });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = Policies.Admin)]
        public async Task<IActionResult> Delete(long id)
        {
            await _diseaseService.DeleteAsync(id);
            return Ok(new { message = "Disease deleted successfully." });
        }
    }
}
