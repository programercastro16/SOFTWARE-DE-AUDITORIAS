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

    public static bool UserCanAccessAudit(Audit audit, int userId, string? role)
    {
        if (string.Equals(role, "ADMIN", StringComparison.OrdinalIgnoreCase))
            return true;
        return audit.CreatedBy == userId || audit.AssignedToUserId == userId;
    }

    public async Task<List<Audit>> GetAuditsForUserAsync(int userId, string? role, string? status, string? search)
    {
        var query = _dbContext.Audits
            .Include(a => a.Items)
            .Include(a => a.Evidences)
            .Include(a => a.CreatedByUser)
            .Include(a => a.AssignedToUser)
            .AsQueryable();

        if (!string.Equals(role, "ADMIN", StringComparison.OrdinalIgnoreCase))
            query = query.Where(a => a.AssignedToUserId == userId || a.CreatedBy == userId);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(a => a.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(a =>
                a.Title.Contains(search) ||
                (a.InternalName ?? string.Empty).Contains(search) ||
                (a.Sede ?? string.Empty).Contains(search) ||
                (a.Description ?? string.Empty).Contains(search) ||
                (a.Comments ?? string.Empty).Contains(search));
        }

        return await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
    }

    public async Task<Audit?> GetAuditForUserAsync(int id, int userId, string? role)
    {
        var audit = await _dbContext.Audits
            .Include(a => a.Items)
            .Include(a => a.Evidences)
            .Include(a => a.CreatedByUser)
            .Include(a => a.AssignedToUser)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (audit == null || !UserCanAccessAudit(audit, userId, role))
            return null;

        return audit;
    }

    public async Task<Audit> CreateAuditAsync(CreateAuditRequest request, int createdBy, string? creatorRole)
    {
        var sede = string.IsNullOrWhiteSpace(request.Sede) ? "Sin sede" : request.Sede.Trim();
        var audit = new Audit
        {
            Title = request.Title.Trim(),
            InternalName = string.IsNullOrWhiteSpace(request.InternalName) ? null : request.InternalName.Trim(),
            Sede = sede,
            Description = request.Description,
            Comments = request.Comments,
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

        if (string.Equals(creatorRole, "ADMIN", StringComparison.OrdinalIgnoreCase)
            && request.AssignedToUserId is > 0)
        {
            var assignee = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == request.AssignedToUserId);
            if (assignee != null && assignee.Role == Role.AUDITOR)
                audit.AssignedToUserId = assignee.Id;
        }

        audit.Items = BuildActaInternaChecklist();
        _dbContext.Audits.Add(audit);
        await _dbContext.SaveChangesAsync();
        return audit;
    }

    public async Task<Audit> AssignAuditAsync(int auditId, int assignedToUserId)
    {
        var audit = await _dbContext.Audits.FirstOrDefaultAsync(a => a.Id == auditId)
                    ?? throw new KeyNotFoundException("Auditoría no encontrada.");

        var assignee = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == assignedToUserId)
                       ?? throw new InvalidOperationException("Usuario no encontrado.");

        if (assignee.Role != Role.AUDITOR)
            throw new InvalidOperationException("Solo se pueden asignar auditorías a usuarios con rol AUDITOR.");

        audit.AssignedToUserId = assignee.Id;
        audit.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
        return audit;
    }

    public async Task<List<AuditItem>> UpdateAuditItemsAsync(int auditId, List<AuditItemUpdateRequest> items, int userId, string? role)
    {
        var audit = await _dbContext.Audits.Include(a => a.Items).FirstOrDefaultAsync(a => a.Id == auditId);
        if (audit == null)
            throw new KeyNotFoundException("Auditoría no encontrada.");

        if (!UserCanAccessAudit(audit, userId, role))
            throw new UnauthorizedAccessException("No tiene permiso para editar esta auditoría.");

        foreach (var item in items)
        {
            var existing = audit.Items.FirstOrDefault(i => i.Id == item.Id);
            if (existing == null) continue;
            existing.Score = AuditItemScoring.ClampScoreToOptions(item.Score, existing);
            existing.Observations = item.Observations;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        audit.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
        return audit.Items;
    }

    public async Task<List<Evidence>> GetEvidenceByAuditAsync(int auditId, int userId, string? role)
    {
        var audit = await _dbContext.Audits.AsNoTracking().FirstOrDefaultAsync(a => a.Id == auditId);
        if (audit == null || !UserCanAccessAudit(audit, userId, role))
            throw new KeyNotFoundException("Auditoría no encontrada.");

        return await _dbContext.Evidences.Where(e => e.AuditId == auditId).ToListAsync();
    }

    public async Task<Evidence> AddEvidenceAsync(int auditId, string filePath, int userId, string? role)
    {
        var audit = await _dbContext.Audits.FirstOrDefaultAsync(a => a.Id == auditId);
        if (audit == null || !UserCanAccessAudit(audit, userId, role))
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
        var byStatus = audits.GroupBy(a => a.Status).ToDictionary(g => g.Key, g => g.Count());

        return new DashboardMetrics(audits.Count, byStatus);
    }

    /// <summary>
    /// Plantilla alineada al formato "Acta de auditoría interna" (CUZCO / Carrascal Zamarra): ítems con calificación A / AR / I.
    /// </summary>
    private static List<AuditItem> BuildActaInternaChecklist()
    {
        static AuditItem Row(string code, string label, string category, double a, double ar, double i)
            => new()
            {
                Code = code,
                Label = label,
                Category = category,
                PointsA = a,
                PointsAR = ar,
                PointsI = i,
                Weight = a,
                Score = -1
            };

        return
        [
            Row("1.1", "Localización y diseño", "1. INSTALACIONES FÍSICAS", 7, 3.5, 0),
            Row("1.2", "Condiciones de pisos y paredes", "1. INSTALACIONES FÍSICAS", 7, 3.5, 0),
            Row("1.3", "Techos, iluminación y ventilación", "1. INSTALACIONES FÍSICAS", 7, 3.5, 0),
            Row("1.4", "Instalaciones sanitarias", "1. INSTALACIONES FÍSICAS", 4, 2, 0),
            Row("2.1", "Condiciones de equipos y utensilios", "2. EQUIPOS Y UTENSILIOS", 6, 3, 0),
            Row("2.2", "Superficies de contacto con el alimento", "2. EQUIPOS Y UTENSILIOS", 6, 3, 0),
            Row("3.1", "Estado de salud", "3. PERSONAL MANIPULADOR", 4, 2, 0),
            Row("3.2", "Reconocimiento médico", "3. PERSONAL MANIPULADOR", 4, 2, 0),
            Row("3.3", "Prácticas higiénicas", "3. PERSONAL MANIPULADOR", 7, 3.5, 0),
            Row("3.4", "Educación y capacitación", "3. PERSONAL MANIPULADOR", 4, 2, 0),
            Row("4.1", "Control de materia prima", "4. REQUISITOS HIGIÉNICOS", 5, 2.5, 0),
            Row("4.2", "Prevención de la contaminación cruzada", "4. REQUISITOS HIGIÉNICOS", 5, 2.5, 0),
            Row("4.3", "Manejo de temperaturas", "4. REQUISITOS HIGIÉNICOS", 7, 3.5, 0),
            Row("4.4", "Condiciones de almacenamiento", "4. REQUISITOS HIGIÉNICOS", 4, 2, 0),
            Row("5.1", "Suministro y calidad de agua potable", "5. SANEAMIENTO", 7, 3.5, 0),
            Row("5.2", "Residuos líquidos", "5. SANEAMIENTO", 4, 2, 0),
            Row("5.3", "Residuos sólidos", "5. SANEAMIENTO", 4, 2, 0),
            Row("5.4", "Control integrado de plagas", "5. SANEAMIENTO", 9, 4.5, 0),
            Row("5.5", "Limpieza y desinfección de áreas, equipos y utensilios", "5. SANEAMIENTO", 7, 3.5, 0),
            Row("5.6", "Soportes documentales de saneamiento", "5. SANEAMIENTO", 2, 1, 0),
        ];
    }
}
