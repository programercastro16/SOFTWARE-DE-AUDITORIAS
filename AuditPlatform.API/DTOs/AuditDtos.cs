namespace AuditPlatform.API.DTOs;

public record CreateAuditRequest(
    string Title,
    string? InternalName,
    string Sede,
    string? Description,
    string? Comments,
    string? ScheduledVisitDate);

public record AssignAuditRequest(int AssignedToUserId);

public record AuditItemUpdateRequest(int Id, double Score, string? Observations);

public record AuditItemDto(int Id, string Code, string Label, double Weight, double Score, string? Category, string? Observations);
public record EvidenceDto(int Id, int AuditId, string FilePath, DateTime CreatedAt);

public record AuditDto(
    int Id,
    string Title,
    string? InternalName,
    string Sede,
    string? Description,
    string? Comments,
    string Status,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int CreatedByUserId,
    string CreatedBy,
    int? AssignedToUserId,
    string? AssignedToUserName,
    string? ScheduledVisitDate,
    List<AuditItemDto> Items,
    List<EvidenceDto> Evidences);

public record AuditStatsDto(int TotalAudits, int Approved, int Rejected, int Drafts, double CompletionRate);
public record DashboardMetricsDto(int TotalAudits, Dictionary<string, int> ByStatus);
