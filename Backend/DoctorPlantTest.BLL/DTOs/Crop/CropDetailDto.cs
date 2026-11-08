using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;


namespace DoctorPlantTest.BLL.DTOs.Crop
{
    public class CropDetailDto
    {
        public int CropDetailsId { get; set; }
        public long CropId { get; set; }

        public string? PlantingMethodEn { get; set; }
        public string? PlantingMethodAr { get; set; }

        public string? WateringPlanEn { get; set; }
        public string? WateringPlanAr { get; set; }

        public string? SunlightEn { get; set; }
        public string? SunlightAr { get; set; }

        public string? SoilAndFertilizingEn { get; set; }
        public string? SoilAndFertilizingAr { get; set; }

        public string? AvoidMistakesEn { get; set; }
        public string? AvoidMistakesAr { get; set; }
    }
}