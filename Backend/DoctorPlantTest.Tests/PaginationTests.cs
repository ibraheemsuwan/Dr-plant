using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DoctorPlantTest.DAL.Entities;
using Xunit;

namespace DoctorPlantTest.Tests
{
    public class PaginationTests : IClassFixture<ApiFactory>
    {
        private readonly ApiFactory _factory;
        public PaginationTests(ApiFactory factory) => _factory = factory;

        private static readonly DateTime T0 = new(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);

        /// <summary>Seeds `count` posts for one author, titled "{prefix}-01"..., created one minute apart (higher number = newer).</summary>
        private async Task<List<long>> SeedPostsAsync(long userId, string prefix, int count, string category = "General")
        {
            return await _factory.WithDb(async db =>
            {
                var posts = Enumerable.Range(1, count).Select(i => new Post
                {
                    UserId = userId, Title = $"{prefix}-{i:00}", Content = $"content of {prefix} {i}",
                    Category = category, CreatedAt = T0.AddMinutes(i),
                }).ToList();
                db.Posts.AddRange(posts);
                await db.SaveChangesAsync();
                return posts.Select(p => p.PostId).ToList();
            });
        }

        private async Task<JsonElement> FeedAsync(string query)
        {
            var response = await _factory.CreateClient().GetAsync("/api/Posts/feed" + query);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            return await response.Content.ReadFromJsonAsync<JsonElement>();
        }

        private static string[] Titles(JsonElement page) =>
            page.GetProperty("items").EnumerateArray().Select(p => p.GetProperty("title").GetString()!).ToArray();

        // ---------- the feed ----------

        [Fact]
        public async Task The_feed_returns_one_page_newest_first_with_totals_for_a_pager()
        {
            var author = await _factory.RegisterAsync();
            var tag = Guid.NewGuid().ToString("N")[..6];
            await SeedPostsAsync(author.Id, tag, 25);

            var p1 = await FeedAsync($"?pageSize=10&userId={author.Id}");
            Assert.Equal(25, p1.GetProperty("total").GetInt32());
            Assert.Equal(3, p1.GetProperty("totalPages").GetInt32());
            Assert.Equal(1, p1.GetProperty("page").GetInt32());
            Assert.Equal(Enumerable.Range(0, 10).Select(i => $"{tag}-{25 - i:00}"), Titles(p1));

            var p3 = await FeedAsync($"?page=3&pageSize=10&userId={author.Id}");
            Assert.Equal(Enumerable.Range(1, 5).Reverse().Select(i => $"{tag}-{i:00}"), Titles(p3));

            var beyond = await FeedAsync($"?page=4&pageSize=10&userId={author.Id}");
            Assert.Empty(Titles(beyond));
            Assert.Equal(25, beyond.GetProperty("total").GetInt32());
        }

        [Fact]
        public async Task Pages_do_not_overlap_or_skip_posts()
        {
            var author = await _factory.RegisterAsync();
            await SeedPostsAsync(author.Id, "cover", 23);

            var seen = new List<string>();
            for (var page = 1; page <= 3; page++)
                seen.AddRange(Titles(await FeedAsync($"?page={page}&pageSize=10&userId={author.Id}")));

            Assert.Equal(23, seen.Count);
            Assert.Equal(23, seen.Distinct().Count());
        }

        [Fact]
        public async Task Silly_paging_values_are_corrected_not_trusted()
        {
            var author = await _factory.RegisterAsync();
            await SeedPostsAsync(author.Id, "clamp", 60);

            var huge = await FeedAsync($"?pageSize=100000&userId={author.Id}");
            Assert.Equal(50, huge.GetProperty("pageSize").GetInt32());
            Assert.Equal(50, Titles(huge).Length);

            var negative = await FeedAsync($"?page=-5&pageSize=-1&userId={author.Id}");
            Assert.Equal(1, negative.GetProperty("page").GetInt32());
            Assert.Equal(10, negative.GetProperty("pageSize").GetInt32());
        }

        [Fact]
        public async Task The_feed_can_be_filtered_by_category_author_and_text()
        {
            var alice = await _factory.RegisterAsync("Alice", "A");
            var bob = await _factory.RegisterAsync("Bob", "B");
            var tag = Guid.NewGuid().ToString("N")[..6];
            await SeedPostsAsync(alice.Id, $"{tag}-soil", 3, "Soil Health");
            await SeedPostsAsync(bob.Id, $"{tag}-pest", 4, "Pest Control");

            var soil = await FeedAsync($"?category=Soil%20Health&search={tag}");
            Assert.Equal(3, soil.GetProperty("total").GetInt32());

            var all = await FeedAsync($"?category=All&search={tag}");
            Assert.Equal(7, all.GetProperty("total").GetInt32());

            var mine = await FeedAsync($"?userId={alice.Id}&search={tag}");
            Assert.Equal(3, mine.GetProperty("total").GetInt32());

            var community = await FeedAsync($"?excludeUserId={alice.Id}&search={tag}");
            Assert.Equal(4, community.GetProperty("total").GetInt32());

            var byWord = await FeedAsync($"?search={tag}-pest-03");
            Assert.Single(Titles(byWord));
        }

