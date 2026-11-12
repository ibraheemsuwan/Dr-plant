using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;

namespace DoctorPlantTest.API.Diagnosis
{
    public static class ImagePreparer
    {
        /// <summary>Long edge in pixels. Matches Claude's recommended max; also plenty for the 300x300 local model.</summary>
        private const int MaxEdge = 1568;

        /// <summary>
        /// Decodes the upload (rejecting anything that is not a real image), fixes phone EXIF rotation,
        /// downsizes to <see cref="MaxEdge"/> and re-encodes as JPEG. Returns null if the file is not an image.
        /// </summary>
        public static async Task<byte[]?> ToNormalizedJpegAsync(Stream input, CancellationToken ct)
        {
            Image image;
            try
            {
                image = await Image.LoadAsync(input, ct);
            }
            catch (Exception ex) when (ex is UnknownImageFormatException or InvalidImageContentException or NotSupportedException)
            {
                return null;
            }

            using (image)
            {
                image.Mutate(x =>
                {
                    x.AutoOrient();
                    if (image.Width > MaxEdge || image.Height > MaxEdge)
                        x.Resize(new ResizeOptions { Mode = ResizeMode.Max, Size = new Size(MaxEdge, MaxEdge) });
                });
                image.Metadata.ExifProfile = null; // strip GPS/location and other metadata

                using var output = new MemoryStream();
                await image.SaveAsJpegAsync(output, new JpegEncoder { Quality = 85 }, ct);
                return output.ToArray();
            }
        }
    }
}
