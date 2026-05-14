namespace AuditPlatform.Domain.Services;

public record AuditStats(int TotalAudits, int Approved, int Rejected, int Drafts, double CompletionRate);
