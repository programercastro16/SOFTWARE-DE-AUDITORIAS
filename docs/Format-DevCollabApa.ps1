#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$source = "c:\Users\Thomas Castro\Downloads\DEV COLLAB TRABAJO FINAL.docx"
$output = "c:\Users\Thomas Castro\Downloads\DEV COLLAB TRABAJO FINAL - APA.docx"
$logPath = "c:\Users\Thomas Castro\Desktop\Cursor Project\docs\format-log.txt"

function Write-Log([string]$msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format "HH:mm:ss"), $msg
    Add-Content -LiteralPath $logPath -Value $line -Encoding UTF8
    Write-Host $line
}

if (Test-Path $logPath) { Remove-Item $logPath -Force }

try {
    Write-Log "Starting Word..."
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0

    Write-Log "Opening document..."
    $doc = $word.Documents.Open($source, $false, $false)

    # --- APA page setup (student paper defaults) ---
    Write-Log "Applying page setup..."
  foreach ($sec in $doc.Sections) {
        $ps = $sec.PageSetup
        $ps.TopMargin = $word.CentimetersToPoints(2.54)
        $ps.BottomMargin = $word.CentimetersToPoints(2.54)
        $ps.LeftMargin = $word.CentimetersToPoints(2.54)
        $ps.RightMargin = $word.CentimetersToPoints(2.54)
    }

    # Default font Times New Roman 12, double space, first-line indent 0.5"
    Write-Log "Applying Normal style..."
    $normal = $doc.Styles.Item("Normal")
    $normal.Font.Name = "Times New Roman"
    $normal.Font.Size = 12
    $normal.ParagraphFormat.LineSpacingRule = 1  # wdLineSpaceDouble
    $normal.ParagraphFormat.LineSpacing = 24
    $normal.ParagraphFormat.SpaceAfter = 0
    $normal.ParagraphFormat.SpaceBefore = 0
    $normal.ParagraphFormat.FirstLineIndent = $word.InchesToPoints(0.5)

    # Body paragraphs (not headings / lists with numbers)
    Write-Log "Formatting body paragraphs..."
    foreach ($p in $doc.Paragraphs) {
        $styleName = $p.Range.Style.NameLocal
        if ($styleName -match "Heading|Título|Title|TOC") { continue }
        if ($p.Range.ListFormat.ListType -ne 0) { continue } # numbered/bulleted handled separately
        if ($p.Range.Tables.Count -gt 0) { continue }
        if ($p.Range.InlineShapes.Count -gt 0 -and $p.Range.Text.Trim().Length -lt 3) { continue }

        $p.Range.Font.Name = "Times New Roman"
        $p.Range.Font.Size = 12
        if ($p.Range.Text.Trim().Length -gt 0) {
            $p.Format.LineSpacingRule = 1
            $p.Format.LineSpacing = 24
        }
    }

    # Headings with list numbering: bold, same font, keep list
    Write-Log "Formatting numbered headings..."
    foreach ($p in $doc.Paragraphs) {
        if ($p.Range.ListFormat.ListType -eq 0) { continue }
        $lvl = $p.Range.ListFormat.ListLevelNumber
        if ($lvl -le 2) {
            $p.Range.Font.Name = "Times New Roman"
            $p.Range.Font.Bold = $true
            $p.Range.Font.Size = if ($lvl -eq 1) { 12 } else { 12 }
            $p.Format.SpaceBefore = if ($lvl -eq 1) { 12 } else { 6 }
            $p.Format.SpaceAfter = 6
            $p.Format.LineSpacingRule = 1
            $p.Format.LineSpacing = 24
            $p.Format.FirstLineIndent = 0
        }
    }

    # Figures: center, add note style if caption exists
    Write-Log "Centering inline shapes / images..."
    foreach ($shape in $doc.InlineShapes) {
        $shape.Range.ParagraphFormat.Alignment = 1 # center
    }

    # Build manual TOC from numbered headings (levels 1-2)
    Write-Log "Building table of contents..."
    $tocEntries = New-Object System.Collections.Generic.List[object]
    foreach ($p in $doc.Paragraphs) {
        if ($p.Range.ListFormat.ListType -eq 0) { continue }
        $lvl = $p.Range.ListFormat.ListLevelNumber
        if ($lvl -gt 2) { continue }
        $text = $p.Range.ListFormat.ListString + " " + ($p.Range.Text -replace "[\r\n]+$", "").Trim()
        if ($text.Length -lt 4) { continue }
        $tocEntries.Add([pscustomobject]@{ Level = $lvl; Text = $text; Range = $p.Range.Duplicate })
    }

    # Insert TOC after title block: find first numbered section or paragraph 1.
    $insertRange = $null
    foreach ($p in $doc.Paragraphs) {
        if ($p.Range.ListFormat.ListString -match "^\s*1[\.\)]") {
            $insertRange = $p.Range.Duplicate
            break
        }
    }
    if (-not $insertRange) {
        $insertRange = $doc.Paragraphs.Item(1).Range.Duplicate
    }
    $insertRange.Collapse(1) # wdCollapseStart

    $tocRange = $insertRange.Duplicate
    $tocRange.InsertBreak(7) | Out-Null # page break before content optional - skip
    $tocRange.Text = ""
    $tocRange.InsertBefore("ÍNDICE`r`r")
    $tocRange.Paragraphs.Item(1).Range.Font.Bold = $true
    $tocRange.Paragraphs.Item(1).Range.Font.Name = "Times New Roman"
    $tocRange.Paragraphs.Item(1).Range.Font.Size = 12
    $tocRange.Paragraphs.Item(1).Range.ParagraphFormat.Alignment = 1
    $tocRange.Paragraphs.Item(1).Range.ParagraphFormat.SpaceAfter = 12

    $cursor = $tocRange.Paragraphs.Last.Range.Duplicate
    $cursor.Collapse(0)
    foreach ($entry in $tocEntries) {
        $indent = if ($entry.Level -eq 1) { 0 } else { $word.CentimetersToPoints(1) }
        $line = $entry.Text
        $cursor.InsertAfter($line + "`r")
        $para = $cursor.Paragraphs.Last
        $para.Range.Font.Name = "Times New Roman"
        $para.Range.Font.Size = 12
        $para.Format.LeftIndent = $indent
        $para.Format.LineSpacingRule = 1
        $para.Format.LineSpacing = 24
        $cursor = $para.Range.Duplicate
        $cursor.Collapse(0)
    }
    $cursor.InsertBreak(7) | Out-Null # page break after TOC

    # References section heading
    Write-Log "Formatting references..."
    foreach ($p in $doc.Paragraphs) {
        $t = $p.Range.Text.Trim()
        if ($t -match "^(REFERENCIAS|Referencias|BIBLIOGRAFÍA|Bibliografía)\s*$") {
            $p.Range.Font.Name = "Times New Roman"
            $p.Range.Font.Size = 12
            $p.Range.Font.Bold = $true
            $p.Range.ParagraphFormat.Alignment = 1
            $p.Format.PageBreakBefore = 1
        }
    }

    # Hanging indent for reference list (heuristic: after Referencias heading)
    $inRefs = $false
    foreach ($p in $doc.Paragraphs) {
        $t = $p.Range.Text.Trim()
        if ($t -match "^(REFERENCIAS|Referencias|BIBLIOGRAFÍA|Bibliografía)\s*$") {
            $inRefs = $true
            continue
        }
        if ($inRefs -and $t.Length -gt 20) {
            $p.Format.LeftIndent = 0
            $p.Format.FirstLineIndent = $word.CentimetersToPoints(-1.27) # hanging 0.5"
            $p.Range.Font.Name = "Times New Roman"
            $p.Range.Font.Size = 12
            $p.Format.LineSpacingRule = 1
            $p.Format.LineSpacing = 24
        }
    }

    Write-Log "Saving to $output"
    if (Test-Path $output) { Remove-Item $output -Force }
    $doc.SaveAs2([ref]$output, 16) # wdFormatXMLDocument
    $doc.Close($false)
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) | Out-Null
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    [GC]::Collect()
    Write-Log "Done."
}
catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    throw
}