        [Fact]
        public async Task Each_post_carries_its_own_likes_and_comments_with_author_names()
        {
            var author = await _factory.RegisterAsync("Post", "Author");
            var fan = await _factory.RegisterAsync("Fan", "Reader");
            var tag = Guid.NewGuid().ToString("N")[..6];
            var ids = await SeedPostsAsync(author.Id, tag, 3);
            var (first, second) = (ids[0], ids[1]);

            await _factory.WithDb(async db =>
            {
                db.Comments.Add(new Comment { PostId = first, UserId = fan.Id, Text = "first!", CreatedAt = T0 });
                db.Comments.Add(new Comment { PostId = first, UserId = author.Id, Text = "thanks", CreatedAt = T0.AddMinutes(1) });
                db.Likes.Add(new Like { PostId = first, UserId = fan.Id, CreatedAt = T0 });
                db.Comments.Add(new Comment { PostId = second, UserId = fan.Id, Text = "other post", CreatedAt = T0 });
                await db.SaveChangesAsync();
            });

            var page = await FeedAsync($"?userId={author.Id}&search={tag}");
            var items = page.GetProperty("items").EnumerateArray().ToList();
            var p1 = items.Single(p => p.GetProperty("postId").GetInt64() == first);
            var p2 = items.Single(p => p.GetProperty("postId").GetInt64() == second);
            var p3 = items.Single(p => p.GetProperty("postId").GetInt64() == ids[2]);

            Assert.Equal(2, p1.GetProperty("commentCount").GetInt32());
            Assert.Equal("Fan Reader", p1.GetProperty("comments")[0].GetProperty("authorName").GetString());
            Assert.Equal("first!", p1.GetProperty("comments")[0].GetProperty("text").GetString()); // oldest first
            Assert.Equal(1, p1.GetProperty("likeCount").GetInt32());
            Assert.Equal(fan.Id, p1.GetProperty("likes")[0].GetProperty("userId").GetInt64());
            Assert.True(p1.GetProperty("likes")[0].GetProperty("likeId").GetInt64() > 0); // needed to un-like

            Assert.Equal(1, p2.GetProperty("commentCount").GetInt32());
            Assert.Equal(0, p2.GetProperty("likeCount").GetInt32());
            Assert.Equal("Post Author", p1.GetProperty("authorName").GetString());
            Assert.Equal(0, p3.GetProperty("commentCount").GetInt32());
        }

        [Fact]
        public async Task A_page_only_loads_likes_and_comments_of_its_own_posts()
        {
            var author = await _factory.RegisterAsync();
            var tag = Guid.NewGuid().ToString("N")[..6];
            var ids = await SeedPostsAsync(author.Id, tag, 15);
            var oldest = ids[0]; // lands on page 2 when pageSize=10

            await _factory.WithDb(async db =>
            {
                db.Comments.Add(new Comment { PostId = oldest, UserId = author.Id, Text = "only on page 2", CreatedAt = T0 });
                await db.SaveChangesAsync();
            });

            var page1 = await FeedAsync($"?pageSize=10&userId={author.Id}&search={tag}");
            Assert.All(page1.GetProperty("items").EnumerateArray(), p => Assert.Equal(0, p.GetProperty("commentCount").GetInt32()));
            var page2 = await FeedAsync($"?page=2&pageSize=10&userId={author.Id}&search={tag}");
            Assert.Equal(1, page2.GetProperty("items").EnumerateArray().Sum(p => p.GetProperty("commentCount").GetInt32()));
        }

        [Fact]
        public async Task The_feed_is_public_and_an_empty_result_is_not_an_error()
        {
            var page = await FeedAsync("?search=no-such-text-anywhere-9f2c");
            Assert.Equal(0, page.GetProperty("total").GetInt32());
            Assert.Equal(0, page.GetProperty("totalPages").GetInt32());
            Assert.Empty(Titles(page));
        }

        // ---------- the older list endpoints are bounded ----------

