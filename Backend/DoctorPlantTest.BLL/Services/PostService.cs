using System.Linq.Expressions;
using DoctorPlantTest.BLL.DTOs.Comment;
using DoctorPlantTest.BLL.DTOs.Common;
using DoctorPlantTest.BLL.DTOs.Like;
using DoctorPlantTest.BLL.DTOs.Post;
using DoctorPlantTest.DAL.Entities;
using DoctorPlantTest.DAL.Repositories;
using Microsoft.Extensions.Logging;

namespace DoctorPlantTest.BLL.Services
{
    public class PostService : IPostService
    {
        private readonly IGenericRepository<Post> _postRepository;
        private readonly IGenericRepository<User> _userRepository;
        private readonly IGenericRepository<Comment> _commentRepository;
        private readonly IGenericRepository<Like> _likeRepository;
        private readonly ILogger<PostService> _logger;

        public PostService(IGenericRepository<Post> postRepository, IGenericRepository<User> userRepository,
            IGenericRepository<Comment> commentRepository, IGenericRepository<Like> likeRepository, ILogger<PostService> logger)
        {
            _postRepository = postRepository;
            _userRepository = userRepository;
            _commentRepository = commentRepository;
            _likeRepository = likeRepository;
            _logger = logger;
        }

        public async Task<IEnumerable<PostDto>> GetAllAsync(int limit = 500)
        {
            var posts = await _postRepository.PageAsync(
                null, o => o.OrderByDescending(p => p.CreatedAt).ThenByDescending(p => p.PostId), 0, Math.Clamp(limit, 1, 2000));
            var names = await AuthorNamesAsync(posts.Select(p => p.UserId));
            return posts.Select(p => ToDto(p, names)).ToList();
        }

        public async Task<PagedResult<PostFeedItemDto>> GetFeedAsync(PostFeedQuery query)
        {
            var (page, size) = Paging.Normalize(query.Page, query.PageSize);
            var category = string.IsNullOrWhiteSpace(query.Category) || query.Category.Trim().Equals("All", StringComparison.OrdinalIgnoreCase)
                ? null : query.Category.Trim();
            var search = string.IsNullOrWhiteSpace(query.Search) ? null : query.Search.Trim();
            var userId = query.UserId;
            var excludeUserId = query.ExcludeUserId;

            Expression<Func<Post, bool>> filter = p =>
                (category == null || p.Category == category) &&
                (userId == null || p.UserId == userId) &&
                (excludeUserId == null || p.UserId != excludeUserId) &&
                (search == null || p.Title.Contains(search) || p.Content.Contains(search));

            var total = await _postRepository.CountAsync(filter);
            var posts = await _postRepository.PageAsync(
                filter, o => o.OrderByDescending(p => p.CreatedAt).ThenByDescending(p => p.PostId), (page - 1) * size, size);

            if (posts.Count == 0)
                return PagedResult<PostFeedItemDto>.Create([], page, size, total);

            // Likes and comments only for the posts on this page
            var postIds = posts.Select(p => p.PostId).ToList();
            var comments = (await _commentRepository.FindAsync(c => postIds.Contains(c.PostId)))
                .OrderBy(c => c.CreatedAt).ThenBy(c => c.CommentId).ToList();
            var likes = await _likeRepository.FindAsync(l => postIds.Contains(l.PostId));
            var names = await AuthorNamesAsync(posts.Select(p => p.UserId).Concat(comments.Select(c => c.UserId)));

            string NameOf(long id) => names.TryGetValue(id, out var n) ? n : string.Empty;

            var items = posts.Select(p =>
            {
                var postComments = comments.Where(c => c.PostId == p.PostId).Select(c => new CommentDto
                {
                    CommentId = c.CommentId, PostId = c.PostId, UserId = c.UserId,
                    AuthorName = NameOf(c.UserId), Text = c.Text, CreatedAt = c.CreatedAt,
                }).ToList();
                var postLikes = likes.Where(l => l.PostId == p.PostId).Select(l => new LikeDto
                {
                    LikeId = l.LikeId, PostId = l.PostId, UserId = l.UserId, CreatedAt = l.CreatedAt,
                }).ToList();

                return new PostFeedItemDto
                {
                    PostId = p.PostId, UserId = p.UserId, AuthorName = NameOf(p.UserId), Category = p.Category,
                    Title = p.Title, Content = p.Content, ImageUrl = p.ImageUrl, CreatedAt = p.CreatedAt,
                    Comments = postComments, Likes = postLikes,
                    CommentCount = postComments.Count, LikeCount = postLikes.Count,
                };
            }).ToList();

            return PagedResult<PostFeedItemDto>.Create(items, page, size, total);
        }

        public async Task<PostDto?> GetByIdAsync(long id)
        {
            var p = await _postRepository.GetByIdAsync(id);
            if (p == null) return null;
            return ToDto(p, await AuthorNamesAsync([p.UserId]));
        }

        public async Task AddAsync(CreatePostDto dto)
        {
            var post = new Post
            {
                UserId = dto.UserId,
                Title = dto.Title,
                Content = dto.Content,
                ImageUrl = dto.ImageUrl,
                CreatedAt = DateTime.UtcNow,
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category
            };
            await _postRepository.AddAsync(post);
        }

        public async Task UpdateAsync(long id, UpdatePostDto dto)
        {
            var post = await _postRepository.GetByIdAsync(id);
            if (post == null)
            {
                _logger.LogWarning("UpdateAsync: post {Id} not found", id);
                throw new KeyNotFoundException($"Post with id {id} not found.");
            }

            post.Title = dto.Title;
            post.Content = dto.Content;

            if (!string.IsNullOrWhiteSpace(dto.Category))
                post.Category = dto.Category;

            if (!string.IsNullOrEmpty(dto.ImageUrl))
                post.ImageUrl = dto.ImageUrl!;

            await _postRepository.UpdateAsync(post);
        }

        public async Task DeleteAsync(long id)
        {
            await _postRepository.DeleteAsync(id);
        }

        private async Task<Dictionary<long, string>> AuthorNamesAsync(IEnumerable<long> userIds)
        {
            var ids = userIds.Distinct().ToList();
            var users = await _userRepository.FindAsync(u => ids.Contains(u.UserId));
            return users.ToDictionary(u => u.UserId, u => u.Name);
        }

        private static PostDto ToDto(Post p, IReadOnlyDictionary<long, string> names) => new PostDto
        {
            PostId = p.PostId,
            UserId = p.UserId,
            AuthorName = names.TryGetValue(p.UserId, out var name) ? name : string.Empty,
            Title = p.Title,
            Content = p.Content,
            ImageUrl = p.ImageUrl,
            CreatedAt = p.CreatedAt,
            Category = p.Category
        };
    }
}
