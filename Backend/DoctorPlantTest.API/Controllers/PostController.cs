using DoctorPlantTest.API.Authorization;
using DoctorPlantTest.API.Services;
using DoctorPlantTest.BLL.DTOs.Post;
using DoctorPlantTest.BLL.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoctorPlantTest.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PostsController : ControllerBase
    {
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
            { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        private const long MaxFileSizeBytes = 5 * 1024 * 1024;

        private readonly IPostService _postService;
        private readonly ICloudinaryService _cloudinary;
        private readonly ILogger<PostsController> _logger;

        public PostsController(IPostService postService, ICloudinaryService cloudinary, ILogger<PostsController> logger)
        {
            _postService = postService;
            _cloudinary = cloudinary;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var posts = await _postService.GetAllAsync();
            return Ok(posts);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            var post = await _postService.GetByIdAsync(id);
            if (post == null) return NotFound(new { message = "Post not found." });
            return Ok(post);
        }

        [HttpPost]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Create([FromForm] CreatePostDto dto, IFormFile? file)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = User.GetUserId();
            if (userId == null) return Unauthorized(new { message = "Invalid token." });
            dto.UserId = userId.Value; // never trust the client-sent UserId

            if (file != null && file.Length > 0)
            {
                var validationError = ValidateFile(file);
                if (validationError != null) return BadRequest(new { message = validationError });

                try { dto.ImageUrl = await _cloudinary.UploadImageAsync(file, "posts"); }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to upload post image");
                    return StatusCode(500, new { message = "Failed to upload image." });
                }
            }

            await _postService.AddAsync(dto);
            return StatusCode(201, new { message = "Post created successfully." });
        }

        [HttpPut("{id}")]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Update(long id, [FromForm] UpdatePostDto dto, IFormFile? file)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var post = await _postService.GetByIdAsync(id);
            if (post == null) return NotFound(new { message = "Post not found." });
            if (!User.CanModify(post.UserId)) return Forbid();

            if (file != null && file.Length > 0)
            {
                var validationError = ValidateFile(file);
                if (validationError != null) return BadRequest(new { message = validationError });

                try { dto.ImageUrl = await _cloudinary.UploadImageAsync(file, "posts"); }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to upload post image");
                    return StatusCode(500, new { message = "Failed to upload image." });
                }
            }

            try { await _postService.UpdateAsync(id, dto); }
            catch (KeyNotFoundException) { return NotFound(new { message = "Post not found." }); }

            return Ok(new { message = "Post updated successfully." });
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(long id)
        {
            var post = await _postService.GetByIdAsync(id);
            if (post == null) return NotFound(new { message = "Post not found." });
            if (!User.CanModify(post.UserId)) return Forbid();

            await _postService.DeleteAsync(id);
            return Ok(new { message = "Post deleted successfully." });
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
