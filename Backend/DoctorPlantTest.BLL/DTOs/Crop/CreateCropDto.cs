using System.ComponentModel.DataAnnotations;

namespace DoctorPlantTest.BLL.DTOs.Crop
{
    public class CreateCropDto
    {
        [Required]
        public long UserId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Season { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string NameArabic { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string PlantingTimeEn { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string PlantingTimeAr { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string GrowthPeriodEn { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string GrowthPeriodAr { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string DifficultyEn { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string DifficultyAr { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? ImageUrl { get; set; }
    }
}
