using DoctorPlantTest.BLL.DTOs.Auth;
using DoctorPlantTest.BLL.Exceptions;
using DoctorPlantTest.BLL.Services.Email;
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
        private readonly IEmailSender _email;

        private static readonly TimeSpan ResetLinkLifetime = TimeSpan.FromHours(1);

        public AuthService(IGenericRepository<User> userRepository, IConfiguration configuration, ILogger<AuthService> logger, IEmailSender email)
        {
            _userRepository = userRepository;
            _configuration = configuration;
            _logger = logger;
            _email = email;
        }

        public async Task RequestPasswordResetAsync(string email)
        {
            var trimmed = email.Trim();
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Email == trimmed);
            if (user == null)
            {
                _logger.LogInformation("Password reset requested for an email with no account");
                return;
            }

            var token = PasswordResetTokens.Create(_configuration["Jwt:Key"]!, user.UserId, user.PasswordHash, DateTimeOffset.UtcNow.Add(ResetLinkLifetime));
            var link = $"{FrontendBaseUrl()}/reset-password?token={Uri.EscapeDataString(token)}";

            // Development only: print the link instead of needing a mail server
            if (bool.TryParse(_configuration["Email:LogMessagesInsteadOfSending"], out var logOnly) && logOnly)
                _logger.LogInformation("DEV password reset link for {Email}: {Link}", trimmed, link);

            var subject = "Reset your Dr Plant password | إعادة تعيين كلمة مرور Dr Plant";
            var text =
                "مرحبًا،\nطلبت إعادة تعيين كلمة مرور حسابك في Dr Plant. افتح الرابط التالي لاختيار كلمة مرور جديدة (صالح لمدة ساعة):\n" +
                $"{link}\nإذا لم تطلب ذلك فتجاهل هذه الرسالة، ولن يتغير شيء.\n\n" +
                "Hello,\nYou asked to reset your Dr Plant password. Open this link to choose a new one (valid for 1 hour):\n" +
                $"{link}\nIf you did not ask for this, ignore this email and nothing will change.";
            var safeLink = System.Net.WebUtility.HtmlEncode(link);
            var html =
                "<div dir=\"rtl\" style=\"font-family:Arial,sans-serif\"><p>مرحبًا،</p>" +
                "<p>طلبت إعادة تعيين كلمة مرور حسابك في Dr Plant. اضغط الزر لاختيار كلمة مرور جديدة (صالح لمدة ساعة).</p>" +
                $"<p><a href=\"{safeLink}\" style=\"background:#2e7d32;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none\">إعادة تعيين كلمة المرور</a></p>" +
                "<p>إذا لم تطلب ذلك فتجاهل هذه الرسالة، ولن يتغير شيء.</p></div><hr>" +
                "<div dir=\"ltr\" style=\"font-family:Arial,sans-serif\"><p>Hello,</p>" +
                "<p>You asked to reset your Dr Plant password. Click the button to choose a new one (valid for 1 hour).</p>" +
                $"<p><a href=\"{safeLink}\" style=\"background:#2e7d32;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none\">Reset password</a></p>" +
                "<p>If you did not ask for this, ignore this email and nothing will change.</p></div>";

            // Send in the background so the response time does not reveal whether the account exists
            _ = Task.Run(async () =>
            {
                try { await _email.SendAsync(trimmed, subject, text, html); }
                catch (Exception ex) { _logger.LogError(ex, "Failed to send password reset email"); }
            });
        }

        public async Task<bool> ResetPasswordAsync(string token, string newPassword)
        {
            if (!PasswordResetTokens.TryRead(_configuration["Jwt:Key"]!, token, DateTimeOffset.UtcNow, out var userId, out var fingerprint))
                return false;

            var user = await _userRepository.GetByIdAsync(userId);
            // The fingerprint ties the link to the password it was issued for, so it works only once
            if (user == null || !PasswordResetTokens.FingerprintMatches(fingerprint, user.PasswordHash))
                return false;

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _userRepository.UpdateAsync(user);
            _logger.LogInformation("Password reset completed for user {UserId}", userId);
            return true;
        }

        private string FrontendBaseUrl()
        {
            var url = _configuration["Frontend:BaseUrl"];
            if (string.IsNullOrWhiteSpace(url)) url = _configuration["AllowedOrigins:0"];
            if (string.IsNullOrWhiteSpace(url)) url = "http://localhost:5173";
            return url.TrimEnd('/');
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
