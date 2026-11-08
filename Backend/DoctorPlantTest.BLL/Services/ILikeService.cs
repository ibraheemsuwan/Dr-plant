using System;
using System.Collections.Generic;
using System.Text;
using DoctorPlantTest.BLL.DTOs.Like;

namespace DoctorPlantTest.BLL.Services
{
    public interface ILikeService
    {
        Task<IEnumerable<LikeDto>> GetAllAsync();
        Task AddAsync(CreateLikeDto dto);
        Task DeleteAsync(long id);
    }
}
