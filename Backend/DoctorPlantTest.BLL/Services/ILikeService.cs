using System;
using System.Collections.Generic;
using System.Text;
using DoctorPlantTest.BLL.DTOs.Like;

namespace DoctorPlantTest.BLL.Services
{
    public interface ILikeService
    {
        Task<IEnumerable<LikeDto>> GetAllAsync();
        Task<LikeDto?> GetByIdAsync(long id);
        /// <returns>false if this user already liked the post (nothing added).</returns>
        Task<bool> AddAsync(CreateLikeDto dto);
        Task DeleteAsync(long id);
    }
}
