using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DoctorPlantTest.BLL.DTOs.ImageDiagnosis;
using DoctorPlantTest.DAL.Entities;
using DoctorPlantTest.DAL.Repositories;

namespace DoctorPlantTest.BLL.Services
{
    public class ImageDiagnosisService : IImageDiagnosisService
    {
        private readonly IGenericRepository<ImageDiagnosis> _diagnosisRepository;

        public ImageDiagnosisService(IGenericRepository<ImageDiagnosis> diagnosisRepository)
        {
            _diagnosisRepository = diagnosisRepository;
        }

        public async Task<IEnumerable<ImageDiagnosisDto>> GetAllAsync()
        {
            var diagnoses = await _diagnosisRepository.GetAllAsync();

            return diagnoses.Select(d => new ImageDiagnosisDto
            {
                DiagnosisId = d.DiagnosisId,
                ImageUrl = d.ImageUrl,
                DiseaseId = d.DiseaseId,
                ConfidencePercent = d.ConfidencePercent,
                Status = d.Status,
                CreatedAt = d.CreatedAt
            });
        }

        public async Task<ImageDiagnosisDto?> GetByIdAsync(long id)
        {
            var d = await _diagnosisRepository.GetByIdAsync(id);
            if (d == null) return null;

            return new ImageDiagnosisDto
            {
                DiagnosisId = d.DiagnosisId,
                ImageUrl = d.ImageUrl,
                DiseaseId = d.DiseaseId,
                ConfidencePercent = d.ConfidencePercent,
                Status = d.Status,
                CreatedAt = d.CreatedAt
            };
        }

        public async Task AddAsync(CreateImageDiagnosisDto dto)
        {
            var diagnosis = new ImageDiagnosis
            {
                ImageUrl = dto.ImageUrl,
                DiseaseId = dto.DiseaseId,
                ConfidencePercent = dto.ConfidencePercent,
                Status = dto.Status,
                CreatedAt = DateTime.UtcNow
            };

            await _diagnosisRepository.AddAsync(diagnosis);
        }

        public async Task DeleteAsync(long id)
        {
            await _diagnosisRepository.DeleteAsync(id);
        }
    }
}