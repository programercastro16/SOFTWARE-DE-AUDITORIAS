using System.Text.Json;
using AuditPlatform.DataAccess.Context;
using AuditPlatform.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace AuditPlatform.API;

/// <summary>
/// Desarrollo: importa usuarios desde un JSON en la carpeta del proyecto API (mismos datos que envías en Postman).
/// </summary>
internal static class PostmanUsersImporter
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true
    };

    public static void Apply(ApplicationDbContext db, IConfiguration config, IWebHostEnvironment env)
    {
        if (!env.IsDevelopment()) return;

        var section = config.GetSection("UserImport");
        if (!section.GetValue<bool>("Enabled")) return;

        var fileName = section["FileName"] ?? "postman-users.json";
        var path = Path.Combine(env.ContentRootPath, fileName);
        if (!File.Exists(path)) return;

        List<ImportUserRow>? rows;
        try
        {
            var json = File.ReadAllText(path);
            rows = JsonSerializer.Deserialize<List<ImportUserRow>>(json, JsonOptions);
        }
        catch
        {
            return;
        }

        if (rows == null || rows.Count == 0) return;

        var existing = new HashSet<string>(
            db.Users.Select(u => (u.Email ?? string.Empty).Trim().ToLowerInvariant()),
            StringComparer.Ordinal);

        var hasher = new PasswordHasher<User>();
        var added = 0;

        foreach (var row in rows)
        {
            var email = (row.Email ?? string.Empty).Trim().ToLowerInvariant();
            if (string.IsNullOrEmpty(email)) continue;
            var password = row.Password ?? string.Empty;
            if (string.IsNullOrEmpty(password)) continue;
            var name = string.IsNullOrWhiteSpace(row.Name) ? email : row.Name.Trim();
            if (!Enum.TryParse<Role>(row.Role ?? "", true, out var role))
                role = Role.CLIENTE;

            if (existing.Contains(email))
                continue;

            var user = new User
            {
                Name = name,
                Email = email,
                Role = role,
                CreatedAt = DateTime.UtcNow
            };
            user.PasswordHash = hasher.HashPassword(user, password);
            db.Users.Add(user);
            existing.Add(email);
            added++;
        }

        if (added > 0)
            db.SaveChanges();
    }

    private sealed class ImportUserRow
    {
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? Name { get; set; }
        public string? Role { get; set; }
    }
}
