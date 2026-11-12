using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace DoctorPlantTest.Tests
{
    /// <summary>Who may do what: owners, other users, admins and anonymous callers.</summary>
    public class PermissionTests : IClassFixture<ApiFactory>
    {
        private readonly ApiFactory _factory;
        public PermissionTests(ApiFactory factory) => _factory = factory;

        // ---------- ownership: posts ----------

        [Fact]
        public async Task Post_owner_comes_from_the_token_not_the_request()
        {
            var alice = await _factory.RegisterAsync();
            var bob = await _factory.RegisterAsync();

            // Alice tries to post "as Bob"
            var response = await alice.Client.PostAsync("/api/Posts",
                ApiTestHelpers.Form(("Title", "impersonation"), ("Content", "c"), ("UserId", bob.Id.ToString())));
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);

            var owner = await _factory.WithDb(db => db.Posts.Where(p => p.Title == "impersonation").Select(p => p.UserId).SingleAsync());
            Assert.Equal(alice.Id, owner);
        }

        [Fact]
        public async Task Only_the_owner_can_edit_a_post()
        {
            var owner = await _factory.RegisterAsync();
            var other = await _factory.RegisterAsync();
            var id = await _factory.CreatePostAsync(owner);

            var byOther = await other.Client.PutAsync($"/api/Posts/{id}", ApiTestHelpers.Form(("Title", "hacked"), ("Content", "x")));
            Assert.Equal(HttpStatusCode.Forbidden, byOther.StatusCode);

            var byOwner = await owner.Client.PutAsync($"/api/Posts/{id}", ApiTestHelpers.Form(("Title", "edited"), ("Content", "x")));
            Assert.Equal(HttpStatusCode.OK, byOwner.StatusCode);
            Assert.Equal("edited", await _factory.WithDb(db => db.Posts.Where(p => p.PostId == id).Select(p => p.Title).SingleAsync()));
        }

        [Fact]
        public async Task Only_the_owner_or_an_admin_can_delete_a_post()
        {
            var owner = await _factory.RegisterAsync();
            var other = await _factory.RegisterAsync();
            var admin = await _factory.RegisterAdminAsync();
            var id = await _factory.CreatePostAsync(owner, "to delete");

            Assert.Equal(HttpStatusCode.Forbidden, (await other.Client.DeleteAsync($"/api/Posts/{id}")).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await admin.Client.DeleteAsync($"/api/Posts/{id}")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await owner.Client.DeleteAsync($"/api/Posts/{id}")).StatusCode);
        }

        // ---------- ownership: comments and likes ----------

        [Fact]
        public async Task Comment_and_like_owner_come_from_the_token_and_cannot_be_removed_by_others()
        {
            var alice = await _factory.RegisterAsync();
            var bob = await _factory.RegisterAsync();
            var postId = await _factory.CreatePostAsync(alice);

            var comment = await bob.Client.PostAsJsonAsync("/api/Comments", new { postId, userId = alice.Id, text = "hi" });
            Assert.Equal(HttpStatusCode.Created, comment.StatusCode);
            var commentRow = await _factory.WithDb(db => db.Comments.SingleAsync(c => c.PostId == postId));
            Assert.Equal(bob.Id, commentRow.UserId);
            Assert.Equal(HttpStatusCode.Forbidden, (await alice.Client.DeleteAsync($"/api/Comments/{commentRow.CommentId}")).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await bob.Client.DeleteAsync($"/api/Comments/{commentRow.CommentId}")).StatusCode);

            Assert.Equal(HttpStatusCode.Created, (await bob.Client.PostAsJsonAsync("/api/Likes", new { postId })).StatusCode);
            // a second like from the same user does not create a duplicate
            await bob.Client.PostAsJsonAsync("/api/Likes", new { postId });
            var likes = await _factory.WithDb(db => db.Likes.Where(l => l.PostId == postId).ToListAsync());
            var like = Assert.Single(likes);
            Assert.Equal(bob.Id, like.UserId);
            Assert.Equal(HttpStatusCode.Forbidden, (await alice.Client.DeleteAsync($"/api/Likes/{like.LikeId}")).StatusCode);
        }

        [Fact]
        public async Task Commenting_on_a_post_notifies_its_author_but_not_yourself()
        {
            var author = await _factory.RegisterAsync();
            var visitor = await _factory.RegisterAsync();
            var postId = await _factory.CreatePostAsync(author);

            await visitor.Client.PostAsJsonAsync("/api/Comments", new { postId, text = "nice" });
            await author.Client.PostAsJsonAsync("/api/Comments", new { postId, text = "thanks" });

            var mine = await author.Client.GetFromJsonAsync<JsonElement>("/api/Notifications");
            Assert.Equal(1, mine.GetArrayLength());
            var none = await visitor.Client.GetFromJsonAsync<JsonElement>("/api/Notifications");
            Assert.Equal(0, none.GetArrayLength());
        }

        // ---------- ownership: users ----------

        [Fact]
        public async Task Users_cannot_edit_or_delete_other_users()
        {
            var alice = await _factory.RegisterAsync();
            var bob = await _factory.RegisterAsync();

            var edit = await alice.Client.PutAsJsonAsync($"/api/Users/{bob.Id}",
                new { firstName = "X", lastName = "Y", email = bob.Email });
            Assert.Equal(HttpStatusCode.Forbidden, edit.StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await alice.Client.DeleteAsync($"/api/Users/{bob.Id}")).StatusCode);

            var own = await alice.Client.PutAsJsonAsync($"/api/Users/{alice.Id}",
                new { firstName = "Alice", lastName = "Z", email = alice.Email });
            Assert.Equal(HttpStatusCode.OK, own.StatusCode);
        }

        [Fact]
        public async Task Changing_email_to_one_already_taken_is_409()
        {
            var alice = await _factory.RegisterAsync();
            var bob = await _factory.RegisterAsync();

            var response = await alice.Client.PutAsJsonAsync($"/api/Users/{alice.Id}",
                new { firstName = "A", lastName = "B", email = bob.Email });
            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        }

        [Fact]
        public async Task Other_users_profile_hides_the_email_and_listing_everyone_is_admin_only()
        {
            var alice = await _factory.RegisterAsync("Alice", "Smith");
            var bob = await _factory.RegisterAsync();

            var profile = await bob.Client.GetFromJsonAsync<JsonElement>($"/api/Users/{alice.Id}");
            Assert.Equal("Alice Smith", profile.GetProperty("name").GetString());
            Assert.DoesNotContain(profile.EnumerateObject(), p => p.Name.Equals("email", StringComparison.OrdinalIgnoreCase));

            Assert.Equal(HttpStatusCode.Forbidden, (await bob.Client.GetAsync("/api/Users")).StatusCode);
            var admin = await _factory.RegisterAdminAsync();
            Assert.Equal(HttpStatusCode.OK, (await admin.Client.GetAsync("/api/Users")).StatusCode);
        }

        // ---------- admin-only content ----------

        [Theory]
        [InlineData("POST", "/api/Diseases")]
        [InlineData("PUT", "/api/Diseases/1")]
        [InlineData("DELETE", "/api/Diseases/1")]
        [InlineData("DELETE", "/api/Crops/1")]
        [InlineData("POST", "/api/CropDetails")]
        [InlineData("DELETE", "/api/CropDetails/1")]
        [InlineData("GET", "/api/ContactMessages")]
        [InlineData("GET", "/api/Diagnoses")]
        [InlineData("GET", "/api/Users")]
        public async Task Admin_endpoints_reject_normal_users_and_anonymous_callers(string method, string url)
        {
            var user = await _factory.RegisterAsync();
            var anonymous = _factory.CreateClient();

            Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.SendAsync(new HttpRequestMessage(new HttpMethod(method), url) { Content = Content(method) })).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await user.Client.SendAsync(new HttpRequestMessage(new HttpMethod(method), url) { Content = Content(method) })).StatusCode);
        }

        private static HttpContent? Content(string method) =>
            method is "POST" or "PUT" ? JsonContent.Create(new { }) : null;

        [Fact]
        public async Task Anyone_can_read_public_content()
        {
            var anonymous = _factory.CreateClient();
            foreach (var url in new[] { "/api/Crops", "/api/Diseases", "/api/Posts", "/api/Comments", "/api/Likes", "/api/CropDetails", "/health" })
                Assert.Equal(HttpStatusCode.OK, (await anonymous.GetAsync(url)).StatusCode);
        }

        // ---------- contact form ----------

        [Fact]
        public async Task Contact_form_is_public_validated_and_readable_only_by_admin()
        {
            var anonymous = _factory.CreateClient();
            var ok = await anonymous.PostAsJsonAsync("/api/ContactMessages",
                new { name = "Farmer", email = "farmer@test.com", subject = "Question", message = "Hello" });
            Assert.Equal(HttpStatusCode.OK, ok.StatusCode);

            var badEmail = await anonymous.PostAsJsonAsync("/api/ContactMessages",
                new { name = "F", email = "nope", subject = "S", message = "M" });
            Assert.Equal(HttpStatusCode.BadRequest, badEmail.StatusCode);

            var admin = await _factory.RegisterAdminAsync();
            var all = await admin.Client.GetFromJsonAsync<JsonElement>("/api/ContactMessages");
            Assert.Contains(all.EnumerateArray(), m => m.GetProperty("subject").GetString() == "Question");
        }

        // ---------- CORS and error handling ----------

        [Fact]
        public async Task Cors_allows_only_configured_origins()
        {
            var client = _factory.CreateClient();

            var allowed = new HttpRequestMessage(HttpMethod.Options, "/api/Posts");
            allowed.Headers.Add("Origin", "https://dr-plant.netlify.app");
            allowed.Headers.Add("Access-Control-Request-Method", "GET");
            var ok = await client.SendAsync(allowed);
            Assert.Equal("https://dr-plant.netlify.app", ok.Headers.GetValues("Access-Control-Allow-Origin").Single());

            var evil = new HttpRequestMessage(HttpMethod.Options, "/api/Posts");
            evil.Headers.Add("Origin", "https://evil.example");
            evil.Headers.Add("Access-Control-Request-Method", "GET");
            var denied = await client.SendAsync(evil);
            Assert.False(denied.Headers.Contains("Access-Control-Allow-Origin"));
        }
    }
}
