using AuditPlatform.API.DTOs;
using AuditPlatform.API.Mappings;
using AuditPlatform.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AuditPlatform.API.Controllers;

[ApiController]
[Route("audits")]
[Authorize]
public class AuditsController : ControllerBase
{
    private readonly AuditService _auditService;

    public AuditsController(AuditService auditService)
    {
        _auditService = auditService;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    private string? CurrentRole =>
        User.FindFirstValue(ClaimTypes.Role);

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] string? search)
    {
        var audits = await _auditService.GetAuditsForUserAsync(CurrentUserId, CurrentRole, status, search);
        return Ok(audits.Select(a => a.ToDto()).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var audit = await _auditService.GetAuditForUserAsync(id, CurrentUserId, CurrentRole);
        if (audit == null)
            return NotFound(new { error = "Auditoría no encontrada o sin acceso." });

        return Ok(audit.ToDto());
    }

    [HttpGet("stats")]
    [Authorize(Roles = "ADMIN,AUDITOR")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _auditService.GetAuditStatsAsync();
        return Ok(stats);
    }

    [HttpGet("dashboard/metrics")]
    [Authorize(Roles = "ADMIN,AUDITOR")]
    public async Task<IActionResult> GetDashboardMetrics()
    {
        var metrics = await _auditService.GetDashboardMetricsAsync();
        return Ok(metrics);
    }

    [HttpGet("reports/stats")]
    [Authorize(Roles = "ADMIN,AUDITOR")]
    public async Task<IActionResult> GetReportStats()
    {
        var stats = await _auditService.GetAuditStatsAsync();
        return Ok(new
        {
            total_reports = stats.TotalAudits,
            approved_reports = stats.Approved,
            rejected_reports = stats.Rejected,
            completion_rate = stats.CompletionRate
        });
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,AUDITOR")]
    public async Task<IActionResult> CreateAudit([FromBody] CreateAuditRequest request)
    {
        var audit = await _auditService.CreateAuditAsync(request, CurrentUserId, CurrentRole);
        var full = await _auditService.GetAuditForUserAsync(audit.Id, CurrentUserId, CurrentRole);
        return CreatedAtAction(nameof(GetById), new { id = audit.Id }, full!.ToDto());
    }

    [HttpPut("{id:int}/assign")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Assign(int id, [FromBody] AssignAuditRequest body)
    {
        try
        {
            var audit = await _auditService.AssignAuditAsync(id, body.AssignedToUserId);
            var full = await _auditService.GetAuditForUserAsync(audit.Id, CurrentUserId, CurrentRole);
            return Ok(full!.ToDto());
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id:int}/items")]
    public async Task<IActionResult> UpdateItems(int id, [FromBody] List<AuditItemUpdateRequest> items)
    {
        try
        {
            var result = await _auditService.UpdateAuditItemsAsync(id, items, CurrentUserId, CurrentRole);
            return Ok(result.Select(i => i.ToDto()).ToList());
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpGet("{id:int}/evidences")]
    public async Task<IActionResult> GetEvidence(int id)
    {
        try
        {
            var result = await _auditService.GetEvidenceByAuditAsync(id, CurrentUserId, CurrentRole);
            return Ok(result.Select(e => e.ToDto()).ToList());
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Auditoría no encontrada o sin acceso." });
        }
    }

    [HttpPost("{id:int}/evidences")]
    public async Task<IActionResult> UploadEvidence(int id, [FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "Archivo no válido." });

        try
        {
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var fileName = Path.GetRandomFileName() + Path.GetExtension(file.FileName);
            var filePath = Path.Combine(uploadsFolder, fileName);

            await using var stream = System.IO.File.Create(filePath);
            await file.CopyToAsync(stream);

            var evidence = await _auditService.AddEvidenceAsync(id, Path.Combine("uploads", fileName), CurrentUserId, CurrentRole);
            return Created(string.Empty, evidence.ToDto());
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Auditoría no encontrada o sin acceso." });
        }
    }
}
