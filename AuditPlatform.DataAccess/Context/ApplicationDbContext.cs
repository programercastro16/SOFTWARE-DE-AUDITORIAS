using AuditPlatform.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AuditPlatform.DataAccess.Context;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Audit> Audits => Set<Audit>();
    public DbSet<AuditItem> AuditItems => Set<AuditItem>();
    public DbSet<Evidence> Evidences => Set<Evidence>();
    public DbSet<Signature> Signatures => Set<Signature>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<AuditAssignment> AuditAssignments => Set<AuditAssignment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // No usar HasDefaultValue en Role: Role.ADMIN = 0 y EF/SQLite pueden omitir el valor
        // en el INSERT y aplicar un DEFAULT de CLIENTE por error.

        modelBuilder.Entity<Audit>()
            .Property(a => a.Status)
            .HasDefaultValue("BORRADOR");

        modelBuilder.Entity<AuditItem>()
            .Property(i => i.Score)
            .HasDefaultValue(0.0);

        modelBuilder.Entity<AuditItem>()
            .Property(i => i.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        modelBuilder.Entity<AuditItem>()
            .Property(i => i.UpdatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        modelBuilder.Entity<Evidence>()
            .Property(e => e.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        modelBuilder.Entity<Signature>()
            .Property(s => s.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        modelBuilder.Entity<AuditLog>()
            .Property(l => l.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        modelBuilder.Entity<AuditAssignment>()
            .Property(a => a.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        base.OnModelCreating(modelBuilder);
    }
}

