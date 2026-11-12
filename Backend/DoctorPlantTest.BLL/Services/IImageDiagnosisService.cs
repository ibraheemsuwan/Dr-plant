using System;
using System.Collections.Generic;
using System.Text;
using DoctorPlantTest.BLL.DTOs.ImageDiagnosis;

namespace DoctorPlantTest.BLL.Services
{
    public interface IImageDiagnosisService
    {
        Task<IEnumerable<ImageDiagnosisDto>> GetAllAsync();
        Task<ImageDiagnosisDto?> GetByIdAsync(long id);
        Task<IEnumerable<ImageDiagnosisDto>> GetByUserAsync(long userId);
        Task AddAsync(CreateImageDiagnosisDto dto);
        Task DeleteAsync(long id);
    }
}
