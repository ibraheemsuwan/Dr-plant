using DoctorPlantTest.BLL.DTOs.Disease;

namespace DoctorPlantTest.BLL.Services
{
    public interface IDiseaseService
    {
        Task<IEnumerable<DiseaseDto>> GetAllAsync();
        Task<DiseaseDto?> GetByIdAsync(long id);
        Task<DiseaseDto?> GetByNameAsync(string name);
        Task AddAsync(CreateDiseaseDto dto);
        Task UpdateAsync(long id, CreateDiseaseDto dto);
        Task DeleteAsync(long id);
    }
}
