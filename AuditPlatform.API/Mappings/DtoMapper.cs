using AuditPlatform.API.DTOs;
using AuditPlatform.Domain.Entities;

namespace AuditPlatform.API.Mappings;

public static class DtoMapper
{
    public static UserDto ToDto(this User user)
        => new(user.Id, user.Name, user.Email, user.Role.ToString());

    public static AuditItemDto ToDto(this AuditItem item)
    {
        var (pa, par, pi) = AuditItemScoring.GetTriple(item);
        var code = AuditActaHelper.ResolveGradeCode(item);
        return new(item.Id, item.Code, item.Label, item.Weight, item.Score, item.Category, item.Observations,
            pa, par, pi, code, AuditActaHelper.GetGradeLabel(code));
    }

    public static SignatureDto ToDto(this Signature sig)
        => new(sig.Id, sig.AuditId, sig.SignedBy, sig.SignerName, sig.ImagePath, sig.CreatedAt);

    public static EvidenceDto ToDto(this Evidence evidence)
        => new(evidence.Id, evidence.AuditId, evidence.FilePath, evidence.CreatedAt);

    public static AuditDto ToDto(this Audit audit)
    {
        var summary = AuditActaHelper.ComputeSummary(audit.Items);
        var signatures = audit.Signatures?.Select(s => s.ToDto()).ToList() ?? [];
        return new(
            audit.Id,
            audit.Title,
            audit.InternalName,
            audit.Sede ?? string.Empty,
            audit.Description,
            audit.Comments,
            audit.Status,
            audit.CreatedAt,
            audit.UpdatedAt,
            audit.CreatedBy,
            audit.CreatedByUser?.Name ?? string.Empty,
            audit.AssignedToUserId,
            audit.AssignedToUser?.Name,
            audit.ScheduledVisitDate?.ToString("o"),
            audit.Items.Select(i => i.ToDto()).ToList(),
            audit.Evidences.Select(e => e.ToDto()).ToList(),
            signatures,
            AuditActaHelper.IsActaComplete(audit.Items),
            summary.CompliancePercent,
            summary.ProgressPercent,
            summary.Concepto,
            signatures.Count > 0);
    }
}
