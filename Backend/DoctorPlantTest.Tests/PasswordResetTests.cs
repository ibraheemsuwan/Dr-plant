using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using DoctorPlantTest.BLL.Services.Email;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace DoctorPlantTest.Tests
{
    public class PasswordResetTokenTests
    {
        private const string Secret = "unit-test-secret-0123456789abcdef0123456789";
        private static readonly DateTimeOffset Now = new(2026, 11, 13, 12, 0, 0, TimeSpan.Zero);

        [Fact]
        public void A_fresh_token_reads_back_the_user_and_matches_the_current_password()
        {
            var token = PasswordResetTokens.Create(Secret, 42, "hash-A", Now.AddHours(1));

            Assert.True(PasswordResetTokens.TryRead(Secret, token, Now, out var userId, out var fingerprint));
            Assert.Equal(42, userId);
            Assert.True(PasswordResetTokens.FingerprintMatches(fingerprint, "hash-A"));
        }

        [Fact]
        public void The_token_stops_matching_once_the_password_changes()
        {
            var token = PasswordResetTokens.Create(Secret, 42, "hash-A", Now.AddHours(1));
            PasswordResetTokens.TryRead(Secret, token, Now, out _, out var fingerprint);

            Assert.False(PasswordResetTokens.FingerprintMatches(fingerprint, "hash-B"));
        }

        [Fact]
        public void An_expired_token_is_rejected()
        {
            var token = PasswordResetTokens.Create(Secret, 42, "hash-A", Now.AddMinutes(-1));
            Assert.False(PasswordResetTokens.TryRead(Secret, token, Now, out _, out _));
        }

        [Fact]
        public void A_token_signed_with_another_secret_is_rejected()
        {
            var token = PasswordResetTokens.Create("some-other-secret-0123456789abcdef0123456789", 42, "hash-A", Now.AddHours(1));
            Assert.False(PasswordResetTokens.TryRead(Secret, token, Now, out _, out _));
        }

        [Fact]
        public void Editing_the_user_id_in_a_token_breaks_the_signature()
        {
            var token = PasswordResetTokens.Create(Secret, 42, "hash-A", Now.AddHours(1));
            var other = PasswordResetTokens.Create(Secret, 1, "hash-A", Now.AddHours(1));
            var forged = other.Split('.')[0] + "." + token.Split('.')[1]; // payload of user 1, signature of user 42

            Assert.False(PasswordResetTokens.TryRead(Secret, forged, Now, out _, out _));
        }

        [Theory]
        [InlineData("")]
        [InlineData("abc")]
        [InlineData("a.b")]
        [InlineData("a.b.c")]
        [InlineData("!!!.???")]
        [InlineData("....")]
        public void Garbage_is_rejected_without_throwing(string token) =>
            Assert.False(PasswordResetTokens.TryRead(Secret, token, Now, out _, out _));
    }

    public class PasswordResetFlowTests : IClassFixture<ApiFactory>
    {
        private readonly ApiFactory _factory;
        public PasswordResetFlowTests(ApiFactory factory) => _factory = factory;

        private FakeEmailSender Mail => _factory.Services.GetRequiredService<FakeEmailSender>();

        private async Task<string> RequestLinkTokenAsync(string email)
        {
            var response = await _factory.CreateClient().PostAsJsonAsync("/api/Auth/forgot-password", new { email });
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var mail = await Mail.WaitForAsync(email);
            Assert.NotNull(mail);
            var match = Regex.Match(mail!.Value.Text, @"/reset-password\?token=([^\s]+)");
            Assert.True(match.Success, "the email must contain the reset link");
            return Uri.UnescapeDataString(match.Groups[1].Value);
        }

        [Fact]
        public async Task The_full_flow_works_and_the_link_can_be_used_only_once()
        {
            var user = await _factory.RegisterAsync();
            var client = _factory.CreateClient();
            var token = await RequestLinkTokenAsync(user.Email);

            var reset = await client.PostAsJsonAsync("/api/Auth/reset-password", new { token, newPassword = "brand-new-pass" });
            Assert.Equal(HttpStatusCode.OK, reset.StatusCode);

            Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/Auth/login", new { email = user.Email, password = "brand-new-pass" })).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/Auth/login", new { email = user.Email, password = "secret123" })).StatusCode);

            // the same link again
            var again = await client.PostAsJsonAsync("/api/Auth/reset-password", new { token, newPassword = "another-pass-1" });
            Assert.Equal(HttpStatusCode.BadRequest, again.StatusCode);
        }

        [Fact]
        public async Task The_email_points_to_the_frontend_and_is_in_both_languages()
        {
            var user = await _factory.RegisterAsync();
            await RequestLinkTokenAsync(user.Email);

            var mail = (await Mail.WaitForAsync(user.Email))!.Value;
            Assert.StartsWith("https://dr-plant.netlify.app/reset-password?token=", Regex.Match(mail.Text, @"https://\S+").Value);
            Assert.Contains("إعادة تعيين", mail.Subject);
            Assert.Contains("Reset your Dr Plant password", mail.Subject);
        }

        [Fact]
        public async Task Asking_for_an_unknown_email_answers_exactly_like_a_known_one_and_sends_nothing()
        {
            var known = await _factory.RegisterAsync();
            var client = _factory.CreateClient();
            var unknown = $"nobody-{Guid.NewGuid():N}@test.com";

            var a = await client.PostAsJsonAsync("/api/Auth/forgot-password", new { email = known.Email });
            var b = await client.PostAsJsonAsync("/api/Auth/forgot-password", new { email = unknown });

            Assert.Equal(a.StatusCode, b.StatusCode);
            Assert.Equal(await a.Content.ReadAsStringAsync(), await b.Content.ReadAsStringAsync());
            await Task.Delay(300);
            Assert.DoesNotContain(Mail.Sent, m => m.To == unknown);
        }

        [Fact]
        public async Task A_link_issued_before_a_normal_password_change_stops_working()
        {
            var user = await _factory.RegisterAsync();
            var token = await RequestLinkTokenAsync(user.Email);

            var change = await user.Client.PutAsJsonAsync("/api/Users/change-password", new { oldPassword = "secret123", newPassword = "changed-by-user" });
            Assert.Equal(HttpStatusCode.OK, change.StatusCode);

            var reset = await _factory.CreateClient().PostAsJsonAsync("/api/Auth/reset-password", new { token, newPassword = "attacker-pass-1" });
            Assert.Equal(HttpStatusCode.BadRequest, reset.StatusCode);
        }

        [Fact]
        public async Task A_reset_token_cannot_be_used_to_call_the_api_as_the_user()
        {
            var user = await _factory.RegisterAsync();
            var token = await RequestLinkTokenAsync(user.Email);

            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/Notifications")).StatusCode);
        }

        [Fact]
        public async Task Bad_requests_are_rejected()
        {
            var client = _factory.CreateClient();
            var user = await _factory.RegisterAsync();
            var token = await RequestLinkTokenAsync(user.Email);

            Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/Auth/reset-password", new { token = "not-a-token", newPassword = "long-enough-pass" })).StatusCode);
            Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/Auth/reset-password", new { token, newPassword = "abc" })).StatusCode); // too short
            Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/Auth/forgot-password", new { email = "not-an-email" })).StatusCode);
        }
    }
}
