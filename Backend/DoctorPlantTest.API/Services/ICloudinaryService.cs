namespace DoctorPlantTest.API.Services
{
    public interface ICloudinaryService
    {
        Task<string> UploadImageAsync(IFormFile file, string folder);
        Task<string> UploadImageAsync(Stream stream, string fileName, string folder);

        /// <summary>Best-effort removal of an image previously uploaded by this service. Never throws.</summary>
        Task DeleteImageAsync(string imageUrl);
    }
}
