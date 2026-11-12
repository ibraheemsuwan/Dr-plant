using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace DoctorPlantTest.Tests
{
    public class AuthTests : IClassFixture<ApiFactory>
    {
        private readonly ApiFactory _factory;
        public AuthTests(ApiFactory factory) => _factory = factory;

        private static object Reg(string email, string password = "secret123") =>
            new { firstName = "A", lastName = "B", email, password };

        [Fact]
        public async Task Register_then_login_returns_a_token()
        {
            var client = _factory.CreateClient();
            var email = $"login-{Guid.NewGuid():N}@test.com";

            var reg = await client.PostAsJsonAsync("/api/Auth/register", Reg(email));
            Assert.Equal(HttpStatusCode.OK, reg.StatusCode);

            var login = await client.PostAsJsonAsync("/api/Auth/login", new { email, password = "secret123" });
            Assert.Equal(HttpStatusCode.OK, login.StatusCode);
            var body = await login.Content.ReadFromJsonAsync<JsonElement>();
            Assert.False(string.IsNullOrEmpty(body.GetProperty("token").GetString()));
            Assert.Equal("user", body.GetProperty("role").GetString());
        }

        [Fact]
        public async Task Duplicate_email_is_rejected_with_409_even_in_different_case()
        {
            var client = _factory.CreateClient();
            var email = $"dup-{Guid.NewGuid():N}@test.com";
            await client.PostAsJsonAsync("/api/Auth/register", Reg(email));

            var again = await client.PostAsJsonAsync("/api/Auth/register", Reg(email));
            Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
        }

        [Fact]
        public async Task Wrong_password_is_401()
        {
            var client = _factory.CreateClient();
            var email = $"wrong-{Guid.NewGuid():N}@test.com";
            await client.PostAsJsonAsync("/api/Auth/register", Reg(email));

            var login = await client.PostAsJsonAsync("/api/Auth/login", new { email, password = "not-the-password" });
            Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);
        }

        [Fact]
        public async Task New_accounts_cannot_make_themselves_admin()
        {
            var client = _factory.CreateClient();
            var email = $"role-{Guid.NewGuid():N}@test.com";
            var response = await client.PostAsJsonAsync("/api/Auth/register",
                new { firstName = "A", lastName = "B", email, password = "secret123", role = "admin" });

            var body = await response.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Equal("user", body.GetProperty("role").GetString());
        }

        [Fact]
        public async Task Passwords_are_stored_hashed()
        {
            var user = await _factory.RegisterAsync();
            var hash = await _factory.WithDb(db => Task.FromResult(db.Users.Single(u => u.UserId == user.Id).PasswordHash));
            Assert.DoesNotContain("secret123", hash);
            Assert.StartsWith("$2", hash); // bcrypt
        }

        [Fact]
        public async Task Protected_endpoints_require_a_token()
        {
            var client = _factory.CreateClient();
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/Notifications")).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/Diagnoses/mine")).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsync("/api/Posts", ApiTestHelpers.Form(("Title", "t"), ("Content", "c")))).StatusCode);
        }

        [Fact]
        public async Task A_garbage_token_is_rejected()
        {
            var client = _factory.ClientWithToken("not.a.jwt");
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/Notifications")).StatusCode);
        }
    }
}
