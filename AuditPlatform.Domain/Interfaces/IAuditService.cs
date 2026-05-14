using AuditPlatform.Domain.Entities;
using AuditPlatform.Domain.Services;

namespace AuditPlatform.Domain.Interfaces;

public interface IAuditService
{
    Task<List<Audit>> GetAllAuditsAsync(string? status, string? search);
    Task<Audit> GetAuditByIdAsync(int id);
    Task<Audit> CreateAuditAsync(string title, string? description, string? scheduledVisitDate, int createdBy);
    Task<List<AuditItem>> UpdateAuditItemsAsync(int auditId, List<AuditItemUpdateRequest> items);
    Task<List<Evidence>> GetEvidenceByAuditAsync(int auditId);
    Task<Evidence> AddEvidenceAsync(int auditId, string filePath);
    Task<AuditStats> GetAuditStatsAsync();
    Task<DashboardMetrics> GetDashboardMetricsAsync();
}
