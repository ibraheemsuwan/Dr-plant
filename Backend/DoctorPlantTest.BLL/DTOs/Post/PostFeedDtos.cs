using DoctorPlantTest.BLL.DTOs.Comment;
using DoctorPlantTest.BLL.DTOs.Like;

namespace DoctorPlantTest.BLL.DTOs.Post
{
    /// <summary>Query string of GET /api/Posts/feed. Everything is optional.</summary>
    public class PostFeedQuery
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;

        /// <summary>Exact category; empty or "All" means every category.</summary>
        public string? Category { get; set; }

        /// <summary>Only posts written by this user ("my posts").</summary>
        public long? UserId { get; set; }

        /// <summary>Everything except this user's posts ("community").</summary>
        public long? ExcludeUserId { get; set; }

        /// <summary>Words to look for in the title or content.</summary>
        public string? Search { get; set; }
    }

    /// <summary>A post together with its likes and comments, so a page needs one request instead of three tables.</summary>
    public class PostFeedItemDto : PostDto
    {
        public List<CommentDto> Comments { get; set; } = [];
        public List<LikeDto> Likes { get; set; } = [];
        public int LikeCount { get; set; }
        public int CommentCount { get; set; }
    }
}
