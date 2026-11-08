namespace DoctorPlantTest.BLL.DTOs.Comment
{
    public class CommentDto
    {
        public long CommentId { get; set; }
        public long PostId { get; set; }
        public long UserId { get; set; }
        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
