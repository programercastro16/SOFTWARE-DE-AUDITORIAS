using AuditPlatform.DataAccess.Context;
using AuditPlatform.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace AuditPlatform.API;

/// <summary>
/// Solo desarrollo: si la base está vacía, crea un administrador inicial desde appsettings.
/// Si ya existen usuarios (p. ej. creados con Postman), no modifica nada: esos son los que usa el login.
/// </summary>
internal static class DevDataSeeder
{
    public static void Apply(ApplicationDbContext db, IConfiguration config, IWebHostEnvironment env)
    {
        if (!env.IsDevelopment()) return;

        var section = config.GetSection("DevSeed");
        if (!section.GetValue<bool>("Enabled")) return;

        if (db.Users.Any())
            return;

        var email = NormalizeEmail(section["AdminEmail"] ?? "admin@local.dev");
        if (string.IsNullOrEmpty(email)) return;

        var password = section["AdminPassword"];
        if (string.IsNullOrEmpty(password)) return;

        var name = section["AdminName"] ?? "Administrador";
        var hasher = new PasswordHasher<User>();
        var user = new User
        {
            Name = name,
            Email = email,
            Role = Role.ADMIN,
            CreatedAt = DateTime.UtcNow
        };
        user.PasswordHash = hasher.HashPassword(user, password);
        db.Users.Add(user);
        db.SaveChanges();
    }

    private static string NormalizeEmail(string value) => (value ?? string.Empty).Trim().ToLowerInvariant();
}
