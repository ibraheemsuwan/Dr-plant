using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DoctorPlantTest.API.Services;
using DoctorPlantTest.DAL.Data;
using DoctorPlantTest.DAL.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace DoctorPlantTest.Tests
{
    /// <summary>Starts the real API in memory with an in-memory database and test configuration.</summary>
    public class ApiFactory : WebApplicationFactory<Program>
    {
        private readonly string _dbName = Guid.NewGuid().ToString();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            // UseSetting (not ConfigureAppConfiguration): Program.cs reads these while building the host,
            // before configuration added through the factory would be visible.
            var settings = new Dictionary<string, string>
            {
                ["Jwt:Key"] = "integration-test-signing-key-0123456789abcdef",
                ["ConnectionStrings:DefaultConnection"] = "Server=unused;Database=unused",
                ["Cloudinary:CloudName"] = "test",
                ["Cloudinary:ApiKey"] = "test",
                ["Cloudinary:ApiSecret"] = "test",
                ["AllowedOrigins:0"] = "https://dr-plant.netlify.app",
                // Tests register many users from one IP
                ["RateLimits:AuthPerMinute"] = "100000",
                ["RateLimits:ContactPer10Minutes"] = "100000",
                ["RateLimits:PredictPerHour"] = "100000",
            };
            foreach (var (key, value) in settings) builder.UseSetting(key, value);

            builder.ConfigureServices(services =>
            {
                var toRemove = services.Where(d =>
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                    d.ServiceType == typeof(DbContextOptions)).ToList();
                foreach (var d in toRemove) services.Remove(d);

                services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(_dbName));

                // Never touch the real Cloudinary from tests
                services.RemoveAll<ICloudinaryService>();
                services.AddSingleton<FakeCloudinary>();
                services.AddSingleton<ICloudinaryService>(sp => sp.GetRequiredService<FakeCloudinary>());
            });
        }

        public async Task<T> WithDb<T>(Func<AppDbContext, Task<T>> action)
        {
            using var scope = Services.CreateScope();
            return await action(scope.ServiceProvider.GetRequiredService<AppDbContext>());
        }

        public Task WithDb(Func<AppDbContext, Task> action) =>
            WithDb<object?>(async db => { await action(db); return null; });
    }

    public class FakeCloudinary : ICloudinaryService
    {
        public List<string> Deleted { get; } = [];
        public Task<string> UploadImageAsync(Microsoft.AspNetCore.Http.IFormFile file, string folder) => Task.FromResult("https://fake/upload/x.jpg");
        public Task<string> UploadImageAsync(Stream stream, string fileName, string folder) => Task.FromResult("https://fake/upload/x.jpg");
        public Task DeleteImageAsync(string imageUrl) { Deleted.Add(imageUrl); return Task.CompletedTask; }
    }

    public record TestUser(long Id, string Email, string Token, HttpClient Client);

    public static class ApiTestHelpers
    {
        private static int _counter;

        /// <summary>Registers a normal user and returns a client that sends its JWT.</summary>
        public static async Task<TestUser> RegisterAsync(this ApiFactory factory, string first = "Test", string last = "User")
        {
            var email = $"u{Interlocked.Increment(ref _counter)}-{Guid.NewGuid():N}@test.com";
            var anon = factory.CreateClient();
            var response = await anon.PostAsJsonAsync("/api/Auth/register",
                new { firstName = first, lastName = last, email, password = "secret123" });
            response.EnsureSuccessStatusCode();

            var token = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("token").GetString()!;
            var id = await factory.WithDb(db => db.Users.Where(u => u.Email == email).Select(u => u.UserId).SingleAsync());
            return new TestUser(id, email, token, factory.ClientWithToken(token));
        }

        /// <summary>Registers a user and promotes it to admin in the database, then logs in again so the JWT carries the role.</summary>
        public static async Task<TestUser> RegisterAdminAsync(this ApiFactory factory)
        {
            var user = await factory.RegisterAsync("Ad", "Min");
            await factory.WithDb(async db =>
            {
                var u = await db.Users.SingleAsync(x => x.UserId == user.Id);
                u.Role = "admin";
                await db.SaveChangesAsync();
            });

            var login = await factory.CreateClient().PostAsJsonAsync("/api/Auth/login",
                new { email = user.Email, password = "secret123" });
            var token = (await login.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("token").GetString()!;
            return user with { Token = token, Client = factory.ClientWithToken(token) };
        }

        public static HttpClient ClientWithToken(this ApiFactory factory, string token)
        {
            var client = factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            return client;
        }

        public static MultipartFormDataContent Form(params (string Key, string Value)[] fields)
        {
            var form = new MultipartFormDataContent();
            foreach (var (k, v) in fields) form.Add(new StringContent(v), k);
            return form;
        }

        public static async Task<long> CreatePostAsync(this ApiFactory factory, TestUser owner, string title = "My post")
        {
            var response = await owner.Client.PostAsync("/api/Posts", Form(("Title", title), ("Content", "body")));
            response.EnsureSuccessStatusCode();
            return await factory.WithDb(db => db.Posts.Where(p => p.Title == title && p.UserId == owner.Id)
                .OrderByDescending(p => p.PostId).Select(p => p.PostId).FirstAsync());
        }
    }
}
