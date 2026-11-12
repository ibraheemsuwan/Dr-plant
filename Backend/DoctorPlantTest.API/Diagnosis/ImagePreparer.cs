using SkiaSharp;

namespace DoctorPlantTest.API.Diagnosis
{
    public static class ImagePreparer
    {
        /// <summary>Long edge in pixels. Matches Claude's recommended max; also plenty for the 300x300 local model.</summary>
        public const int MaxEdge = 1568;

        /// <summary>
        /// Decodes the upload (rejecting anything that is not a real image), applies the phone's EXIF rotation,
        /// downsizes to <see cref="MaxEdge"/> and re-encodes as JPEG (which also drops GPS/EXIF metadata).
        /// Returns null if the file is not a decodable image.
        /// </summary>
        public static async Task<byte[]?> ToNormalizedJpegAsync(Stream input, CancellationToken ct)
        {
            using var buffer = new MemoryStream();
            await input.CopyToAsync(buffer, ct);

            using var data = SKData.CreateCopy(buffer.GetBuffer().AsSpan(0, (int)buffer.Length));
            using var codec = SKCodec.Create(data);
            if (codec == null) return null;

            var origin = codec.EncodedOrigin;
            using var decoded = SKBitmap.Decode(codec);
            if (decoded == null || decoded.Width == 0 || decoded.Height == 0) return null;

            using var oriented = ApplyOrigin(decoded, origin);
            using var resized = Downscale(oriented);
            using var flattened = FlattenOnWhite(resized ?? oriented);
            using var image = SKImage.FromBitmap(flattened);
            using var jpeg = image.Encode(SKEncodedImageFormat.Jpeg, 85);
            return jpeg?.ToArray();
        }

        private static SKBitmap? Downscale(SKBitmap src)
        {
            var scale = Math.Min(1.0, (double)MaxEdge / Math.Max(src.Width, src.Height));
            if (scale >= 1.0) return null;

            var info = new SKImageInfo(
                Math.Max(1, (int)Math.Round(src.Width * scale)),
                Math.Max(1, (int)Math.Round(src.Height * scale)),
                SKColorType.Rgba8888, SKAlphaType.Premul);
            return src.Resize(info, new SKSamplingOptions(SKFilterMode.Linear, SKMipmapMode.Linear));
        }

        /// <summary>JPEG has no alpha: PNG/WebP transparency would turn black, so draw on white.</summary>
        private static SKBitmap FlattenOnWhite(SKBitmap src)
        {
            var dest = new SKBitmap(src.Width, src.Height, SKColorType.Rgba8888, SKAlphaType.Opaque);
            using var canvas = new SKCanvas(dest);
            canvas.Clear(SKColors.White);
            canvas.DrawBitmap(src, 0f, 0f, new SKSamplingOptions(SKFilterMode.Linear), null);
            return dest;
        }

        /// <summary>Rotates/mirrors the pixels so the image is upright regardless of the EXIF orientation tag.</summary>
        private static SKBitmap ApplyOrigin(SKBitmap src, SKEncodedOrigin origin)
        {
            float w = src.Width, h = src.Height;
            SKMatrix m;
            bool swap = false;
            switch (origin)
            {
                case SKEncodedOrigin.TopRight:    m = new SKMatrix(-1, 0, w, 0, 1, 0, 0, 0, 1); break;
                case SKEncodedOrigin.BottomRight: m = new SKMatrix(-1, 0, w, 0, -1, h, 0, 0, 1); break;
                case SKEncodedOrigin.BottomLeft:  m = new SKMatrix(1, 0, 0, 0, -1, h, 0, 0, 1); break;
                case SKEncodedOrigin.LeftTop:     m = new SKMatrix(0, 1, 0, 1, 0, 0, 0, 0, 1); swap = true; break;
                case SKEncodedOrigin.RightTop:    m = new SKMatrix(0, -1, h, 1, 0, 0, 0, 0, 1); swap = true; break;
                case SKEncodedOrigin.RightBottom: m = new SKMatrix(0, -1, h, -1, 0, w, 0, 0, 1); swap = true; break;
                case SKEncodedOrigin.LeftBottom:  m = new SKMatrix(0, 1, 0, -1, 0, w, 0, 0, 1); swap = true; break;
                default: return src.Copy();
            }

            var dest = new SKBitmap(swap ? src.Height : src.Width, swap ? src.Width : src.Height, src.ColorType, src.AlphaType);
            using var canvas = new SKCanvas(dest);
            canvas.Clear(SKColors.Transparent);
            canvas.SetMatrix(m);
            canvas.DrawBitmap(src, 0f, 0f, new SKSamplingOptions(SKFilterMode.Linear), null);
            return dest;
        }
    }
}
