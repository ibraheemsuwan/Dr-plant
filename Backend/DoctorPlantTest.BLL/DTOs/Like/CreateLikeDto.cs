using System.ComponentModel.DataAnnotations;

namespace DoctorPlantTest.BLL.DTOs.Like
{
    public class CreateLikeDto
    {
        [Required]
        public long PostId { get; set; }

        // Ignored from the client: the controller overwrites it with the authenticated user's id
        public long UserId { get; set; }
    }
}
