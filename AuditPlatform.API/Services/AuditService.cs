using AuditPlatform.API.DTOs;
using AuditPlatform.DataAccess.Context;
using AuditPlatform.Domain.Entities;
using AuditPlatform.Domain.Services;
using Microsoft.EntityFrameworkCore;

namespace AuditPlatform.API.Services;

public class AuditService
{
    private readonly ApplicationDbContext _dbContext;

    public AuditService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Audit>> GetAuditsForCurrentUserAsync(int userId, string role, string? status, string? search)
    {
        var query = _dbContext.Audits
            .Include(a => a.Items)
            .Include(a => a.Evidences)
            .Include(a => a.CreatedByUser)
            .Include(a => a.AssignedToUser)
            .AsQueryable();

        query = role switch
        {
            "ADMIN" => query,
            "AUDITOR" => query.Where(a => a.CreatedBy == userId || a.AssignedToUserId == userId),
            _ => query.Where(a => a.AssignedToUserId == userId)
        };

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(a => a.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(a =>
                a.Title.Contains(search) ||
                (a.InternalName ?? string.Empty).Contains(search) ||
                a.Sede.Contains(search) ||
                (a.Description ?? string.Empty).Contains(search) ||
                (a.Comments ?? string.Empty).Contains(search));
        }

        return await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
    }

    public async Task<Audit?> GetAuditByIdForUserAsync(int id, int userId, string role)
    {
        var audit = await _dbContext.Audits
            .Include(a => a.Items)
            .Include(a => a.Evidences)
            .Include(a => a.CreatedByUser)
            .Include(a => a.AssignedToUser)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (audit == null) return null;
        return CanViewAudit(audit, userId, role) ? audit : null;
    }

    public async Task<Audit> CreateAuditAsync(CreateAuditRequest request, int createdBy)
    {
        var sede = (request.Sede ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(sede))
            throw new ArgumentException("La sede es obligatoria.");

        var audit = new Audit
        {
            Title = request.Title.Trim(),
            InternalName = string.IsNullOrWhiteSpace(request.InternalName) ? null : request.InternalName.Trim(),
            Sede = sede,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            Comments = string.IsNullOrWhiteSpace(request.Comments) ? null : request.Comments.Trim(),
            ScheduledVisitDate = string.IsNullOrWhiteSpace(request.ScheduledVisitDate)
                ? null
                : DateTime.TryParse(request.ScheduledVisitDate, out var parsed)
                    ? parsed
                    : null,
            CreatedBy = createdBy,
            Status = "BORRADOR",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        audit.Items = AuditChecklistTemplate.BuildItems();
        _dbContext.Audits.Add(audit);
        await _dbContext.SaveChangesAsync();
        return audit;
    }

    public async Task<Audit> AssignAuditAsync(int auditId, int assignedToUserId)
    {
        var audit = await _dbContext.Audits.FirstOrDefaultAsync(a => a.Id == auditId)
                    ?? throw new KeyNotFoundException("Auditoría no encontrada.");

        var assignee = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == assignedToUserId)
                       ?? throw new KeyNotFoundException("Usuario no encontrado.");

        if (assignee.Role != Role.AUDITOR)
            throw new InvalidOperationException("Solo se pueden asignar auditores con rol AUDITOR.");

        audit.AssignedToUserId = assignedToUserId;
        audit.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
        return audit;
    }

    public async Task<List<AuditItem>> UpdateAuditItemsAsync(int auditId, List<AuditItemUpdateRequest> items, int userId, string role)
    {
        var audit = await _dbContext.Audits.Include(a => a.Items).FirstOrDefaultAsync(a => a.Id == auditId);
        if (audit == null)
            throw new KeyNotFoundException("Auditoría no encontrada.");

        if (!CanModifyAuditItems(audit, userId, role))
            throw new UnauthorizedAccessException("No tienes permiso para editar esta auditoría.");

        foreach (var item in items)
        {
            var existing = audit.Items.FirstOrDefault(i => i.Id == item.Id);
            if (existing != null)
            {
                existing.Score = item.Score;
                existing.Observations = item.Observations;
                existing.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _dbContext.SaveChangesAsync();
        return audit.Items;
    }

    public async Task<List<Evidence>> GetEvidenceByAuditAsync(int auditId)
    {
        return await _dbContext.Evidences.Where(e => e.AuditId == auditId).ToListAsync();
    }

    public async Task<Evidence> AddEvidenceAsync(int auditId, string filePath)
    {
        var audit = await _dbContext.Audits.FindAsync(auditId);
        if (audit == null)
            throw new KeyNotFoundException("Auditoría no encontrada.");

        var evidence = new Evidence
        {
            AuditId = auditId,
            FilePath = filePath,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Evidences.Add(evidence);
        await _dbContext.SaveChangesAsync();
        return evidence;
    }

    public async Task<AuditStats> GetAuditStatsAsync()
    {
        var allAudits = await _dbContext.Audits.ToListAsync();
        var total = allAudits.Count;
        var approved = allAudits.Count(a => a.Status == "APROBADO");
        var rejected = allAudits.Count(a => a.Status == "RECHAZADO");
        var drafts = allAudits.Count(a => a.Status == "BORRADOR");
        var completionRate = total == 0 ? 0 : Math.Round((double)(approved + rejected) / total * 100, 2);

        return new AuditStats(total, approved, rejected, drafts, completionRate);
    }

    public async Task<DashboardMetrics> GetDashboardMetricsAsync()
    {
        var audits = await _dbContext.Audits.ToListAsync();
        var byStatus = audits.GroupBy(a => a.Status)
            .ToDictionary(g => g.Key, g => g.Count());

        return new DashboardMetrics(audits.Count, byStatus);
    }

    private static bool CanViewAudit(Audit audit, int userId, string role) => role switch
    {
        "ADMIN" => true,
        "AUDITOR" => audit.CreatedBy == userId || audit.AssignedToUserId == userId,
        _ => audit.AssignedToUserId == userId
    };

    private static bool CanModifyAuditItems(Audit audit, int userId, string role) => role switch
    {
        "ADMIN" => true,
        "AUDITOR" => audit.CreatedBy == userId || audit.AssignedToUserId == userId,
        _ => audit.AssignedToUserId == userId
    };
}
