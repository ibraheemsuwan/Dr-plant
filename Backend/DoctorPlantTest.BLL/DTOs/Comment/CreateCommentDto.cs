using System.ComponentModel.DataAnnotations;

namespace DoctorPlantTest.BLL.DTOs.Comment
{
    public class CreateCommentDto
    {
        [Required]
        public long PostId { get; set; }

        // Ignored from the client: the controller overwrites it with the authenticated user's id
        public long UserId { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Text { get; set; } = string.Empty;
    }
}
