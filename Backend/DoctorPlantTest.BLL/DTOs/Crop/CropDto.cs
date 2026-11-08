namespace DoctorPlantTest.BLL.DTOs.Crop
{
    public class CropDto
    {
        public long CropId { get; set; }
        public long UserId { get; set; }
        public string Season { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string NameArabic { get; set; } = string.Empty;
        public string PlantingTimeEn { get; set; } = string.Empty;
        public string PlantingTimeAr { get; set; } = string.Empty;
        public string GrowthPeriodEn { get; set; } = string.Empty;
        public string GrowthPeriodAr { get; set; } = string.Empty;
        public string DifficultyEn { get; set; } = string.Empty;
        public string DifficultyAr { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
    }
}
