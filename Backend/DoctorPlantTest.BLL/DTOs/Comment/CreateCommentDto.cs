using System.ComponentModel.DataAnnotations;

namespace DoctorPlantTest.BLL.DTOs.Comment
{
    public class CreateCommentDto
    {
        [Required]
        public long PostId { get; set; }

        [Required]
        public long UserId { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Text { get; set; } = string.Empty;
    }
}
