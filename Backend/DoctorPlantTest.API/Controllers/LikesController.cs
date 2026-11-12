using DoctorPlantTest.API.Authorization;
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
        public async Task<IActionResult> GetAll([FromQuery] long? postId, [FromQuery] int limit = 2000)
        {
            var likes = await _likeService.GetAllAsync(postId, limit);
            return Ok(likes);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateLikeDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Invalid token." });
            dto.UserId = userId.Value; // never trust the client-sent UserId

            var added = await _likeService.AddAsync(dto);
            if (!added) return Ok(new { message = "Post already liked." });
            return StatusCode(201, new { message = "Like added successfully." });
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(long id)
        {
            var like = await _likeService.GetByIdAsync(id);
            if (like == null) return NotFound(new { message = "Like not found." });
            if (!User.CanModify(like.UserId)) return Forbid();

            await _likeService.DeleteAsync(id);
            return Ok(new { message = "Like removed successfully." });
        }
    }
}
