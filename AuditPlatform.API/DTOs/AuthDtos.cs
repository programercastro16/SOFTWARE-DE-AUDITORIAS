namespace AuditPlatform.API.DTOs;

public record RegisterRequest(string Name, string Email, string Password);
public record LoginRequest(string Email, string Password);
public record CreateUserRequest(string Name, string Email, string Password, string Role);

public record UserDto(int Id, string Name, string Email, string Role);

public record AuthResponse(int UserId, string Name, string Email, string Role, string Token, DateTime ExpiresAt, string Message = "")
{
    public bool Success => !string.IsNullOrWhiteSpace(Token);
}

