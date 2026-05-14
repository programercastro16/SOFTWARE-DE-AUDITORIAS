using AuditPlatform.API.DTOs;
using AuditPlatform.DataAccess.Context;
using AuditPlatform.Domain.Entities;
using AuditPlatform.Domain.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AuditPlatform.API.Services;

public class AuthService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly PasswordHasher<User> _passwordHasher;

    public AuthService(ApplicationDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _passwordHasher = new PasswordHasher<User>();
    }

    public async Task<AuthenticationResult> RegisterAdminAsync(RegisterRequest request)
    {
        var email = NormalizeEmail(request.Email);
        if (string.IsNullOrEmpty(email))
        {
            return new AuthenticationResult(false, string.Empty, DateTime.MinValue, ErrorMessage: "El correo es obligatorio.");
        }

        if (await _dbContext.Users.AnyAsync(u => u.Email == email))
        {
            return new AuthenticationResult(false, string.Empty, DateTime.MinValue, ErrorMessage: "El correo ya está registrado.");
        }

        var user = new User
        {
            Name = request.Name,
            Email = email,
            Role = Role.ADMIN,
            CreatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return new AuthenticationResult(true, token, DateTime.UtcNow.AddHours(4), user.Id, user.Name, user.Email, user.Role.ToString());
    }

    public async Task<AuthenticationResult> LoginAsync(LoginRequest request)
    {
        var email = NormalizeEmail(request.Email);
        if (string.IsNullOrEmpty(email))
        {
            return new AuthenticationResult(false, string.Empty, DateTime.MinValue, ErrorMessage: "Usuario o contraseña incorrectos.");
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            return new AuthenticationResult(false, string.Empty, DateTime.MinValue, ErrorMessage: "Usuario o contraseña incorrectos.");
        }

        var verification = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verification == PasswordVerificationResult.Failed)
        {
            return new AuthenticationResult(false, string.Empty, DateTime.MinValue, ErrorMessage: "Usuario o contraseña incorrectos.");
        }

        user.LastLogin = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return new AuthenticationResult(true, token, DateTime.UtcNow.AddHours(4), user.Id, user.Name, user.Email, user.Role.ToString());
    }

    public async Task<List<User>> GetAllUsersAsync()
    {
        return await _dbContext.Users.ToListAsync();
    }

    public async Task<User> CreateUserAsync(CreateUserRequest request)
    {
        var email = NormalizeEmail(request.Email);
        if (string.IsNullOrEmpty(email))
        {
            throw new InvalidOperationException("El correo es obligatorio.");
        }

        if (await _dbContext.Users.AnyAsync(u => u.Email == email))
        {
            throw new InvalidOperationException("El correo ya está registrado.");
        }

        var userRole = Enum.TryParse<Role>(request.Role, true, out var parsedRole) ? parsedRole : Role.CLIENTE;
        var user = new User
        {
            Name = request.Name,
            Email = email,
            Role = userRole,
            CreatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        return user;
    }

    private static string NormalizeEmail(string value) => (value ?? string.Empty).Trim().ToLowerInvariant();

    private string GenerateJwtToken(User user)
    {
        var secret = _configuration.GetValue<string>("Jwt:Secret") ?? "default_super_secret_please_change";
        var issuer = _configuration.GetValue<string>("Jwt:Issuer") ?? "AuditPlatform";
        var audience = _configuration.GetValue<string>("Jwt:Audience") ?? "AuditPlatformUsers";
        var expires = DateTime.UtcNow.AddHours(4);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: expires,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
