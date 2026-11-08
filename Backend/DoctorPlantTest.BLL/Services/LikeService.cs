using System;
using System.Collections.Generic;
using System.Text;
using DoctorPlantTest.BLL.DTOs.Like;
using DoctorPlantTest.DAL.Entities;
using DoctorPlantTest.DAL.Repositories;

namespace DoctorPlantTest.BLL.Services
{
    public class LikeService : ILikeService
    {
        private readonly IGenericRepository<Like> _likeRepository;
        private readonly IGenericRepository<Post> _postRepository;
        private readonly INotificationService _notificationService;

        public LikeService(
            IGenericRepository<Like> likeRepository,
            IGenericRepository<Post> postRepository,
            INotificationService notificationService)
        {
            _likeRepository = likeRepository;
            _postRepository = postRepository;
            _notificationService = notificationService;
        }

        public async Task<IEnumerable<LikeDto>> GetAllAsync()
        {
            var likes = await _likeRepository.GetAllAsync();
            return likes.Select(l => new LikeDto
            {
                LikeId = l.LikeId,
                PostId = l.PostId,
                UserId = l.UserId,
                CreatedAt = l.CreatedAt
            });
        }

        public async Task AddAsync(CreateLikeDto dto)
        {
            var like = new Like
            {
                PostId = dto.PostId,
                UserId = dto.UserId,
                CreatedAt = DateTime.UtcNow
            };

            await _likeRepository.AddAsync(like);

            var post = await _postRepository.GetByIdAsync(dto.PostId);

            if (post != null && post.UserId != dto.UserId)
            {
                await _notificationService.CreateNotificationAsync(
                    post.UserId,
                    dto.UserId,
                    dto.PostId,
                    "like",
                    "Someone liked your post"
                );
            }
        }

        public async Task DeleteAsync(long id)
        {
            await _likeRepository.DeleteAsync(id);
        }
    }
}
