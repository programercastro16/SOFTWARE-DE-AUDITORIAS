namespace AuditPlatform.API.DTOs;

public record CreateAuditRequest(
    string Title,
    string? InternalName,
    string Sede,
    string? Description,
    string? Comments,
    string? ScheduledVisitDate,
    int? AssignedToUserId);

public record AssignAuditRequest(int AssignedToUserId);

public record AuditItemUpdateRequest(int Id, double Score, string? Observations);

public record AuditItemDto(
    int Id,
    string Code,
    string Label,
    double Weight,
    double Score,
    string? Category,
    string? Observations,
    double PointsA,
    double PointsAR,
    double PointsI,
    string GradeCode,
    string GradeLabel);

public record EvidenceDto(int Id, int AuditId, string FilePath, DateTime CreatedAt);

public record SignatureDto(
    int Id,
    int AuditId,
    int SignedBy,
    string SignerName,
    string ImagePath,
    DateTime CreatedAt);

public record SaveSignatureRequest(string ImageBase64, string? SignerName);

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
    List<EvidenceDto> Evidences,
    List<SignatureDto> Signatures,
    bool IsActaComplete,
    double CompliancePercent,
    double ProgressPercent,
    string ActaConcepto,
    bool HasSignature);

public record AuditStatsDto(int TotalAudits, int Approved, int Rejected, int Drafts, double CompletionRate);
public record DashboardMetricsDto(int TotalAudits, Dictionary<string, int> ByStatus);
