using AuditPlatform.Domain.Entities;
using AuditPlatform.Domain.Services;

namespace AuditPlatform.Domain.Interfaces;

public interface IAuthService
{
    Task<AuthenticationResult> RegisterAdminAsync(string name, string email, string password);
    Task<AuthenticationResult> LoginAsync(string email, string password);
    Task<List<User>> GetAllUsersAsync();
    Task<User> CreateUserAsync(string name, string email, string password, string role);
}
