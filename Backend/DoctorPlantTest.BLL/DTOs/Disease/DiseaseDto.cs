using System;
using System.Collections.Generic;
using System.Text;

namespace DoctorPlantTest.BLL.DTOs.Disease
{
    public class DiseaseDto
    {
        public long DiseaseId { get; set; }

        public string Name { get; set; } = string.Empty;
        public string? NameAr { get; set; }

        public string Description { get; set; } = string.Empty;
        public string? DescriptionAr { get; set; }

        public string Symptoms { get; set; } = string.Empty;
        public string? SymptomsAr { get; set; }

        public string Treatment { get; set; } = string.Empty;
        public string? TreatmentAr { get; set; }
    }
}
