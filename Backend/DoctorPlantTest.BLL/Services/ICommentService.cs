using System;
using System.Collections.Generic;
using System.Text;
using DoctorPlantTest.BLL.DTOs.Comment;

namespace DoctorPlantTest.BLL.Services
{
    public interface ICommentService
    {
        Task<IEnumerable<CommentDto>> GetAllAsync();
        Task<CommentDto?> GetByIdAsync(long id);
        Task AddAsync(CreateCommentDto dto);
        Task DeleteAsync(long id);
    }
}