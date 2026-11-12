using DoctorPlantTest.API.Authorization;
using DoctorPlantTest.BLL.DTOs.Auth;
using DoctorPlantTest.BLL.Exceptions;
using DoctorPlantTest.BLL.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace DoctorPlantTest.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableRateLimiting(RateLimitPolicies.Auth)]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);
            if (result == null) return Unauthorized("Invalid email or password");
            return Ok(result);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            try
            {
                var result = await _authService.RegisterAsync(dto);
                return Ok(result);
            }
            catch (EmailAlreadyExistsException)
            {
                return Conflict(new { message = "This email is already registered." });
            }
        }
    }
}
