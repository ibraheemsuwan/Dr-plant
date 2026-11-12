using DoctorPlantTest.BLL.DTOs.Common;
using DoctorPlantTest.BLL.DTOs.Post;

namespace DoctorPlantTest.BLL.Services
{
    public interface IPostService
    {
        /// <summary>Newest posts, capped by <paramref name="limit"/>. Prefer <see cref="GetFeedAsync"/> for pages.</summary>
        Task<IEnumerable<PostDto>> GetAllAsync(int limit = 500);

        /// <summary>One page of posts, filtered and sorted newest first, each with its likes and comments.</summary>
        Task<PagedResult<PostFeedItemDto>> GetFeedAsync(PostFeedQuery query);
        Task<PostDto?> GetByIdAsync(long id);
        Task AddAsync(CreatePostDto dto);
        Task UpdateAsync(long id, UpdatePostDto dto);
        Task DeleteAsync(long id);
    }
}
