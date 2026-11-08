using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DoctorPlantTest.BLL.DTOs.ContactMessages;

namespace DoctorPlantTest.BLL.Services
{
    public interface IContactMessageService
    {
        Task<ContactMessage> CreateMessageAsync(CreateContactMessageDto dto);
        Task<List<ContactMessage>> GetAllMessagesAsync();
        Task<ContactMessage?> GetMessageByIdAsync(int id);
        Task<bool> ReplyToMessageAsync(int id, ReplyContactMessageDto dto);
        Task<bool> ChangeStatusAsync(int id, ChangeMessageStatusDto dto);
        Task<bool> DeleteMessageAsync(int id);
    }
}