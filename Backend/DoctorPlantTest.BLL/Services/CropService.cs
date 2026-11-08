using DoctorPlantTest.BLL.DTOs.Crop;
using DoctorPlantTest.DAL.Entities;
using DoctorPlantTest.DAL.Repositories;
using Microsoft.Extensions.Logging;

namespace DoctorPlantTest.BLL.Services
{
    public class CropService : ICropService
    {
        private readonly IGenericRepository<Crop> _cropRepository;
        private readonly ILogger<CropService> _logger;

        public CropService(IGenericRepository<Crop> cropRepository, ILogger<CropService> logger)
        {
            _cropRepository = cropRepository;
            _logger = logger;
        }

        public async Task<IEnumerable<CropDto>> GetAllAsync()
        {
            var crops = await _cropRepository.GetAllAsync();
            return crops.Select(ToDto);
        }

        public async Task<CropDto?> GetByIdAsync(long id)
        {
            var c = await _cropRepository.GetByIdAsync(id);
            return c == null ? null : ToDto(c);
        }

        public async Task AddAsync(CreateCropDto dto)
        {
            var crop = new Crop
            {
                UserId = dto.UserId,
                Season = dto.Season,
                Name = dto.Name,
                NameArabic = dto.NameArabic,
                PlantingTimeEn = dto.PlantingTimeEn,
                PlantingTimeAr = dto.PlantingTimeAr,
                GrowthPeriodEn = dto.GrowthPeriodEn,
                GrowthPeriodAr = dto.GrowthPeriodAr,
                DifficultyEn = dto.DifficultyEn,
                DifficultyAr = dto.DifficultyAr,
                ImageUrl = dto.ImageUrl
            };
            await _cropRepository.AddAsync(crop);
        }

        public async Task UpdateAsync(long id, UpdateCropDto dto)
        {
            var crop = await _cropRepository.GetByIdAsync(id);
            if (crop == null)
            {
                _logger.LogWarning("UpdateAsync: crop {Id} not found", id);
                throw new KeyNotFoundException($"Crop with id {id} not found.");
            }

            crop.Season = dto.Season;
            crop.Name = dto.Name;
            crop.NameArabic = dto.NameArabic;
            crop.PlantingTimeEn = dto.PlantingTimeEn;
            crop.PlantingTimeAr = dto.PlantingTimeAr;
            crop.GrowthPeriodEn = dto.GrowthPeriodEn;
            crop.GrowthPeriodAr = dto.GrowthPeriodAr;
            crop.DifficultyEn = dto.DifficultyEn;
            crop.DifficultyAr = dto.DifficultyAr;

            if (!string.IsNullOrEmpty(dto.ImageUrl))
                crop.ImageUrl = dto.ImageUrl;

            await _cropRepository.UpdateAsync(crop);
        }

        public async Task DeleteAsync(long id)
        {
            await _cropRepository.DeleteAsync(id);
        }

        private static CropDto ToDto(Crop c) => new CropDto
        {
            CropId = c.CropId,
            UserId = c.UserId,
            Season = c.Season,
            Name = c.Name,
            NameArabic = c.NameArabic,
            PlantingTimeEn = c.PlantingTimeEn,
            PlantingTimeAr = c.PlantingTimeAr,
            GrowthPeriodEn = c.GrowthPeriodEn,
            GrowthPeriodAr = c.GrowthPeriodAr,
            DifficultyEn = c.DifficultyEn,
            DifficultyAr = c.DifficultyAr,
            ImageUrl = c.ImageUrl
        };
    }
}
