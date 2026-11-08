using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DoctorPlantTest.BLL.DTOs.Crop;

namespace DoctorPlantTest.BLL.Services
{
    public interface ICropDetailService
    {
        Task<CropDetailDto?> GetByCropIdAsync(long cropId);
        Task<CropDetailDto> CreateAsync(CreateCropDetailDto dto);
        Task<CropDetailDto?> UpdateAsync(long cropId, CreateCropDetailDto dto);
        Task<bool> DeleteAsync(long cropId);
        Task<List<CropDetailDto>> GetAllAsync();
    }
}
