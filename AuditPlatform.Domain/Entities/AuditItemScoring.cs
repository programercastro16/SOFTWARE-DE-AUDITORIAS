namespace AuditPlatform.Domain.Entities;

/// <summary>
/// Puntos A / AR / I del formato acta (PDF). Si no hay triple en BD, se deriva de <see cref="AuditItem.Weight"/> (plantillas antiguas).
/// </summary>
public static class AuditItemScoring
{
    public static (double A, double AR, double I) GetTriple(AuditItem item)
    {
        if (item.PointsA > 0 || item.PointsAR > 0 || item.PointsI > 0)
            return (item.PointsA, item.PointsAR, item.PointsI);
        var w = item.Weight;
        return (w, Math.Round(w / 2.0, 2, MidpointRounding.AwayFromZero), 0.0);
    }

    public static double ClampScoreToOptions(double score, AuditItem item, double epsilon = 0.02)
    {
        var explicitTriple = item.PointsA > 0 || item.PointsAR > 0 || item.PointsI > 0;
        if (!explicitTriple)
            return Math.Clamp(score, 0, 100);

        if (score < -0.5)
            return -1;

        var (a, ar, i) = GetTriple(item);
        if (Nearly(score, a, epsilon)) return a;
        if (Nearly(score, ar, epsilon)) return ar;
        if (Nearly(score, i, epsilon)) return i;
        return i;
    }

    private static bool Nearly(double x, double y, double epsilon)
        => Math.Abs(x - y) < epsilon;
}
