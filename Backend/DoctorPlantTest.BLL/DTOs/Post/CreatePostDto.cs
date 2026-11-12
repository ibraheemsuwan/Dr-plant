using System.ComponentModel.DataAnnotations;

namespace DoctorPlantTest.BLL.DTOs.Post
{
    public class CreatePostDto
    {
        // Ignored from the client: the controller overwrites it with the authenticated user's id
        public long UserId { get; set; }

        [Required]
        [MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(5000)]
        public string Content { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public string Category { get; set; } = "General";
    }
}
