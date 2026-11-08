using System.ComponentModel.DataAnnotations;

namespace DoctorPlantTest.DAL.Entities
{
    public class Comment
    {
        public long CommentId { get; set; }
        public long PostId { get; set; }
        public long UserId { get; set; }

        [MaxLength(2000)]
        public string Text { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public Post? Post { get; set; }
        public User? User { get; set; }
    }
}
