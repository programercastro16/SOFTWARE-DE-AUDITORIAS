using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditPlatform.Domain.Entities;

public class AuditItem
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int AuditId { get; set; }

    [Required]
    public string Code { get; set; } = string.Empty;

    [Required]
    public string Label { get; set; } = string.Empty;

    [Required]
    public double Weight { get; set; }

    /// <summary>Puntos opción A (máximo) — formato acta A / AR / I.</summary>
    public double PointsA { get; set; }

    /// <summary>Puntos opción AR (aceptable reducido).</summary>
    public double PointsAR { get; set; }

    /// <summary>Puntos opción I (inaceptable / cero).</summary>
    public double PointsI { get; set; }

    public double Score { get; set; } = -1;
    public string? Category { get; set; }
    public string? Observations { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("AuditId")]
    public Audit? Audit { get; set; }
}

