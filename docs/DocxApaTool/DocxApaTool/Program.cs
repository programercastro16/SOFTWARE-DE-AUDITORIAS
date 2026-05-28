using System.Text;
using System.Text.RegularExpressions;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

const string SourcePath = @"c:\Users\Thomas Castro\Downloads\DEV COLLAB TRABAJO FINAL.docx";
const string OutputPath = @"c:\Users\Thomas Castro\Downloads\DEV COLLAB TRABAJO FINAL - APA.docx";
const string ReportPath = @"c:\Users\Thomas Castro\Desktop\Cursor Project\docs\referencias-revision.txt";
const string StructurePath = @"c:\Users\Thomas Castro\Desktop\Cursor Project\docs\doc-outline.txt";

File.Copy(SourcePath, OutputPath, true);

var outline = new List<string>();
var tocEntries = new List<(int Level, string Label, string Title)>();
var references = new List<string>();
var report = new StringBuilder();
var refBuffer = new StringBuilder();

void FlushReference()
{
    var r = refBuffer.ToString().Trim();
    refBuffer.Clear();
    if (r.Length > 15)
        references.Add(r);
}

using (var doc = WordprocessingDocument.Open(OutputPath, true))
{
    var body = doc.MainDocumentPart!.Document.Body!;
    var numbering = LoadNumbering(doc.MainDocumentPart.NumberingDefinitionsPart);
    var counters = new Dictionary<int, int[]>();

    var paragraphs = body.Elements<Paragraph>().ToList();
    int refStartIndex = FindLastIndex(paragraphs, p =>
        GetParagraphText(p).Trim().Equals("Referencias", StringComparison.OrdinalIgnoreCase));

    int contentStartIndex = FindContentStartIndex(paragraphs, numbering);
    var tocKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

    for (int i = 0; i < paragraphs.Count; i++)
    {
        var para = paragraphs[i];
        var text = GetParagraphText(para).Trim();
        var numInfo = TryGetNumberInfo(para, numbering, counters);
        var numLabel = numInfo?.Label;

        if (refStartIndex >= 0 && i > refStartIndex)
        {
            if (text.Equals("Anexos", StringComparison.OrdinalIgnoreCase) ||
                text.StartsWith("Anexo ", StringComparison.OrdinalIgnoreCase))
            {
                FlushReference();
                break;
            }
            if (!string.IsNullOrWhiteSpace(text))
            {
                if (refBuffer.Length > 0 && LooksLikeNewReference(text))
                    FlushReference();
                refBuffer.Append(text).Append(' ');
            }
            continue;
        }

        if (refStartIndex >= 0 && i >= refStartIndex) { /* skip toc in refs */ }
        else if (i >= contentStartIndex && numInfo != null &&
                 !ShouldStopToc(tocKeys, numInfo, text) &&
                 IsValidTocCandidate(numInfo, text))
        {
            var key = $"{numLabel}|{text}";
            if (tocKeys.Add(key))
            {
                var level = Math.Max(0, (numLabel ?? "").Count(c => c == '.') - 1);
                tocEntries.Add((level, numLabel!, text));
                outline.Add($"{numLabel} {text}");
            }
        }

        var isHeading = numInfo is { IsDecimal: true, Level: <= 1 } && text.Length < 200;
        ApplyApaToParagraph(para, isHeading, isReference: false);

        if (HasDrawing(para))
            CenterParagraph(para);
    }

    FlushReference();
    references = SplitMergedReferences(references);
    references = references.OrderBy(r => GetSortKey(r), StringComparer.OrdinalIgnoreCase).ToList();

    ApplySectionMargins(doc);
    InsertTableOfContents(body, tocEntries);
    FormatReferencesSection(body, refStartIndex);
}

WriteReferenceReport(references, report);
File.WriteAllLines(StructurePath, outline, Encoding.UTF8);
File.WriteAllText(ReportPath, report.ToString(), Encoding.UTF8);
Console.WriteLine($"Saved: {OutputPath}");
Console.WriteLine($"Outline entries: {outline.Count}");
Console.WriteLine($"References found: {references.Count}");

static bool LooksLikeNewReference(string t) =>
    Regex.IsMatch(t, @"^[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑ\-\.]+,\s+[A-Z]") ||
    Regex.IsMatch(t, @"^(IEEE|Object Management Group|MinTIC|ADPList|Scrum\.org)");

