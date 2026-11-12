using System.Text.RegularExpressions;
using DoctorPlantTest.API.Diagnosis;

namespace DoctorPlantTest.API.Services
{
    /// <summary>
    /// Stores images on the server's own disk instead of Cloudinary (Storage:Provider = Local).
    ///
    /// Safety: nothing the user sends is stored as-is. Every upload is decoded and re-encoded as a JPEG
    /// (ImagePreparer), which strips GPS/EXIF metadata and makes it impossible to smuggle HTML, SVG or scripts
    /// into the uploads folder under an image extension. Files get random names, so URLs cannot be guessed.
    ///
    /// Settings: Storage:LocalPath (folder; default "uploads" next to the app; mount a persistent volume here),
    ///           Storage:PublicBaseUrl (public address of THIS API, used to build image URLs, e.g. https://api.example.com).
    /// </summary>
    public class LocalImageStorage : IImageStorage
    {
        public const string RequestPath = "/uploads";

        private static readonly Regex SafeFolder = new("^[A-Za-z0-9_-]{1,40}$", RegexOptions.Compiled);
        private static readonly Regex SafeFileName = new("^[a-f0-9]{32}\\.jpg$", RegexOptions.Compiled);

        private readonly string _publicBase;

        public string RootPath { get; }

        public LocalImageStorage(IConfiguration config, IWebHostEnvironment env)
        {
            var path = config["Storage:LocalPath"];
            RootPath = Path.GetFullPath(string.IsNullOrWhiteSpace(path) ? Path.Combine(env.ContentRootPath, "uploads") : path);
            _publicBase = (config["Storage:PublicBaseUrl"] is { Length: > 0 } b ? b : "http://localhost:5274").TrimEnd('/');
        }

        public async Task<string> UploadImageAsync(IFormFile file, string folder)
        {
            await using var stream = file.OpenReadStream();
            return await UploadImageAsync(stream, file.FileName, folder);
        }

        public async Task<string> UploadImageAsync(Stream stream, string fileName, string folder)
        {
            if (!SafeFolder.IsMatch(folder)) throw new ArgumentException("Invalid folder name.", nameof(folder));

            var jpeg = await ImagePreparer.ToNormalizedJpegAsync(stream, CancellationToken.None)
                       ?? throw new InvalidImageException();

            var name = Guid.NewGuid().ToString("N") + ".jpg";
            var dir = Path.Combine(RootPath, folder);
            Directory.CreateDirectory(dir);
            await File.WriteAllBytesAsync(Path.Combine(dir, name), jpeg);

            return $"{_publicBase}{RequestPath}/{folder}/{name}";
        }

        public Task DeleteImageAsync(string imageUrl)
        {
            try
            {
                var prefix = $"{_publicBase}{RequestPath}/";
                if (!imageUrl.StartsWith(prefix, StringComparison.Ordinal)) return Task.CompletedTask; // not ours (e.g. an old Cloudinary URL)

                var parts = imageUrl[prefix.Length..].Split('/');
                // Exactly <folder>/<random>.jpg: anything else (".." etc.) is ignored, so a crafted URL can't delete other files
                if (parts.Length != 2 || !SafeFolder.IsMatch(parts[0]) || !SafeFileName.IsMatch(parts[1]))
                    return Task.CompletedTask;

                var path = Path.Combine(RootPath, parts[0], parts[1]);
                if (File.Exists(path)) File.Delete(path);
            }
            catch
            {
                // Best effort: account deletion must not fail because a file could not be removed
            }
            return Task.CompletedTask;
        }
    }
}
