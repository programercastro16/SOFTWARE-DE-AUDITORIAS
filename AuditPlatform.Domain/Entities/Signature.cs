using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditPlatform.Domain.Entities;

public class Signature
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int AuditId { get; set; }

    [Required]
    public int SignedBy { get; set; }

    /// <summary>Nombre legible del firmante (puede diferir del usuario si se captura en canvas).</summary>
    public string SignerName { get; set; } = string.Empty;

    [Required]
    public string ImagePath { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("AuditId")]
    public Audit? Audit { get; set; }
}

