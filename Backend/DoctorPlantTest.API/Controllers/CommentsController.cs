using DoctorPlantTest.BLL.DTOs.Comment;
using DoctorPlantTest.BLL.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoctorPlantTest.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommentsController : ControllerBase
    {
        private readonly ICommentService _commentService;

        public CommentsController(ICommentService commentService)
        {
            _commentService = commentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var comments = await _commentService.GetAllAsync();
            return Ok(comments);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            var comment = await _commentService.GetByIdAsync(id);
            if (comment == null) return NotFound(new { message = "Comment not found." });
            return Ok(comment);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateCommentDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            await _commentService.AddAsync(dto);
            return StatusCode(201, new { message = "Comment created successfully." });
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(long id)
        {
            await _commentService.DeleteAsync(id);
            return Ok(new { message = "Comment deleted successfully." });
        }
    }
}
