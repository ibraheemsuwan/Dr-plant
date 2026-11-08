using DoctorPlantTest.BLL.DTOs.ContactMessages;
using DoctorPlantTest.DAL.Data;
using DoctorPlantTest.DAL.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DoctorPlantTest.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ContactMessagesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ContactMessagesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CreateMessage(CreateContactMessageDto dto)
    {
        var message = new ContactMessage
        {
            Name = dto.Name,
            Email = dto.Email,
            Subject = dto.Subject,
            Message = dto.Message,
            Status = "Unread"
        };

        _context.ContactMessages.Add(message);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Message sent successfully" });
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAllMessages()
    {
        var messages = await _context.ContactMessages
            .Where(x => !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(messages);
    }

    [Authorize]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetMessageById(int id)
    {
        var msg = await _context.ContactMessages
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

        if (msg == null)
            return NotFound(new { message = "Message not found" });

        if (msg.Status == "Unread")
        {
            msg.Status = "Read";
            msg.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return Ok(msg);
    }

    [Authorize]
    [HttpPut("{id}/reply")]
    public async Task<IActionResult> ReplyToMessage(int id, ReplyContactMessageDto dto)
    {
        var msg = await _context.ContactMessages
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

        if (msg == null)
            return NotFound(new { message = "Message not found" });

        msg.AdminReply = dto.AdminReply;
        msg.Status = "Replied";
        msg.RepliedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Reply saved successfully" });
    }

    [Authorize]
    [HttpPut("{id}/status")]
    public async Task<IActionResult> ChangeStatus(int id, ChangeMessageStatusDto dto)
    {
        var msg = await _context.ContactMessages
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

        if (msg == null)
            return NotFound(new { message = "Message not found" });

        if (dto.Status != "Unread" && dto.Status != "Read" && dto.Status != "Replied")
            return BadRequest(new { message = "Invalid status" });

        msg.Status = dto.Status;

        if (dto.Status == "Read")
            msg.ReadAt = DateTime.UtcNow;

        if (dto.Status == "Unread")
            msg.ReadAt = null;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Status updated successfully" });
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMessage(int id)
    {
        var msg = await _context.ContactMessages
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

        if (msg == null)
            return NotFound(new { message = "Message not found" });

        msg.IsDeleted = true;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Message deleted successfully" });
    }
}