static int FindContentStartIndex(List<Paragraph> paragraphs, Dictionary<int, AbstractNumInfo> numbering)
{
    var counters = new Dictionary<int, int[]>();
    int introCount = 0;
    for (int i = 0; i < paragraphs.Count; i++)
    {
        var text = GetParagraphText(paragraphs[i]).Trim();
        var info = TryGetNumberInfo(paragraphs[i], numbering, counters);
        if (text.Equals("Introducción", StringComparison.OrdinalIgnoreCase) &&
            info?.Label?.StartsWith("1.") == true)
        {
            introCount++;
            if (introCount == 2) return i;
        }
    }
    return 0;
}

static bool IsValidTocCandidate(NumberInfo? info, string text)
{
    if (info is not { IsDecimal: true } || info.Level > 1) return false;
    if (string.IsNullOrWhiteSpace(text) || text.Length > 150) return false;
    if (text.StartsWith('[') || text.StartsWith('•') || text.Contains("Gateway")) return false;
    if (text.Equals("Referencias", StringComparison.OrdinalIgnoreCase)) return false;
    if (text.StartsWith("Anexo", StringComparison.OrdinalIgnoreCase)) return false;
    if (info.Label is null || info.Label.Contains('●')) return false;
    if (!Regex.IsMatch(info.Label, @"^\d+(\.\d+)?\.$")) return false;
    if (Regex.IsMatch(text, @"^(El |La |Se |Para |Cuando )")) return false;
    if (info.Level == 0 && text.Length < 18 &&
        !text.Equals("Introducción", StringComparison.OrdinalIgnoreCase))
        return false;
  return true;
}

static bool ShouldStopToc(HashSet<string> tocKeys, NumberInfo info, string text)
{
    if (tocKeys.Any(k => k.StartsWith("13.|", StringComparison.OrdinalIgnoreCase)) &&
        info.Label is "1." or "2." or "3." or "4." or "5." or "6.")
        return true;
    return false;
}

static List<string> SplitMergedReferences(List<string> refs)
{
    var result = new List<string>();
    foreach (var r in refs)
    {
        if (r.Contains("Anexo A", StringComparison.OrdinalIgnoreCase))
        {
            var idx = r.IndexOf("Anexo A", StringComparison.OrdinalIgnoreCase);
            var main = r[..idx].Trim();
            if (main.Length > 15) result.Add(main);
            continue;
        }
        if (Regex.IsMatch(r, @"ADPList\.\s+\(2024\)"))
        {
            var m = Regex.Match(r, @"^(?<a>.+?MinTIC Colombia\. \(2023\)\..+?Comunicaciones\.)\s+(?<b>ADPList\..+)$");
            if (m.Success)
            {
                result.Add(m.Groups["a"].Value.Trim());
                result.Add(m.Groups["b"].Value.Trim());
                continue;
            }
        }
        result.Add(r);
    }
    return result;
}

static string GetSortKey(string r)
{
    var m = Regex.Match(r, @"^([^(]+)");
    return m.Success ? m.Groups[1].Value.Trim().TrimEnd('.') : r;
}

static int FindLastIndex<T>(IReadOnlyList<T> list, Func<T, bool> pred)
{
    for (int i = list.Count - 1; i >= 0; i--)
        if (pred(list[i])) return i;
    return -1;
}

static void ApplySectionMargins(WordprocessingDocument doc)
{
    var body = doc.MainDocumentPart!.Document.Body!;
    var sectPr = body.Elements<SectionProperties>().LastOrDefault()
                 ?? body.AppendChild(new SectionProperties());
    var pgMar = sectPr.GetFirstChild<PageMargin>() ?? sectPr.AppendChild(new PageMargin());
    pgMar.Top = 1440;
    pgMar.Bottom = 1440;
    pgMar.Left = 1440;
    pgMar.Right = 1440;
}

static void InsertTableOfContents(Body body, List<(int Level, string Label, string Title)> entries)
{
    if (entries.Count == 0) return;

    Paragraph? firstNumbered = body.Elements<Paragraph>()
        .FirstOrDefault(p => p.ParagraphProperties?.NumberingProperties != null);
    if (firstNumbered == null) return;

    var tocParas = new List<Paragraph>
    {
        MakeParagraph("ÍNDICE", bold: true, center: true, after: 200),
        MakeParagraph("", bold: false)
    };

    foreach (var e in entries)
    {
        var indent = e.Level >= 2 ? 720 : e.Level == 1 ? 360 : 0;
        tocParas.Add(MakeParagraph($"{e.Label} {e.Title}".Trim(), bold: false, leftIndent: indent));
    }

    tocParas.Add(MakeParagraph("", bold: false));
    var pageBreakPara = MakeParagraph("", bold: false);
    pageBreakPara.Append(new Run(new Break { Type = BreakValues.Page }));
    tocParas.Add(pageBreakPara);

    foreach (var tp in tocParas.AsEnumerable().Reverse())
        firstNumbered.InsertBeforeSelf(tp);
}

