using AuditPlatform.DataAccess.Context;
using AuditPlatform.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace AuditPlatform.API;

/// <summary>
/// Solo desarrollo: crea usuarios definidos en appsettings (DevSeed:Users) si el correo no existe aún.
/// </summary>
internal static class DevDataSeeder
{
    public static void Apply(ApplicationDbContext db, IConfiguration config, IWebHostEnvironment env)
    {
        if (!env.IsDevelopment()) return;

        var section = config.GetSection("DevSeed");
        if (!section.GetValue<bool>("Enabled")) return;

        RemoveUsersByEmail(db, section.GetSection("RemoveEmails").Get<string[]>() ?? []);

        var rows = section.GetSection("Users").Get<List<DevSeedUserRow>>() ?? [];
        if (rows.Count == 0)
        {
            var legacyEmail = section["AdminEmail"];
            var legacyPassword = section["AdminPassword"];
            if (!string.IsNullOrWhiteSpace(legacyEmail) && !string.IsNullOrWhiteSpace(legacyPassword))
            {
                rows.Add(new DevSeedUserRow
                {
                    Name = section["AdminName"] ?? "Administrador",
                    Email = legacyEmail,
                    Password = legacyPassword,
                    Role = "ADMIN"
                });
            }
        }

        if (rows.Count == 0) return;

        var existing = new HashSet<string>(
            db.Users.Select(u => NormalizeEmail(u.Email)),
            StringComparer.Ordinal);

        var hasher = new PasswordHasher<User>();
        var syncPasswords = section.GetValue<bool>("SyncPasswords");
        var changed = false;

        foreach (var row in rows)
        {
            var email = NormalizeEmail(row.Email ?? string.Empty);
            if (string.IsNullOrEmpty(email)) continue;

            var password = row.Password ?? string.Empty;
            if (string.IsNullOrEmpty(password)) continue;

            var name = string.IsNullOrWhiteSpace(row.Name) ? email : row.Name.Trim();
            if (!Enum.TryParse<Role>(row.Role ?? string.Empty, true, out var role))
                role = Role.CLIENTE;

            if (existing.Contains(email))
            {
                if (!syncPasswords) continue;

                var user = db.Users.First(u => u.Email == email);
                user.Name = name;
                user.Role = role;
                user.PasswordHash = hasher.HashPassword(user, password);
                changed = true;
                continue;
            }

            var newUser = new User
            {
                Name = name,
                Email = email,
                Role = role,
                CreatedAt = DateTime.UtcNow
            };
            newUser.PasswordHash = hasher.HashPassword(newUser, password);
            db.Users.Add(newUser);
            existing.Add(email);
            changed = true;
        }

        if (changed)
            db.SaveChanges();
    }

    private static void RemoveUsersByEmail(ApplicationDbContext db, IEnumerable<string> emails)
    {
        var removed = false;
        foreach (var raw in emails)
        {
            var email = NormalizeEmail(raw);
            if (string.IsNullOrEmpty(email)) continue;

            var user = db.Users.FirstOrDefault(u => u.Email == email);
            if (user == null) continue;

            var userId = user.Id;
            foreach (var audit in db.Audits.Where(a => a.AssignedToUserId == userId))
                audit.AssignedToUserId = null;

            db.AuditAssignments.RemoveRange(db.AuditAssignments.Where(a => a.UserId == userId));
            db.Users.Remove(user);
            removed = true;
        }

        if (removed)
            db.SaveChanges();
    }

    private static string NormalizeEmail(string value) => (value ?? string.Empty).Trim().ToLowerInvariant();

    private sealed class DevSeedUserRow
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? Role { get; set; }
    }
}
