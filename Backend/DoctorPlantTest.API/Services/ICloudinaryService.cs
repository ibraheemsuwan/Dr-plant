namespace DoctorPlantTest.API.Services
{
    public interface ICloudinaryService
    {
        Task<string> UploadImageAsync(IFormFile file, string folder);
        Task<string> UploadImageAsync(Stream stream, string fileName, string folder);
    }
}
