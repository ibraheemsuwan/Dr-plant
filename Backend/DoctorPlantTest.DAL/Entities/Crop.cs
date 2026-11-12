using System.ComponentModel.DataAnnotations;

namespace DoctorPlantTest.DAL.Entities
{
    public class Crop
    {
        public long CropId { get; set; }
        public long UserId { get; set; }

        [MaxLength(100)]
        public string Season { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(200)]
        public string NameArabic { get; set; } = string.Empty;

        [MaxLength(500)]
        public string PlantingTimeEn { get; set; } = string.Empty;

        [MaxLength(500)]
        public string PlantingTimeAr { get; set; } = string.Empty;

        [MaxLength(500)]
        public string GrowthPeriodEn { get; set; } = string.Empty;

        [MaxLength(500)]
        public string GrowthPeriodAr { get; set; } = string.Empty;

        [MaxLength(100)]
        public string DifficultyEn { get; set; } = string.Empty;

        [MaxLength(100)]
        public string DifficultyAr { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User? User { get; set; }

        public CropDetail? CropDetail { get; set; }

        public ICollection<CropDisease> CropDiseases { get; set; } = new List<CropDisease>();
    }
}
