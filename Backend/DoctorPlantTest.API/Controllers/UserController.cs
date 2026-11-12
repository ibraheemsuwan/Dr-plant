using DoctorPlantTest.API.Authorization;
using DoctorPlantTest.BLL.DTOs.User;
using DoctorPlantTest.BLL.Exceptions;
using DoctorPlantTest.BLL.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoctorPlantTest.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        [Authorize(Policy = Policies.Admin)]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userService.GetAllAsync();
            return Ok(users);
        }

        /// <summary>
        /// Self or admin: full profile. Anyone else signed in: public profile only (no email),
        /// used to show post/comment author names.
        /// </summary>
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetById(long id)
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null) return NotFound(new { message = "User not found." });

            if (User.CanModify(id))
                return Ok(user);

            return Ok(new
            {
                user.UserId,
                user.FirstName,
                user.LastName,
                user.Name
            });
        }

        [HttpPost]
        [Authorize(Policy = Policies.Admin)]
        public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                await _userService.AddAsync(dto);
            }
            catch (EmailAlreadyExistsException)
            {
                return Conflict(new { message = "This email is already registered." });
            }

            return StatusCode(201, new { message = "User created successfully." });
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateUserDto dto)
        {
            if (!User.CanModify(id)) return Forbid();
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                await _userService.UpdateAsync(id, dto);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "User not found." });
            }
            catch (EmailAlreadyExistsException)
            {
                return Conflict(new { message = "This email is already registered." });
            }

            return Ok(new { message = "User updated successfully." });
        }

        [HttpPut("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized(new { message = "Invalid token." });

            var result = await _userService.ChangePasswordAsync(userId.Value, dto);

            if (!result)
                return BadRequest(new { message = "Old password is incorrect" });

            return Ok(new { message = "Password changed successfully" });
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(long id)
        {
            if (!User.CanModify(id)) return Forbid();

            await _userService.DeleteAsync(id);
            return Ok(new { message = "User deleted successfully." });
        }
    }
}
