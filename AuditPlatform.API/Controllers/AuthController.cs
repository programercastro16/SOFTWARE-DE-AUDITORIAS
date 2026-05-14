using AuditPlatform.API.DTOs;
using AuditPlatform.API.Mappings;
using AuditPlatform.API.Services;
using AuditPlatform.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuditPlatform.API.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register-admin")]
    [AllowAnonymous]
    public async Task<IActionResult> RegisterAdmin([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAdminAsync(request);
        if (!result.Success)
        {
            return BadRequest(new { error = result.ErrorMessage });
        }

        return Created(string.Empty, new AuthResponse(
            UserId: result.UserId,
            Name: result.Name,
            Email: result.Email,
            Role: result.Role,
            Token: result.Token,
            ExpiresAt: result.ExpiresAt));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        if (!result.Success)
        {
            return Unauthorized(new { error = result.ErrorMessage });
        }

        return Ok(new AuthResponse(
            UserId: result.UserId,
            Name: result.Name,
            Email: result.Email,
            Role: result.Role,
            Token: result.Token,
            ExpiresAt: result.ExpiresAt));
    }

    [HttpGet("auditors")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetAuditors()
    {
        var users = await _authService.GetAllUsersAsync();
        var auditors = users.Where(u => u.Role == Role.AUDITOR).Select(u => u.ToDto()).ToList();
        return Ok(auditors);
    }

    [HttpGet("users")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _authService.GetAllUsersAsync();
        return Ok(users.Select(u => u.ToDto()).ToList());
    }

    [HttpPost("users")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        try
        {
            var user = await _authService.CreateUserAsync(request);
            return Created(string.Empty, new UserDto(user.Id, user.Name, user.Email, user.Role.ToString()));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

