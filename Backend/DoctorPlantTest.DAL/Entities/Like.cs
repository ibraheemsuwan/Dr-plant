namespace DoctorPlantTest.DAL.Entities
{
    public class Like
    {
        public long LikeId { get; set; }
        public long PostId { get; set; }
        public long UserId { get; set; }
        public DateTime CreatedAt { get; set; }

        public Post? Post { get; set; }
        public User? User { get; set; }
    }
}
