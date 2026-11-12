using System;

namespace DoctorPlantTest.DAL.Entities
{
    public class ImageDiagnosis
    {
        public long DiagnosisId { get; set; }
        public long UserId { get; set; }
        public string? ImageUrl { get; set; }
        public long? DiseaseId { get; set; }
        public decimal ConfidencePercent { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        public Disease? Disease { get; set; }
    }
}