using DoctorPlantTest.BLL.DTOs.Auth;

namespace DoctorPlantTest.BLL.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> LoginAsync(LoginDto dto);
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    }
}
