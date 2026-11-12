using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace DoctorPlantTest.API.Services
{
    public class CloudinaryService : IImageStorage
    {
        private readonly Cloudinary _images;

        public CloudinaryService(IConfiguration configuration)
        {
            var account = new Account(
                configuration["Cloudinary:CloudName"],
                configuration["Cloudinary:ApiKey"],
                configuration["Cloudinary:ApiSecret"]
            );
            _images = new Cloudinary(account) { Api = { Secure = true } };
        }

        public async Task<string> UploadImageAsync(IFormFile file, string folder)
        {
            await using var stream = file.OpenReadStream();
            return await UploadImageAsync(stream, file.FileName, folder);
        }

        /// <summary>
        /// https://res.cloudinary.com/&lt;cloud&gt;/image/upload/v123/folder/name.jpg  ->  folder/name  (null if not a Cloudinary URL)
        /// </summary>
        public static string? ExtractPublicId(string imageUrl)
        {
            var match = System.Text.RegularExpressions.Regex.Match(imageUrl, @"/upload/(?:v\d+/)?(.+?)(?:\.[A-Za-z0-9]+)?$");
            return match.Success ? match.Groups[1].Value : null;
        }

        public async Task DeleteImageAsync(string imageUrl)
        {
            try
            {
                var publicId = ExtractPublicId(imageUrl);
                if (publicId == null) return;
                await _images.DestroyAsync(new DeletionParams(publicId));
            }
            catch
            {
                // Account deletion must not fail because an image could not be removed from storage
            }
        }

        public async Task<string> UploadImageAsync(Stream stream, string fileName, string folder)
        {
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(fileName, stream),
                Folder = folder,
                UseFilename = false,
                UniqueFilename = true,
                Overwrite = false
            };

            var result = await _images.UploadAsync(uploadParams);

            if (result.Error != null)
                throw new InvalidOperationException($"Cloudinary upload failed: {result.Error.Message}");

            return result.SecureUrl.ToString();
        }
    }
}
