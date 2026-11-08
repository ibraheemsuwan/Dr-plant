using DoctorPlantTest.BLL.DTOs.Like;
using DoctorPlantTest.BLL.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoctorPlantTest.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LikesController : ControllerBase
    {
        private readonly ILikeService _likeService;

        public LikesController(ILikeService likeService)
        {
            _likeService = likeService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var likes = await _likeService.GetAllAsync();
            return Ok(likes);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateLikeDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            await _likeService.AddAsync(dto);
            return StatusCode(201, new { message = "Like added successfully." });
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(long id)
        {
            await _likeService.DeleteAsync(id);
            return Ok(new { message = "Like removed successfully." });
        }
    }
}
