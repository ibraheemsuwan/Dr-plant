using DoctorPlantTest.BLL.DTOs.Post;
using DoctorPlantTest.DAL.Entities;
using DoctorPlantTest.DAL.Repositories;
using Microsoft.Extensions.Logging;

namespace DoctorPlantTest.BLL.Services
{
    public class PostService : IPostService
    {
        private readonly IGenericRepository<Post> _postRepository;
        private readonly ILogger<PostService> _logger;

        public PostService(IGenericRepository<Post> postRepository, ILogger<PostService> logger)
        {
            _postRepository = postRepository;
            _logger = logger;
        }

        public async Task<IEnumerable<PostDto>> GetAllAsync()
        {
            var posts = await _postRepository.GetAllAsync();
            return posts.Select(ToDto);
        }

        public async Task<PostDto?> GetByIdAsync(long id)
        {
            var p = await _postRepository.GetByIdAsync(id);
            return p == null ? null : ToDto(p);
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

        private static PostDto ToDto(Post p) => new PostDto
        {
            PostId = p.PostId,
            UserId = p.UserId,
            Title = p.Title,
            Content = p.Content,
            ImageUrl = p.ImageUrl,
            CreatedAt = p.CreatedAt,
            Category = p.Category
        };
    }
}
