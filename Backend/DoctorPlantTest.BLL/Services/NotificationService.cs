using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DoctorPlantTest.BLL.DTOs.Notification;
using DoctorPlantTest.DAL.Entities;
using DoctorPlantTest.DAL.Repositories;

namespace DoctorPlantTest.BLL.Services
{
    public class NotificationService : INotificationService
    {
        private readonly IGenericRepository<Notification> _notificationRepository;

        public NotificationService(IGenericRepository<Notification> notificationRepository)
        {
            _notificationRepository = notificationRepository;
        }

        public async Task CreateNotificationAsync(long receiverUserId, long actorUserId, long postId, string type, string message)
        {
            if (receiverUserId == actorUserId)
                return;

            var notification = new Notification
            {
                ReceiverUserId = receiverUserId,
                ActorUserId = actorUserId,
                PostId = postId,
                Type = type,
                Message = message,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository.AddAsync(notification);
        }

        public async Task<List<NotificationDto>> GetMyNotificationsAsync(long userId)
        {
            var notifications = await _notificationRepository.GetAllAsync();

            return notifications
                .Where(n => n.ReceiverUserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new NotificationDto
                {
                    NotificationId = n.NotificationId,
                    ReceiverUserId = n.ReceiverUserId,
                    ActorUserId = n.ActorUserId,
                    PostId = n.PostId,
                    Type = n.Type,
                    Message = n.Message,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                })
                .ToList();
        }

        public async Task<int> GetUnreadCountAsync(long userId)
        {
            var notifications = await _notificationRepository.GetAllAsync();

            return notifications.Count(n => n.ReceiverUserId == userId && !n.IsRead);
        }

        public async Task MarkAsReadAsync(long notificationId, long userId)
        {
            var notification = await _notificationRepository.GetByIdAsync(notificationId);

            if (notification == null)
                return;

            if (notification.ReceiverUserId != userId)
                return;

            notification.IsRead = true;

            await _notificationRepository.UpdateAsync(notification);
        }

        public async Task MarkAllAsReadAsync(long userId)
        {
            var notifications = await _notificationRepository.GetAllAsync();

            var myNotifications = notifications
                .Where(n => n.ReceiverUserId == userId && !n.IsRead)
                .ToList();

            foreach (var notification in myNotifications)
            {
                notification.IsRead = true;
                await _notificationRepository.UpdateAsync(notification);
            }
        }
    }
}
