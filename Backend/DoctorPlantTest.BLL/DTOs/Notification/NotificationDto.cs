using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DoctorPlantTest.BLL.DTOs.Notification
{
    public class NotificationDto
    {
        public long NotificationId { get; set; }

        public long ReceiverUserId { get; set; }

        public long ActorUserId { get; set; }

        public long PostId { get; set; }

        public string Type { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;

        public bool IsRead { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}