        [Fact]
        public async Task Comments_and_likes_can_be_fetched_for_one_post_and_are_capped()
        {
            var user = await _factory.RegisterAsync();
            var ids = await SeedPostsAsync(user.Id, "cap", 2);
            await _factory.WithDb(async db =>
            {
                for (var i = 0; i < 8; i++)
                    db.Comments.Add(new Comment { PostId = ids[0], UserId = user.Id, Text = $"c{i}", CreatedAt = T0.AddMinutes(i) });
                db.Comments.Add(new Comment { PostId = ids[1], UserId = user.Id, Text = "elsewhere", CreatedAt = T0 });
                await db.SaveChangesAsync();
            });
            var client = _factory.CreateClient();

            var forPost = await client.GetFromJsonAsync<JsonElement>($"/api/Comments?postId={ids[0]}");
            Assert.Equal(8, forPost.GetArrayLength());

            var capped = await client.GetFromJsonAsync<JsonElement>($"/api/Comments?postId={ids[0]}&limit=3");
            Assert.Equal(3, capped.GetArrayLength());
            Assert.Equal("c5", capped[0].GetProperty("text").GetString()); // the 3 newest, shown oldest first
            Assert.Equal("c7", capped[2].GetProperty("text").GetString());

            Assert.Equal(0, (await client.GetFromJsonAsync<JsonElement>($"/api/Likes?postId={ids[0]}")).GetArrayLength());
        }

        // ---------- my diagnoses ----------

        [Fact]
        public async Task My_diagnoses_come_in_pages_and_only_mine()
        {
            var me = await _factory.RegisterAsync();
            var other = await _factory.RegisterAsync();
            await _factory.WithDb(async db =>
            {
                for (var i = 1; i <= 25; i++)
                    db.ImageDiagnoses.Add(new ImageDiagnosis { UserId = me.Id, Status = "Completed/local", ConfidencePercent = i, CreatedAt = T0.AddMinutes(i) });
                for (var i = 0; i < 5; i++)
                    db.ImageDiagnoses.Add(new ImageDiagnosis { UserId = other.Id, Status = "Completed/local", CreatedAt = T0 });
                await db.SaveChangesAsync();
            });

            var p1 = await me.Client.GetFromJsonAsync<JsonElement>("/api/Diagnoses/mine?pageSize=10");
            Assert.Equal(25, p1.GetProperty("total").GetInt32());
            Assert.Equal(3, p1.GetProperty("totalPages").GetInt32());
            Assert.Equal(10, p1.GetProperty("items").GetArrayLength());
            Assert.Equal(25, p1.GetProperty("items")[0].GetProperty("confidencePercent").GetDecimal()); // newest first
            Assert.All(p1.GetProperty("items").EnumerateArray(), d => Assert.Equal(me.Id, d.GetProperty("userId").GetInt64()));

            var p3 = await me.Client.GetFromJsonAsync<JsonElement>("/api/Diagnoses/mine?page=3&pageSize=10");
            Assert.Equal(5, p3.GetProperty("items").GetArrayLength());
        }

        // ---------- notifications ----------

        [Fact]
        public async Task Notifications_are_limited_counted_in_the_database_and_marked_read_only_for_their_owner()
        {
            var me = await _factory.RegisterAsync();
            var other = await _factory.RegisterAsync();
            var post = (await SeedPostsAsync(me.Id, "notif", 1))[0];
            await _factory.WithDb(async db =>
            {
                for (var i = 1; i <= 60; i++)
                    db.Notifications.Add(new Notification { ReceiverUserId = me.Id, ActorUserId = other.Id, PostId = post, Type = "like", Message = $"n{i}", CreatedAt = T0.AddMinutes(i) });
                for (var i = 0; i < 7; i++)
                    db.Notifications.Add(new Notification { ReceiverUserId = other.Id, ActorUserId = me.Id, PostId = post, Type = "like", Message = "theirs", CreatedAt = T0 });
                await db.SaveChangesAsync();
            });

            var latest = await me.Client.GetFromJsonAsync<JsonElement>("/api/Notifications");
            Assert.Equal(50, latest.GetArrayLength()); // default limit
            Assert.Equal("n60", latest[0].GetProperty("message").GetString()); // newest first

            var five = await me.Client.GetFromJsonAsync<JsonElement>("/api/Notifications?limit=5");
            Assert.Equal(5, five.GetArrayLength());

            var unread = await me.Client.GetFromJsonAsync<JsonElement>("/api/Notifications/unread-count");
            Assert.Equal(60, unread.GetProperty("unreadCount").GetInt32());

            Assert.Equal(HttpStatusCode.OK, (await me.Client.PutAsync("/api/Notifications/read-all", null)).StatusCode);
            Assert.Equal(0, (await me.Client.GetFromJsonAsync<JsonElement>("/api/Notifications/unread-count")).GetProperty("unreadCount").GetInt32());
            Assert.Equal(7, (await other.Client.GetFromJsonAsync<JsonElement>("/api/Notifications/unread-count")).GetProperty("unreadCount").GetInt32());
        }
    }
}
