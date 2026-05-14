using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditPlatform.Domain.Entities;

public class Evidence
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int AuditId { get; set; }

    [Required]
    public string FilePath { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("AuditId")]
    public Audit? Audit { get; set; }
}

