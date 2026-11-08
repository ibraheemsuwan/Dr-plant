using DoctorPlantTest.BLL.DTOs.User;

namespace DoctorPlantTest.BLL.Services
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllAsync();
        Task<UserDto?> GetByIdAsync(long id);
        Task AddAsync(CreateUserDto dto);
        Task UpdateAsync(long id, UpdateUserDto dto);
        Task DeleteAsync(long id);
        Task<bool> ChangePasswordAsync(long userId, ChangePasswordDto dto);
    }
}
