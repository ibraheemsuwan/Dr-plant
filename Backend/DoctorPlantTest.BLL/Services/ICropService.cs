using DoctorPlantTest.BLL.DTOs.Crop;

namespace DoctorPlantTest.BLL.Services
{
    public interface ICropService
    {
        Task<IEnumerable<CropDto>> GetAllAsync();
        Task<CropDto?> GetByIdAsync(long id);
        Task AddAsync(CreateCropDto dto);
        Task UpdateAsync(long id, UpdateCropDto dto);
        Task DeleteAsync(long id);
    }
}
