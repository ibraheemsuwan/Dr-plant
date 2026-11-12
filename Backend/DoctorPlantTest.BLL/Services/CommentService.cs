using System;
using System.Collections.Generic;
using System.Text;
using DoctorPlantTest.BLL.DTOs.Comment;
using DoctorPlantTest.DAL.Entities;
using DoctorPlantTest.DAL.Repositories;

namespace DoctorPlantTest.BLL.Services
{
    public class CommentService : ICommentService
    {
        private readonly IGenericRepository<Comment> _commentRepository;
        private readonly IGenericRepository<Post> _postRepository;
        private readonly IGenericRepository<User> _userRepository;
        private readonly INotificationService _notificationService;

        public CommentService(
            IGenericRepository<Comment> commentRepository,
            IGenericRepository<Post> postRepository,
            IGenericRepository<User> userRepository,
            INotificationService notificationService)
        {
            _commentRepository = commentRepository;
            _postRepository = postRepository;
            _userRepository = userRepository;
            _notificationService = notificationService;
        }

        public async Task<IEnumerable<CommentDto>> GetAllAsync(long? postId = null, int limit = 500)
        {
            System.Linq.Expressions.Expression<Func<Comment, bool>>? filter = postId == null ? null : c => c.PostId == postId;
            var comments = await _commentRepository.PageAsync(
                filter, o => o.OrderByDescending(c => c.CreatedAt).ThenByDescending(c => c.CommentId), 0, Math.Clamp(limit, 1, 2000));
            var ids = comments.Select(c => c.UserId).Distinct().ToList();
            var names = (await _userRepository.FindAsync(u => ids.Contains(u.UserId)))
                .ToDictionary(u => u.UserId, u => u.Name);

            return comments.OrderBy(c => c.CreatedAt).ThenBy(c => c.CommentId).Select(c => new CommentDto
            {
                CommentId = c.CommentId,
                PostId = c.PostId,
                UserId = c.UserId,
                AuthorName = names.TryGetValue(c.UserId, out var name) ? name : string.Empty,
                Text = c.Text,
                CreatedAt = c.CreatedAt
            }).ToList();
        }

        public async Task<CommentDto?> GetByIdAsync(long id)
        {
            var c = await _commentRepository.GetByIdAsync(id);
            if (c == null) return null;
            return new CommentDto
            {
                CommentId = c.CommentId,
                PostId = c.PostId,
                UserId = c.UserId,
                Text = c.Text,
                CreatedAt = c.CreatedAt
            };
        }

        public async Task AddAsync(CreateCommentDto dto)
        {
            var comment = new Comment
            {
                PostId = dto.PostId,
                UserId = dto.UserId,
                Text = dto.Text,
                CreatedAt = DateTime.UtcNow
            };

            await _commentRepository.AddAsync(comment);

            var post = await _postRepository.GetByIdAsync(dto.PostId);

            if (post != null && post.UserId != dto.UserId)
            {
                await _notificationService.CreateNotificationAsync(
                    post.UserId,
                    dto.UserId,
                    dto.PostId,
                    "comment",
                    "Someone commented on your post"
                );
            }
        }

        public async Task DeleteAsync(long id)
        {
            await _commentRepository.DeleteAsync(id);
        }
    }
}