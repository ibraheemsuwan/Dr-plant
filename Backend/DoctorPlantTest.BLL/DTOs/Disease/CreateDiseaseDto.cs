using System.ComponentModel.DataAnnotations;

namespace DoctorPlantTest.BLL.DTOs.Disease
{
    public class CreateDiseaseDto
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? NameAr { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? DescriptionAr { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Symptoms { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? SymptomsAr { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Treatment { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? TreatmentAr { get; set; }
    }
}
