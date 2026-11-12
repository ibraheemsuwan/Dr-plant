using DoctorPlantTest.BLL.DTOs.Auth;
using DoctorPlantTest.BLL.Exceptions;
using DoctorPlantTest.DAL.Entities;
using DoctorPlantTest.DAL.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace DoctorPlantTest.BLL.Services
{
    public class AuthService : IAuthService
    {
        private readonly IGenericRepository<User> _userRepository;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;

        public AuthService(IGenericRepository<User> userRepository, IConfiguration configuration, ILogger<AuthService> logger)
        {
            _userRepository = userRepository;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
        {
            var email = dto.Email.Trim();
            // MySQL column collation is case-insensitive, so this matches regardless of case
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                _logger.LogWarning("Failed login attempt for email: {Email}", dto.Email);
                return null;
            }

            return new AuthResponseDto
            {
                Token = GenerateToken(user),
                Email = user.Email,
                Name = user.Name,
                Role = user.Role
            };
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
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
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = "user",
                CreatedAt = DateTime.UtcNow
            };
            await _userRepository.AddAsync(user);

            _logger.LogInformation("New user registered: {Email}", dto.Email);

            return new AuthResponseDto
            {
                Token = GenerateToken(user),
                Email = user.Email,
                Name = user.Name,
                Role = user.Role
            };
        }

        private string GenerateToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Role, user.Role)
            };
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(
                    double.TryParse(_configuration["Jwt:ExpiryHours"], out var hours) && hours > 0 ? hours : 24),
                signingCredentials: creds
            );
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
