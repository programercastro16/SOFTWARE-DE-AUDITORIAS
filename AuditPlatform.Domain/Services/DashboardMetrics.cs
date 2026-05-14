namespace AuditPlatform.Domain.Services;

public record DashboardMetrics(int TotalAudits, Dictionary<string, int> ByStatus);
