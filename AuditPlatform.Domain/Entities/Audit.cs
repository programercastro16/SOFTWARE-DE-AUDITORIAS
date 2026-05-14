using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditPlatform.Domain.Entities;

public class Audit
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string Title { get; set; } = string.Empty;

    /// <summary>Nombre o referencia interna de la visita.</summary>
    public string? InternalName { get; set; }

    /// <summary>Sede o punto auditado.</summary>
    public string Sede { get; set; } = string.Empty;

    public string? Description { get; set; }

    /// <summary>Comentarios generales del auditor al crear o revisar.</summary>
    public string? Comments { get; set; }

    public string Status { get; set; } = "BORRADOR";
    public DateTime? ScheduledVisitDate { get; set; }
    public int CreatedBy { get; set; }
    public int? AssignedToUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("CreatedBy")]
    public User? CreatedByUser { get; set; }

    [ForeignKey("AssignedToUserId")]
    public User? AssignedToUser { get; set; }

    public List<AuditItem> Items { get; set; } = new();
    public List<Evidence> Evidences { get; set; } = new();
}

