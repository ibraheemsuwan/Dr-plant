using DoctorPlantTest.API.Diagnosis;
using SkiaSharp;
using Xunit;

namespace DoctorPlantTest.Tests
{
    public class ImagePreparerTests
    {
        private static async Task<byte[]?> Prepare(string file)
        {
            await using var stream = File.OpenRead(Path.Combine(AppContext.BaseDirectory, "TestData", file));
            return await ImagePreparer.ToNormalizedJpegAsync(stream, CancellationToken.None);
        }

        private static SKBitmap Decode(byte[] bytes) => SKBitmap.Decode(bytes);

        [Fact]
        public async Task Output_is_a_jpeg()
        {
            var result = await Prepare("small.gif");
            Assert.NotNull(result);
            Assert.Equal(0xFF, result![0]);
            Assert.Equal(0xD8, result[1]);
        }

        [Fact]
        public async Task Phone_photo_with_exif_rotation_is_made_upright()
        {
            var result = await Prepare("rot6_640x480.jpg");
            using var bmp = Decode(result!);

            // 640x480 with orientation 6 must come out portrait
            Assert.Equal(480, bmp.Width);
            Assert.Equal(640, bmp.Height);

            // Rotating 90 degrees clockwise moves the red left half to the top
            var top = bmp.GetPixel(240, 100);
            var bottom = bmp.GetPixel(240, 540);
            Assert.True(top.Red > 200 && top.Blue < 60, $"top should be red, was {top}");
            Assert.True(bottom.Blue > 200 && bottom.Red < 60, $"bottom should be blue, was {bottom}");
        }

        [Fact]
        public async Task Large_photo_is_downscaled_keeping_aspect_ratio()
        {
            var result = await Prepare("big_3000x2000.jpg");
            using var bmp = Decode(result!);

            Assert.Equal(ImagePreparer.MaxEdge, bmp.Width);
            Assert.InRange(bmp.Height, 1045, 1046); // 1568 * 2/3
        }

        [Fact]
        public async Task Small_photo_keeps_its_size()
        {
            var result = await Prepare("small.webp");
            using var bmp = Decode(result!);
            Assert.Equal(120, bmp.Width);
            Assert.Equal(90, bmp.Height);
        }

        [Fact]
        public async Task Transparent_png_becomes_white_not_black()
        {
            var result = await Prepare("transparent.png");
            using var bmp = Decode(result!);
            var px = bmp.GetPixel(50, 50);
            Assert.True(px.Red > 240 && px.Green > 240 && px.Blue > 240, $"expected white, was {px}");
        }

        [Fact]
        public async Task Exif_metadata_is_stripped()
        {
            var result = await Prepare("rot6_640x480.jpg");
            // "Exif" marker (APP1) must not survive re-encoding
            var asText = System.Text.Encoding.Latin1.GetString(result!);
            Assert.DoesNotContain("Exif", asText);
        }

        [Fact]
        public async Task File_that_is_not_an_image_returns_null()
        {
            Assert.Null(await Prepare("not_an_image.jpg"));
        }

        [Fact]
        public async Task Empty_stream_returns_null()
        {
            using var empty = new MemoryStream();
            Assert.Null(await ImagePreparer.ToNormalizedJpegAsync(empty, CancellationToken.None));
        }
    }
}
