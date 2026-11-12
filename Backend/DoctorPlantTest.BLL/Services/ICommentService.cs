using System;
using System.Collections.Generic;
using System.Text;
using DoctorPlantTest.BLL.DTOs.Comment;

namespace DoctorPlantTest.BLL.Services
{
    public interface ICommentService
    {
        /// <summary>Comments (oldest first), optionally of one post. Capped at <paramref name="limit"/> newest.</summary>
        Task<IEnumerable<CommentDto>> GetAllAsync(long? postId = null, int limit = 500);
        Task<CommentDto?> GetByIdAsync(long id);
        Task AddAsync(CreateCommentDto dto);
        Task DeleteAsync(long id);
    }
}