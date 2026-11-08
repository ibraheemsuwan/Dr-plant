using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using DoctorPlantTest.BLL.DTOs.ContactMessages;
using DoctorPlantTest.DAL.Data;
using DoctorPlantTest.DAL.Entities;
using Microsoft.EntityFrameworkCore;

namespace DoctorPlantTest.BLL.Services
{
    public class ContactMessageService : IContactMessageService
    {
        private readonly AppDbContext _context;

        public ContactMessageService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ContactMessage> CreateMessageAsync(CreateContactMessageDto dto)
        {
            var message = new ContactMessage
            {
                Name = dto.Name,
                Email = dto.Email,
                Subject = dto.Subject,
                Message = dto.Message,
                Status = "Unread",
                CreatedAt = DateTime.UtcNow
            };

            _context.ContactMessages.Add(message);
            await _context.SaveChangesAsync();

            return message;
        }

        public async Task<List<ContactMessage>> GetAllMessagesAsync()
        {
            return await _context.ContactMessages
                .Where(x => !x.IsDeleted)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<ContactMessage?> GetMessageByIdAsync(int id)
        {
            var message = await _context.ContactMessages
                .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

            if (message == null)
                return null;

            if (message.Status == "Unread")
            {
                message.Status = "Read";
                message.ReadAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return message;
        }

        public async Task<bool> ReplyToMessageAsync(int id, ReplyContactMessageDto dto)
        {
            var message = await _context.ContactMessages
                .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

            if (message == null)
                return false;

            message.AdminReply = dto.AdminReply;
            message.Status = "Replied";
            message.RepliedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ChangeStatusAsync(int id, ChangeMessageStatusDto dto)
        {
            var message = await _context.ContactMessages
                .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

            if (message == null)
                return false;

            if (dto.Status != "Unread" && dto.Status != "Read" && dto.Status != "Replied")
                return false;

            message.Status = dto.Status;

            if (dto.Status == "Read")
                message.ReadAt = DateTime.UtcNow;

            if (dto.Status == "Unread")
                message.ReadAt = null;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteMessageAsync(int id)
        {
            var message = await _context.ContactMessages
                .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

            if (message == null)
                return false;

            message.IsDeleted = true;
            await _context.SaveChangesAsync();

            return true;
        }
    }
}