static void FormatReferencesSection(Body body, int refStartIndex)
{
    var paragraphs = body.Elements<Paragraph>().ToList();
    if (refStartIndex < 0 || refStartIndex >= paragraphs.Count) return;

    var refHeading = paragraphs[refStartIndex];
    ApplyApaToParagraph(refHeading, isHeading: true, isReference: false, centerHeading: true);
    refHeading.ParagraphProperties ??= new ParagraphProperties();
    refHeading.ParagraphProperties.PageBreakBefore = new PageBreakBefore();

    for (int i = refStartIndex + 1; i < paragraphs.Count; i++)
    {
        var p = paragraphs[i];
        var t = GetParagraphText(p).Trim();
        if (t.Equals("Anexos", StringComparison.OrdinalIgnoreCase)) break;
        if (string.IsNullOrWhiteSpace(t)) continue;
        ApplyApaToParagraph(p, isHeading: false, isReference: true);
    }
}

static Paragraph MakeParagraph(string text, bool bold, bool center = false, int after = 0, int leftIndent = 0)
{
    var p = new Paragraph();
    var pPr = new ParagraphProperties();
    if (center) pPr.Justification = new Justification { Val = JustificationValues.Center };
    if (after > 0) pPr.SpacingBetweenLines = new SpacingBetweenLines { After = after.ToString() };
    if (leftIndent > 0) pPr.Indentation = new Indentation { Left = leftIndent.ToString() };
    pPr.SpacingBetweenLines ??= new SpacingBetweenLines();
    pPr.SpacingBetweenLines.Line = "480";
    pPr.SpacingBetweenLines.LineRule = LineSpacingRuleValues.Auto;
    p.ParagraphProperties = pPr;

    if (!string.IsNullOrEmpty(text))
    {
        var run = new Run();
        var rPr = new RunProperties();
        rPr.RunFonts = new RunFonts
        {
            Ascii = "Times New Roman",
            HighAnsi = "Times New Roman",
            ComplexScript = "Times New Roman"
        };
        rPr.FontSize = new FontSize { Val = "24" };
        if (bold) rPr.Bold = new Bold();
        run.RunProperties = rPr;
        run.Append(new Text(text) { Space = SpaceProcessingModeValues.Preserve });
        p.Append(run);
    }
    return p;
}

static void ApplyApaToParagraph(Paragraph para, bool isHeading, bool isReference, bool centerHeading = false)
{
    var pPr = para.ParagraphProperties ??= new ParagraphProperties();
    pPr.SpacingBetweenLines = new SpacingBetweenLines
    {
        Line = "480",
        LineRule = LineSpacingRuleValues.Auto,
        Before = isHeading ? "120" : "0",
        After = isHeading ? "120" : "0"
    };

    if (isReference)
        pPr.Indentation = new Indentation { Hanging = "720", Left = "720" };
    else if (!isHeading)
        pPr.Indentation = new Indentation { FirstLine = "720" };
    else if (centerHeading)
        pPr.Justification = new Justification { Val = JustificationValues.Center };

    foreach (var run in para.Descendants<Run>())
    {
        var rPr = run.RunProperties ??= new RunProperties();
        rPr.RunFonts = new RunFonts
        {
            Ascii = "Times New Roman",
            HighAnsi = "Times New Roman",
            ComplexScript = "Times New Roman"
        };
        rPr.FontSize = new FontSize { Val = "24" };
        rPr.Bold = isHeading ? new Bold() : null;
        if (!isHeading) rPr.Bold = null;
    }
}

static void CenterParagraph(Paragraph para)
{
    var pPr = para.ParagraphProperties ??= new ParagraphProperties();
    pPr.Justification = new Justification { Val = JustificationValues.Center };
}

static bool HasDrawing(Paragraph para) => para.Descendants<Drawing>().Any();

static string GetParagraphText(Paragraph para) =>
    string.Concat(para.Descendants<Text>().Select(t => t.Text));

static Dictionary<int, AbstractNumInfo> LoadNumbering(NumberingDefinitionsPart? part)
{
    var map = new Dictionary<int, AbstractNumInfo>();
    if (part?.Numbering == null) return map;

    var abstractNums = part.Numbering.Elements<AbstractNum>()
        .ToDictionary(a => a.AbstractNumberId!.Value, a => a);

    foreach (var num in part.Numbering.Elements<NumberingInstance>())
    {
        var numId = num.NumberID!.Value;
        if (num.AbstractNumId?.Val == null) continue;
        if (!abstractNums.TryGetValue(num.AbstractNumId.Val.Value, out var abs)) continue;
        map[numId] = new AbstractNumInfo(abs);
    }
    return map;
}

