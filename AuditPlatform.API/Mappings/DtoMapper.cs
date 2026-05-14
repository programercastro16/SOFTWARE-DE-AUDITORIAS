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
        return new(item.Id, item.Code, item.Label, item.Weight, item.Score, item.Category, item.Observations, pa, par, pi);
    }

    public static EvidenceDto ToDto(this Evidence evidence)
        => new(evidence.Id, evidence.AuditId, evidence.FilePath, evidence.CreatedAt);

    public static AuditDto ToDto(this Audit audit)
        => new(
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
            audit.Evidences.Select(e => e.ToDto()).ToList());
}
