namespace DoctorPlantTest.BLL.DTOs.Post
{
    public class PostDto
    {
        public long PostId { get; set; }
        public long UserId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string Category { get; set; } = "General";
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
