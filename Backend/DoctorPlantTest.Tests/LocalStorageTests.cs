using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DoctorPlantTest.API.Diagnosis;
using DoctorPlantTest.API.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.FileProviders;
using Xunit;

namespace DoctorPlantTest.Tests
{
    internal sealed class StubEnv : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "test";
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string WebRootPath { get; set; } = "";
        public string EnvironmentName { get; set; } = "Development";
        public string ContentRootPath { get; set; } = Path.GetTempPath();
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    public sealed class LocalImageStorageTests : IDisposable
    {
        private const string Base = "https://api.example.com";
        private readonly string _root = Path.Combine(Path.GetTempPath(), "drplant-storage-" + Guid.NewGuid().ToString("N"));
        private readonly LocalImageStorage _storage;

        public LocalImageStorageTests()
        {
            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Storage:LocalPath"] = _root,
                ["Storage:PublicBaseUrl"] = Base + "/",
            }).Build();
            _storage = new LocalImageStorage(config, new StubEnv());
        }

        public void Dispose()
        {
            if (Directory.Exists(_root)) Directory.Delete(_root, true);
        }

        private static Stream Open(string name) => File.OpenRead(Path.Combine(AppContext.BaseDirectory, "TestData", name));

        [Fact]
        public async Task A_valid_image_is_stored_as_a_jpeg_with_a_random_public_url()
        {
            await using var stream = Open("rot6_640x480.jpg");
            var url = await _storage.UploadImageAsync(stream, "phone photo.JPG", "posts");

            Assert.Matches($"^{Base}/uploads/posts/[a-f0-9]{{32}}\\.jpg$", url);
            var file = Path.Combine(_root, "posts", url.Split('/').Last());
            var bytes = await File.ReadAllBytesAsync(file);
            Assert.Equal(0xFF, bytes[0]);
            Assert.Equal(0xD8, bytes[1]);
            Assert.DoesNotContain("Exif", System.Text.Encoding.Latin1.GetString(bytes)); // GPS/metadata stripped
        }

        [Fact]
        public async Task The_same_image_uploaded_twice_gets_two_different_names()
        {
            await using var a = Open("small.webp");
            await using var b = Open("small.webp");
            Assert.NotEqual(await _storage.UploadImageAsync(a, "x.webp", "crops"), await _storage.UploadImageAsync(b, "x.webp", "crops"));
        }

        [Fact]
        public async Task Something_that_is_not_an_image_is_refused_and_nothing_is_written()
        {
            await using var notImage = Open("not_an_image.jpg");
            await Assert.ThrowsAsync<InvalidImageException>(() => _storage.UploadImageAsync(notImage, "photo.jpg", "posts"));

            using var html = new MemoryStream(System.Text.Encoding.UTF8.GetBytes("<html><script>alert(1)</script></html>"));
            await Assert.ThrowsAsync<InvalidImageException>(() => _storage.UploadImageAsync(html, "evil.jpg", "posts"));

            Assert.False(Directory.Exists(Path.Combine(_root, "posts")) && Directory.GetFiles(Path.Combine(_root, "posts")).Length > 0);
        }

        [Theory]
        [InlineData("../outside")]
        [InlineData("a/b")]
        [InlineData("")]
        [InlineData("..")]
        public async Task Folder_names_that_could_escape_the_uploads_folder_are_refused(string folder)
        {
            await using var stream = Open("small.gif");
            await Assert.ThrowsAsync<ArgumentException>(() => _storage.UploadImageAsync(stream, "x.gif", folder));
        }

        [Fact]
        public async Task Deleting_removes_the_file()
        {
            await using var stream = Open("small.gif");
            var url = await _storage.UploadImageAsync(stream, "x.gif", "diagnoses");
            var file = Path.Combine(_root, "diagnoses", url.Split('/').Last());
            Assert.True(File.Exists(file));

            await _storage.DeleteImageAsync(url);

            Assert.False(File.Exists(file));
        }

        [Fact]
        public async Task A_crafted_url_cannot_delete_other_files()
        {
            Directory.CreateDirectory(Path.Combine(_root, "posts"));
            var decoy = Path.Combine(_root, "secret.jpg");
            var decoy2 = Path.Combine(_root, "posts", "keep.jpg");
            await File.WriteAllTextAsync(decoy, "x");
            await File.WriteAllTextAsync(decoy2, "x");

            await _storage.DeleteImageAsync($"{Base}/uploads/posts/../secret.jpg");
            await _storage.DeleteImageAsync($"{Base}/uploads/posts/keep.jpg");                    // not a random generated name
            await _storage.DeleteImageAsync($"{Base}/uploads/../../etc/passwd");
            await _storage.DeleteImageAsync("https://res.cloudinary.com/demo/image/upload/v1/posts/abc.jpg"); // someone else's URL
            await _storage.DeleteImageAsync("not a url");

            Assert.True(File.Exists(decoy));
            Assert.True(File.Exists(decoy2));
        }
    }

    /// <summary>The real API with Storage:Provider=Local (no fake storage) writing to a temp folder.</summary>
    public sealed class LocalStorageApiFactory : ApiFactory
    {
        public string Root { get; } = Path.Combine(Path.GetTempPath(), "drplant-api-uploads-" + Guid.NewGuid().ToString("N"));

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("Storage:Provider", "Local");
            builder.UseSetting("Storage:LocalPath", Root);
            builder.UseSetting("Storage:PublicBaseUrl", "http://localhost");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IImageStorage>();
                services.AddSingleton<IImageStorage>(sp => sp.GetRequiredService<LocalImageStorage>());
            });
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
            if (disposing && Directory.Exists(Root)) Directory.Delete(Root, true);
        }
    }

    public class LocalStorageApiTests : IClassFixture<LocalStorageApiFactory>
    {
        private readonly LocalStorageApiFactory _factory;
        public LocalStorageApiTests(LocalStorageApiFactory factory) => _factory = factory;

        private static MultipartFormDataContent PostWithFile(string fileName, byte[] bytes, string contentType)
        {
            var form = ApiTestHelpers.Form(("Title", "with picture"), ("Content", "body"));
            var file = new ByteArrayContent(bytes);
            file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
            form.Add(file, "file", fileName);
            return form;
        }

        [Fact]
        public async Task A_post_picture_is_stored_on_disk_and_served_safely()
        {
            var user = await _factory.RegisterAsync();
            var bytes = await File.ReadAllBytesAsync(Path.Combine(AppContext.BaseDirectory, "TestData", "rot6_640x480.jpg"));

            var created = await user.Client.PostAsync("/api/Posts", PostWithFile("leaf.jpg", bytes, "image/jpeg"));
            Assert.Equal(HttpStatusCode.Created, created.StatusCode);

            var posts = await _factory.CreateClient().GetFromJsonAsync<JsonElement>("/api/Posts");
            var url = posts.EnumerateArray().Single(p => p.GetProperty("title").GetString() == "with picture").GetProperty("imageUrl").GetString()!;
            Assert.StartsWith("http://localhost/uploads/posts/", url);

            var image = await _factory.CreateClient().GetAsync(new Uri(url).AbsolutePath);
            Assert.Equal(HttpStatusCode.OK, image.StatusCode);
            Assert.Equal("image/jpeg", image.Content.Headers.ContentType?.MediaType);
            Assert.Equal("nosniff", image.Headers.GetValues("X-Content-Type-Options").Single());
        }

        [Fact]
        public async Task A_file_that_only_pretends_to_be_an_image_is_rejected_with_400()
        {
            var user = await _factory.RegisterAsync();
            var html = System.Text.Encoding.UTF8.GetBytes("<html><script>alert(document.cookie)</script></html>");

            var response = await user.Client.PostAsync("/api/Posts", PostWithFile("evil.jpg", html, "image/jpeg"));

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Files_outside_the_uploads_folder_are_not_reachable()
        {
            var client = _factory.CreateClient();
            Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/uploads/../appsettings.json")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/uploads/posts/nothing.jpg")).StatusCode);
        }
    }
}
