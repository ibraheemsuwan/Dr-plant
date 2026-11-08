using DoctorPlantTest.BLL.DTOs.Crop;
using DoctorPlantTest.DAL.Data;
using DoctorPlantTest.DAL.Entities;
using Microsoft.EntityFrameworkCore;

namespace DoctorPlantTest.BLL.Services
{
    public class CropDetailService : ICropDetailService
    {
        private readonly AppDbContext _context;

        public CropDetailService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<CropDetailDto>> GetAllAsync()
        {
            var data = await _context.CropDetails
                .AsNoTracking()
                .ToListAsync();

            return data.Select(MapToDto).ToList();
        }

        public async Task<CropDetailDto?> GetByCropIdAsync(long cropId)
        {
            var cropDetail = await _context.CropDetails
                .AsNoTracking()
                .FirstOrDefaultAsync(cd => cd.CropId == cropId);

            if (cropDetail == null)
                return null;

            return MapToDto(cropDetail);
        }

        public async Task<CropDetailDto> CreateAsync(CreateCropDetailDto dto)
        {
            var cropExists = await _context.Crops.AnyAsync(c => c.CropId == dto.CropId);
            if (!cropExists)
                throw new Exception("Crop not found.");

            var detailsExist = await _context.CropDetails.AnyAsync(cd => cd.CropId == dto.CropId);
            if (detailsExist)
                throw new Exception("This crop already has details.");

            var cropDetail = new CropDetail
            {
                CropId = dto.CropId,
                PlantingMethodEn = dto.PlantingMethodEn,
                PlantingMethodAr = dto.PlantingMethodAr,
                WateringPlanEn = dto.WateringPlanEn,
                WateringPlanAr = dto.WateringPlanAr,
                SunlightEn = dto.SunlightEn,
                SunlightAr = dto.SunlightAr,
                SoilAndFertilizingEn = dto.SoilAndFertilizingEn,
                SoilAndFertilizingAr = dto.SoilAndFertilizingAr,
                AvoidMistakesEn = dto.AvoidMistakesEn,
                AvoidMistakesAr = dto.AvoidMistakesAr,
                CreatedAt = DateTime.UtcNow
            };

            _context.CropDetails.Add(cropDetail);
            await _context.SaveChangesAsync();

            return MapToDto(cropDetail);
        }

        public async Task<CropDetailDto?> UpdateAsync(long cropId, CreateCropDetailDto dto)
        {
            var cropDetail = await _context.CropDetails
                .FirstOrDefaultAsync(cd => cd.CropId == cropId);

            if (cropDetail == null)
                return null;

            cropDetail.PlantingMethodEn = dto.PlantingMethodEn;
            cropDetail.PlantingMethodAr = dto.PlantingMethodAr;
            cropDetail.WateringPlanEn = dto.WateringPlanEn;
            cropDetail.WateringPlanAr = dto.WateringPlanAr;
            cropDetail.SunlightEn = dto.SunlightEn;
            cropDetail.SunlightAr = dto.SunlightAr;
            cropDetail.SoilAndFertilizingEn = dto.SoilAndFertilizingEn;
            cropDetail.SoilAndFertilizingAr = dto.SoilAndFertilizingAr;
            cropDetail.AvoidMistakesEn = dto.AvoidMistakesEn;
            cropDetail.AvoidMistakesAr = dto.AvoidMistakesAr;

            await _context.SaveChangesAsync();

            return MapToDto(cropDetail);
        }

        public async Task<bool> DeleteAsync(long cropId)
        {
            var cropDetail = await _context.CropDetails
                .FirstOrDefaultAsync(cd => cd.CropId == cropId);

            if (cropDetail == null)
                return false;

            _context.CropDetails.Remove(cropDetail);
            await _context.SaveChangesAsync();

            return true;
        }

        private static CropDetailDto MapToDto(CropDetail cropDetail)
        {
            return new CropDetailDto
            {
                CropDetailsId = cropDetail.CropDetailsId,
                CropId = cropDetail.CropId,
                PlantingMethodEn = cropDetail.PlantingMethodEn,
                PlantingMethodAr = cropDetail.PlantingMethodAr,
                WateringPlanEn = cropDetail.WateringPlanEn,
                WateringPlanAr = cropDetail.WateringPlanAr,
                SunlightEn = cropDetail.SunlightEn,
                SunlightAr = cropDetail.SunlightAr,
                SoilAndFertilizingEn = cropDetail.SoilAndFertilizingEn,
                SoilAndFertilizingAr = cropDetail.SoilAndFertilizingAr,
                AvoidMistakesEn = cropDetail.AvoidMistakesEn,
                AvoidMistakesAr = cropDetail.AvoidMistakesAr
            };
        }
    }
}