namespace AuditPlatform.Domain.Services;

public record AuthenticationResult(bool Success, string Token, DateTime ExpiresAt, int UserId = 0, string Name = "", string Email = "", string Role = "", string ErrorMessage = "");
