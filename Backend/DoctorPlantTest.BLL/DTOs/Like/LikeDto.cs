using System;
using System.Collections.Generic;
using System.Text;

namespace DoctorPlantTest.BLL.DTOs.Like
{
    public class LikeDto
    {
        public long LikeId { get; set; }
        public long PostId { get; set; }
        public long UserId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}