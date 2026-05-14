using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditPlatform.Domain.Entities;

public class AuditAssignment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int AuditId { get; set; }

    [Required]
    public int UserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("AuditId")]
    public Audit? Audit { get; set; }
}

