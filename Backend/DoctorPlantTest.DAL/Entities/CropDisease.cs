namespace DoctorPlantTest.DAL.Entities
{
    public class CropDisease
    {
        public long CropId { get; set; }
        public long DiseaseId { get; set; }

        public Crop? Crop { get; set; }
        public Disease? Disease { get; set; }
    }
}
