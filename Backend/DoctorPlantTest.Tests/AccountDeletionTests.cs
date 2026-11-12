using System.Net;
using DoctorPlantTest.API.Services;
using DoctorPlantTest.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace DoctorPlantTest.Tests
{
    public class AccountDeletionTests : IClassFixture<ApiFactory>
    {
        private readonly ApiFactory _factory;
        public AccountDeletionTests(ApiFactory factory) => _factory = factory;

        [Theory]
        [InlineData("https://res.cloudinary.com/demo/image/upload/v1777041316/diagnoses/zr3mov1fggyzmr0x5qrf.jpg", "diagnoses/zr3mov1fggyzmr0x5qrf")]
        [InlineData("https://res.cloudinary.com/demo/image/upload/diagnoses/abc.webp", "diagnoses/abc")]
        [InlineData("https://res.cloudinary.com/demo/image/upload/v12/a/b/c.png", "a/b/c")]
        public void Public_id_is_extracted_from_a_cloudinary_url(string url, string expected) =>
            Assert.Equal(expected, CloudinaryService.ExtractPublicId(url));

        [Fact]
        public void Non_cloudinary_urls_give_no_public_id() =>
            Assert.Null(CloudinaryService.ExtractPublicId("https://example.com/photo.jpg"));

        [Fact]
        public async Task Deleting_your_account_removes_your_diagnoses_notifications_and_their_images()
        {
            var user = await _factory.RegisterAsync();
            var other = await _factory.RegisterAsync();
            var post = await _factory.CreatePostAsync(other);

            await _factory.WithDb(async db =>
            {
                db.ImageDiagnoses.Add(new ImageDiagnosis { UserId = user.Id, ImageUrl = "https://x/upload/v1/diagnoses/mine.jpg", Status = "Completed/local", CreatedAt = DateTime.UtcNow });
                db.ImageDiagnoses.Add(new ImageDiagnosis { UserId = other.Id, ImageUrl = "https://x/upload/v1/diagnoses/theirs.jpg", Status = "Completed/local", CreatedAt = DateTime.UtcNow });
                db.Notifications.Add(new Notification { ReceiverUserId = user.Id, ActorUserId = other.Id, PostId = post, Type = "like", Message = "m", CreatedAt = DateTime.UtcNow });
                db.Notifications.Add(new Notification { ReceiverUserId = other.Id, ActorUserId = user.Id, PostId = post, Type = "like", Message = "m", CreatedAt = DateTime.UtcNow });
                await db.SaveChangesAsync();
            });

            var response = await user.Client.DeleteAsync($"/api/Users/{user.Id}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            Assert.False(await _factory.WithDb(db => db.Users.AnyAsync(u => u.UserId == user.Id)));
            Assert.False(await _factory.WithDb(db => db.ImageDiagnoses.AnyAsync(d => d.UserId == user.Id)));
            Assert.False(await _factory.WithDb(db => db.Notifications.AnyAsync(n => n.ReceiverUserId == user.Id || n.ActorUserId == user.Id)));

            // other people's data is untouched
            Assert.True(await _factory.WithDb(db => db.ImageDiagnoses.AnyAsync(d => d.UserId == other.Id)));
            Assert.True(await _factory.WithDb(db => db.Users.AnyAsync(u => u.UserId == other.Id)));

            var fake = _factory.Services.GetRequiredService<FakeCloudinary>();
            Assert.Contains("https://x/upload/v1/diagnoses/mine.jpg", fake.Deleted);
            Assert.DoesNotContain("https://x/upload/v1/diagnoses/theirs.jpg", fake.Deleted);
        }
    }
}
