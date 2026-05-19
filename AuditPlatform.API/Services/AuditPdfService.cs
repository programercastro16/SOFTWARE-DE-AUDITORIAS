using AuditPlatform.Domain.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace AuditPlatform.API.Services;

public class AuditPdfService
{
    static AuditPdfService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] BuildActaPdf(Audit audit, string apiBaseUrl)
    {
        var summary = AuditActaHelper.ComputeSummary(audit.Items);
        var groups = audit.Items
            .GroupBy(i => i.Category ?? "GENERAL")
            .OrderBy(g => g.Key);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(36);
                page.DefaultTextStyle(x => x.FontSize(10).FontColor(Colors.Grey.Darken3));

                page.Header().Column(col =>
                {
                    col.Item().Text("ACTA DE AUDITORÍA INTERNA").Bold().FontSize(16).FontColor(Colors.Blue.Darken3);
                    col.Item().PaddingTop(12).Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text($"Título: {audit.Title}").SemiBold();
                            c.Item().Text($"Sede: {audit.Sede}");
                            if (!string.IsNullOrWhiteSpace(audit.InternalName))
                                c.Item().Text($"Referencia: {audit.InternalName}");
                        });
                        row.ConstantItem(180).Column(c =>
                        {
                            c.Item().AlignRight().Text($"Estado: {audit.Status}");
                            c.Item().AlignRight().Text($"Fecha informe: {DateTime.UtcNow:dd/MM/yyyy HH:mm} UTC");
                            if (audit.ScheduledVisitDate.HasValue)
                                c.Item().AlignRight().Text($"Visita: {audit.ScheduledVisitDate:dd/MM/yyyy}");
                        });
                    });
                });

                page.Content().PaddingVertical(12).Column(col =>
                {
                    col.Item().Background(Colors.Blue.Lighten5).Padding(10).Column(box =>
                    {
                        box.Item().Text("Resumen de calificación").Bold().FontSize(11);
                        box.Item().PaddingTop(6).Row(r =>
                        {
                            r.RelativeItem().Text($"Progreso: {summary.ProgressPercent}% ({summary.ScoredItems}/{summary.TotalItems} aspectos)");
                            r.RelativeItem().Text($"% Cumplimiento: {summary.CompliancePercent}%").Bold();
                        });
                        box.Item().Text($"Concepto: {summary.Concepto}").SemiBold();
                        box.Item().Text($"Puntos obtenidos: {summary.EarnedPoints:0.##} / {summary.MaxPoints:0.##}");
                        box.Item().PaddingTop(4).Text(
                            "CP = Conforme pleno · CR = Conforme con reparo · NC = No conforme")
                            .FontSize(8).Italic();
                    });

                    foreach (var group in groups)
                    {
                        col.Item().PaddingTop(14).Text(group.Key).Bold().FontSize(11)
                            .FontColor(Colors.Blue.Darken2);
                        col.Item().PaddingTop(6).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(36);
                                columns.RelativeColumn(3);
                                columns.ConstantColumn(52);
                                columns.ConstantColumn(44);
                                columns.RelativeColumn(2);
                            });
                            table.Header(header =>
                            {
                                header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Cód.").Bold().FontSize(8);
                                header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Aspecto").Bold().FontSize(8);
                                header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Calif.").Bold().FontSize(8);
                                header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Pts.").Bold().FontSize(8);
                                header.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Observaciones").Bold().FontSize(8);
                            });

                            foreach (var item in group.OrderBy(i => i.Code))
                            {
                                var grade = AuditActaHelper.ResolveGradeCode(item);
                                var pts = item.Score >= -0.5 ? item.Score.ToString("0.##") : "—";
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4)
                                    .Text(item.Code).FontSize(8);
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4)
                                    .Text(item.Label).FontSize(8);
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4)
                                    .Text($"{grade} — {AuditActaHelper.GetGradeLabel(grade)}").FontSize(7);
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4)
                                    .Text(pts).FontSize(8);
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4)
                                    .Text(string.IsNullOrWhiteSpace(item.Observations) ? "—" : item.Observations).FontSize(7);
                            }
                        });
                    }

                    if (!string.IsNullOrWhiteSpace(audit.Comments))
                    {
                        col.Item().PaddingTop(16).Text("Comentarios generales").Bold();
                        col.Item().Text(audit.Comments);
                    }

                    col.Item().PaddingTop(20).Text("Firmas electrónicas").Bold().FontSize(11);
                    if (audit.Signatures.Count == 0)
                    {
                        col.Item().Text("Sin firmas registradas.").Italic().FontSize(9);
                    }
                    else
                    {
                        foreach (var sig in audit.Signatures.OrderBy(s => s.CreatedAt))
                        {
                            var path = Path.Combine(Directory.GetCurrentDirectory(),
                                sig.ImagePath.Replace('/', Path.DirectorySeparatorChar));
                            col.Item().PaddingTop(8).Row(row =>
                            {
                                row.ConstantItem(140).Column(c =>
                                {
                                    if (File.Exists(path))
                                        c.Item().Width(130).Height(50).Image(path);
                                    else
                                        c.Item().Text("[imagen no disponible]").FontSize(8);
                                });
                                row.RelativeItem().Column(c =>
                                {
                                    c.Item().Text(sig.SignerName).SemiBold();
                                    c.Item().Text($"Firmado: {sig.CreatedAt:dd/MM/yyyy HH:mm} UTC").FontSize(8);
                                });
                            });
                        }
                    }
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("AuditPlatform · ");
                    text.Span($"Auditoría #{audit.Id}");
                    text.Span(" · Página ");
                    text.CurrentPageNumber();
                    text.Span(" de ");
                    text.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }
}
