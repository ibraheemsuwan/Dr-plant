using DoctorPlantTest.BLL.DTOs.Post;

namespace DoctorPlantTest.BLL.Services
{
    public interface IPostService
    {
        Task<IEnumerable<PostDto>> GetAllAsync();
        Task<PostDto?> GetByIdAsync(long id);
        Task AddAsync(CreatePostDto dto);
        Task UpdateAsync(long id, UpdatePostDto dto);
        Task DeleteAsync(long id);
    }
}
