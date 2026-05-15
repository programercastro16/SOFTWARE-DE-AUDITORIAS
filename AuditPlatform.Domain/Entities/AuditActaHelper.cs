namespace AuditPlatform.Domain.Entities;

/// <summary>
/// Resumen del acta y etiquetas de calificación (misma lógica A/AR/I en puntos).
/// </summary>
public static class AuditActaHelper
{
    public const string GradeCp = "CP";
    public const string GradeCr = "CR";
    public const string GradeNc = "NC";

    public static string ResolveGradeCode(AuditItem item)
    {
        if (item.Score < -0.5)
            return string.Empty;

        var (a, ar, _) = AuditItemScoring.GetTriple(item);
        if (Nearly(item.Score, a)) return GradeCp;
        if (Nearly(item.Score, ar)) return GradeCr;
        return GradeNc;
    }

    public static string GetGradeLabel(string code) => code switch
    {
        GradeCp => "Conforme pleno",
        GradeCr => "Conforme con reparo",
        GradeNc => "No conforme",
        _ => "Sin calificar"
    };

    public static string GetGradeHint(string code) => code switch
    {
        GradeCp => "Cumple por completo el aspecto",
        GradeCr => "Cumple con observaciones o acción correctiva",
        GradeNc => "No cumple; requiere corrección",
        _ => ""
    };

    public static bool IsActaComplete(IEnumerable<AuditItem> items)
        => items.Any() && items.All(i => i.Score >= -0.5);

    public static ActaSummary ComputeSummary(IEnumerable<AuditItem> items)
    {
        var list = items.ToList();
        var total = list.Count;
        var scored = list.Count(i => i.Score >= -0.5);
        double earned = 0, maxSum = 0;

        foreach (var it in list)
        {
            var (a, _, _) = AuditItemScoring.GetTriple(it);
            maxSum += a;
            if (it.Score >= -0.5)
                earned += it.Score;
        }

        var progress = total == 0 ? 0 : Math.Round((double)scored / total * 100, 1);
        var compliance = maxSum <= 0 ? 0 : Math.Round(earned / maxSum * 100, 1);
        var concepto = scored < total || total == 0
            ? "—"
            : compliance >= 90 ? "Favorable"
            : compliance >= 60 ? "Favorable con requerimiento"
            : "Desfavorable";

        return new ActaSummary(total, scored, progress, compliance, concepto, earned, maxSum);
    }

    private static bool Nearly(double x, double y, double epsilon = 0.02)
        => Math.Abs(x - y) < epsilon;
}

public record ActaSummary(
    int TotalItems,
    int ScoredItems,
    double ProgressPercent,
    double CompliancePercent,
    string Concepto,
    double EarnedPoints,
    double MaxPoints);
