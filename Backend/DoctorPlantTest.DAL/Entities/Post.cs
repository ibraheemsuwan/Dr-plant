using System.ComponentModel.DataAnnotations;

namespace DoctorPlantTest.DAL.Entities
{
    public class Post
    {
        public long PostId { get; set; }
        public long UserId { get; set; }

        [MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(5000)]
        public string Content { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public DateTime CreatedAt { get; set; }

        public User? User { get; set; }

        public string Category { get; set; } = "General";

        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public ICollection<Like> Likes { get; set; } = new List<Like>();
    }
}
