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
    private readonly AuditPdfService _pdfService;

    public AuditsController(AuditService auditService, AuditPdfService pdfService)
    {
        _auditService = auditService;
        _pdfService = pdfService;
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
    [Authorize(Roles = "ADMIN")]
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

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _auditService.DeleteAuditAsync(id, CurrentRole);
            return NoContent();
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

    [HttpPost("{id:int}/signatures")]
    [Authorize(Roles = "ADMIN,AUDITOR")]
    public async Task<IActionResult> SaveSignature(int id, [FromBody] SaveSignatureRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.ImageBase64))
            return BadRequest(new { error = "Falta la imagen de la firma." });

        try
        {
            var sig = await _auditService.SaveSignatureAsync(
                id, body.ImageBase64, body.SignerName, CurrentUserId, CurrentRole);
            return Ok(sig.ToDto());
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id:int}/signatures")]
    public async Task<IActionResult> GetSignatures(int id)
    {
        try
        {
            var list = await _auditService.GetSignaturesAsync(id, CurrentUserId, CurrentRole);
            return Ok(list.Select(s => s.ToDto()).ToList());
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Auditoría no encontrada o sin acceso." });
        }
    }

    [HttpGet("{id:int}/pdf")]
    [Authorize(Roles = "ADMIN,AUDITOR")]
    public async Task<IActionResult> DownloadPdf(int id)
    {
        try
        {
            var audit = await _auditService.GetAuditForPdfAsync(id, CurrentUserId, CurrentRole);
            if (audit == null)
                return NotFound(new { error = "Auditoría no encontrada o sin acceso." });

            var bytes = _pdfService.BuildActaPdf(audit, $"{Request.Scheme}://{Request.Host}");
            var safeTitle = string.Join("_", audit.Title.Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries));
            var fileName = $"Acta_{safeTitle}_{audit.Id}.pdf";
            return File(bytes, "application/pdf", fileName);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
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
