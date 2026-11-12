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
                UserId = d.UserId,
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
                UserId = d.UserId,
                ImageUrl = d.ImageUrl,
                DiseaseId = d.DiseaseId,
                ConfidencePercent = d.ConfidencePercent,
                Status = d.Status,
                CreatedAt = d.CreatedAt
            };
        }

        public async Task<DoctorPlantTest.BLL.DTOs.Common.PagedResult<ImageDiagnosisDto>> GetPagedByUserAsync(long userId, int page, int pageSize)
        {
            var (p, size) = DoctorPlantTest.BLL.DTOs.Common.Paging.Normalize(page, pageSize, defaultSize: 20);
            var total = await _diagnosisRepository.CountAsync(d => d.UserId == userId);
            var rows = await _diagnosisRepository.PageAsync(
                d => d.UserId == userId, o => o.OrderByDescending(d => d.CreatedAt).ThenByDescending(d => d.DiagnosisId), (p - 1) * size, size);

            var items = rows.Select(d => new ImageDiagnosisDto
            {
                DiagnosisId = d.DiagnosisId, UserId = d.UserId, ImageUrl = d.ImageUrl, DiseaseId = d.DiseaseId,
                ConfidencePercent = d.ConfidencePercent, Status = d.Status, CreatedAt = d.CreatedAt,
            }).ToList();
            return DoctorPlantTest.BLL.DTOs.Common.PagedResult<ImageDiagnosisDto>.Create(items, p, size, total);
        }

        public async Task<IEnumerable<ImageDiagnosisDto>> GetByUserAsync(long userId)
        {
            var diagnoses = await _diagnosisRepository.FindAsync(d => d.UserId == userId);

            return diagnoses
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => new ImageDiagnosisDto
                {
                    DiagnosisId = d.DiagnosisId,
                    UserId = d.UserId,
                    ImageUrl = d.ImageUrl,
                    DiseaseId = d.DiseaseId,
                    ConfidencePercent = d.ConfidencePercent,
                    Status = d.Status,
                    CreatedAt = d.CreatedAt
                });
        }

        public async Task AddAsync(CreateImageDiagnosisDto dto)
        {
            var diagnosis = new ImageDiagnosis
            {
                UserId = dto.UserId,
                ImageUrl = dto.ImageUrl,
                DiseaseId = dto.DiseaseId,
                ConfidencePercent = dto.ConfidencePercent,
                Status = dto.Status,
                CreatedAt = DateTime.UtcNow
            };

            await _diagnosisRepository.AddAsync(diagnosis);
        }

        public async Task<IReadOnlyList<string>> DeleteByUserAsync(long userId)
        {
            var rows = await _diagnosisRepository.FindAsync(d => d.UserId == userId);
            var urls = rows.Where(r => !string.IsNullOrEmpty(r.ImageUrl)).Select(r => r.ImageUrl!).ToList();
            foreach (var row in rows)
                await _diagnosisRepository.DeleteAsync(row.DiagnosisId);
            return urls;
        }

        public async Task DeleteAsync(long id)
        {
            await _diagnosisRepository.DeleteAsync(id);
        }
    }
}