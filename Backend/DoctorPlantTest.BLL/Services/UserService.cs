using DoctorPlantTest.BLL.DTOs.User;
using DoctorPlantTest.BLL.Exceptions;
using DoctorPlantTest.DAL.Entities;
using DoctorPlantTest.DAL.Repositories;
using Microsoft.Extensions.Logging;

namespace DoctorPlantTest.BLL.Services
{
    public class UserService : IUserService
    {
        private readonly IGenericRepository<User> _userRepository;
        private readonly ILogger<UserService> _logger;

        public UserService(IGenericRepository<User> userRepository, ILogger<UserService> logger)
        {
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<IEnumerable<UserDto>> GetAllAsync()
        {
            var users = await _userRepository.GetAllAsync();
            return users.Select(ToDto);
        }

        public async Task<UserDto?> GetByIdAsync(long id)
        {
            var u = await _userRepository.GetByIdAsync(id);
            return u == null ? null : ToDto(u);
        }

        public async Task AddAsync(CreateUserDto dto)
        {
            var email = dto.Email.Trim();
            if (await _userRepository.AnyAsync(u => u.Email == email))
                throw new EmailAlreadyExistsException(email);

            var user = new User
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Name = dto.Name ?? $"{dto.FirstName} {dto.LastName}",
                Email = email,
                Role = "user",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                CreatedAt = DateTime.UtcNow
            };
            await _userRepository.AddAsync(user);
            _logger.LogInformation("User created with email: {Email}", dto.Email);
        }

        public async Task UpdateAsync(long id, UpdateUserDto dto)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                _logger.LogWarning("UpdateAsync: user {Id} not found", id);
                throw new KeyNotFoundException($"User with id {id} not found.");
            }

            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            var email = dto.Email.Trim();
            if (await _userRepository.AnyAsync(u => u.Email == email && u.UserId != id))
                throw new EmailAlreadyExistsException(email);

            user.Name = $"{dto.FirstName} {dto.LastName}".Trim();
            user.Email = email;
            await _userRepository.UpdateAsync(user);
        }

        public async Task DeleteAsync(long id)
        {
            await _userRepository.DeleteAsync(id);
        }

        public async Task<bool> ChangePasswordAsync(long userId, ChangePasswordDto dto)
        {
            var user = await _userRepository.GetByIdAsync(userId);

            if (user == null)
                throw new KeyNotFoundException("User not found");

            var isOldPasswordCorrect = BCrypt.Net.BCrypt.Verify(dto.OldPassword, user.PasswordHash);

            if (!isOldPasswordCorrect)
                return false;

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

            await _userRepository.UpdateAsync(user);

            _logger.LogInformation("Password changed for user {UserId}", userId);

            return true;
        }

        private static UserDto ToDto(User u) => new UserDto
        {
            UserId = u.UserId,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Name = u.Name,
            Email = u.Email,
            CreatedAt = u.CreatedAt
        };
    }
}
