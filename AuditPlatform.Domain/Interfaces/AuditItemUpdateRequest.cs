namespace AuditPlatform.Domain.Interfaces;

public record AuditItemUpdateRequest(int Id, double Score, string? Observations);
