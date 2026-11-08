using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace DoctorPlantTest.BLL.DTOs.Crop;

public class CreateCropDetailDto
{
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
