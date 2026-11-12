using DoctorPlantTest.BLL.DTOs.Auth;

namespace DoctorPlantTest.BLL.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> LoginAsync(LoginDto dto);
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);

        /// <summary>Emails a reset link if the account exists. Never reveals whether it does.</summary>
        Task RequestPasswordResetAsync(string email);

        /// <returns>false if the token is invalid, expired or already used.</returns>
        Task<bool> ResetPasswordAsync(string token, string newPassword);
    }
}
