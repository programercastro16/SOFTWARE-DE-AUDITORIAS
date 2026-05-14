using System.ComponentModel.DataAnnotations;

namespace AuditPlatform.Domain.Entities;

public class AuditLog
{
    [Key]
    public int Id { get; set; }

    public int? UserId { get; set; }

    [Required]
    public string Action { get; set; } = string.Empty;

    [Required]
    public string EntityType { get; set; } = string.Empty;

    public int? EntityId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