static NumberInfo? TryGetNumberInfo(Paragraph para, Dictionary<int, AbstractNumInfo> numbering, Dictionary<int, int[]> counters)
{
    var numPr = para.ParagraphProperties?.NumberingProperties;
    if (numPr?.NumberingId?.Val == null || numPr.NumberingLevelReference?.Val == null)
        return null;

    var numId = numPr.NumberingId.Val.Value;
    var ilvl = numPr.NumberingLevelReference.Val.Value;
    if (!numbering.TryGetValue(numId, out var abs)) return null;

    if (!counters.TryGetValue(numId, out var c))
    {
        c = new int[9];
        counters[numId] = c;
    }

    for (int j = ilvl + 1; j < 9; j++) c[j] = 0;
    c[ilvl]++;

    var fmt = abs.LevelFormats.GetValueOrDefault(ilvl, "%1.");
    var label = abs.FormatLabel(fmt, c, ilvl);
    var isDecimal = abs.IsDecimalLevel(ilvl);
    return new NumberInfo(label, ilvl, isDecimal);
}

static void WriteReferenceReport(List<string> references, StringBuilder report)
{
    report.AppendLine("REVISIÓN DE REFERENCIAS (APA 7)");
    report.AppendLine("================================");
    report.AppendLine();

    if (references.Count == 0)
    {
        report.AppendLine("No se detectaron entradas en la sección Referencias.");
        return;
    }

    int n = 1;
    foreach (var r in references)
    {
        report.AppendLine($"[{n}] {r}");
        report.AppendLine();

        var issues = new List<string>();
        if (!Regex.IsMatch(r, @"\(\d{4}\)"))
            issues.Add("- Falta año entre paréntesis (Autor, A. A. (AAAA).).");
        if (r.Contains("Retrieved from", StringComparison.OrdinalIgnoreCase))
            issues.Add("- APA 7 evita 'Retrieved from'; use URL directa cuando aplique.");
        if (Regex.IsMatch(r, @"\b\d{4}\b") && !Regex.IsMatch(r, @"\(\d{4}\)"))
            issues.Add("- El año debería ir entre paréntesis tras el autor.");
        if (!r.TrimEnd().EndsWith('.') && !r.TrimEnd().EndsWith(')'))
            issues.Add("- La entrada debería terminar con punto.");
        if (r.Length < 40)
            issues.Add("- Entrada muy corta; podría estar incompleta.");

        report.AppendLine(issues.Count > 0 ? "  Observaciones:" : "  Observaciones: Formato general aceptable; verificar orden alfabético y cursivas.");
        foreach (var issue in issues) report.AppendLine("  " + issue);
        report.AppendLine();
        n++;
    }

    report.AppendLine("RECOMENDACIONES APA 7:");
    report.AppendLine("- Orden alfabético por apellido del primer autor.");
    report.AppendLine("- Sangría francesa de 0.5 pulgadas.");
    report.AppendLine("- Títulos de libros/revistas en cursiva.");
    report.AppendLine("- DOI/URL sin punto final tras el enlace.");
}

sealed record NumberInfo(string Label, int Level, bool IsDecimal);

sealed class AbstractNumInfo
{
    public Dictionary<int, string> LevelFormats { get; } = new();
    public Dictionary<int, bool> LevelIsDecimal { get; } = new();

    public AbstractNumInfo(AbstractNum abs)
    {
        foreach (var lvl in abs.Elements<Level>())
        {
            if (lvl.LevelIndex?.Value == null) continue;
            var i = lvl.LevelIndex.Value;
            LevelFormats[i] = lvl.LevelText?.Val ?? "%1.";
            var fmt = lvl.NumberingFormat?.Val;
            LevelIsDecimal[i] = fmt == null || fmt == NumberFormatValues.Decimal;
        }
    }

    public bool IsDecimalLevel(int ilvl) =>
        LevelIsDecimal.GetValueOrDefault(ilvl, true);

    public string FormatLabel(string format, int[] counters, int ilvl)
    {
        var result = format;
        for (int i = 0; i <= ilvl; i++)
            result = result.Replace($"%{i + 1}", counters[i].ToString());
        return result.TrimEnd('.') + ".";
    }
}
