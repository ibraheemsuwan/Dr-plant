using System.ComponentModel.DataAnnotations;

namespace DoctorPlantTest.BLL.DTOs.Like
{
    public class CreateLikeDto
    {
        [Required]
        public long PostId { get; set; }

        [Required]
        public long UserId { get; set; }
    }
}
