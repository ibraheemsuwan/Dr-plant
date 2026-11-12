using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DoctorPlantTest.BLL.DTOs.Notification;

namespace DoctorPlantTest.BLL.Services
{
    public interface INotificationService
    {
        Task CreateNotificationAsync(long receiverUserId, long actorUserId, long postId, string type, string message);

        /// <summary>The user's newest notifications (default 50).</summary>
        Task<List<NotificationDto>> GetMyNotificationsAsync(long userId, int limit = 50);

        Task<int> GetUnreadCountAsync(long userId);

        Task MarkAsReadAsync(long notificationId, long userId);

        Task MarkAllAsReadAsync(long userId);

        /// <summary>Removes notifications received by or caused by this user.</summary>
        Task DeleteForUserAsync(long userId);
    }
}