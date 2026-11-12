using System;
using System.Collections.Generic;
using System.Text;
using DoctorPlantTest.BLL.DTOs.Like;

namespace DoctorPlantTest.BLL.Services
{
    public interface ILikeService
    {
        /// <summary>Likes, optionally of one post. Capped at <paramref name="limit"/> newest.</summary>
        Task<IEnumerable<LikeDto>> GetAllAsync(long? postId = null, int limit = 2000);
        Task<LikeDto?> GetByIdAsync(long id);
        /// <returns>false if this user already liked the post (nothing added).</returns>
        Task<bool> AddAsync(CreateLikeDto dto);
        Task DeleteAsync(long id);
    }
}
