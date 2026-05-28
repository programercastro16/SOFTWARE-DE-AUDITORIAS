[CmdletBinding()]
param(
    [string]$DocXmlPath = "c:\Users\Thomas Castro\Desktop\Cursor Project\docs\dev-collab-extract\word\document.xml",
    [string]$OutPath = "c:\Users\Thomas Castro\Desktop\Cursor Project\docs\doc-structure.txt"
)

$wNs = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
[xml]$doc = Get-Content -LiteralPath $DocXmlPath -Encoding UTF8
$nsm = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
[void]$nsm.AddNamespace("w", $wNs)
$body = $doc.document.body

$sb = New-Object System.Text.StringBuilder
$numStack = @{}  # numId -> counters per level

function Get-TextFromNode($node, $mgr) {
    $parts = @()
    foreach ($t in $node.SelectNodes(".//w:t", $mgr)) {
        if ($t.'#text') { $parts += $t.'#text' }
    }
    return ($parts -join "")
}

function Get-NumLabel($p, $mgr) {
    $numPr = $p.SelectSingleNode("w:pPr/w:numPr", $mgr)
    if (-not $numPr) { return $null }
    $ilvl = [int]($numPr.SelectSingleNode("w:ilvl", $mgr).w_val)
    $numId = $numPr.SelectSingleNode("w:numId", $mgr).w_val
    if (-not $numStack.ContainsKey($numId)) {
        $numStack[$numId] = @(0) * 9
    }
    $counters = $numStack[$numId]
    for ($i = $ilvl + 1; $i -lt 9; $i++) { $counters[$i] = 0 }
    $counters[$ilvl]++
    $numStack[$numId] = $counters
    $parts = @()
    for ($i = 0; $i -le $ilvl; $i++) {
        if ($counters[$i] -gt 0) { $parts += $counters[$i] }
    }
    return ($parts -join ".") + "."
}

$paraIndex = 0
foreach ($p in $body.SelectNodes("w:p", $nsm)) {
    $paraIndex++
    $text = (Get-TextFromNode $p $nsm).Trim()
    if ([string]::IsNullOrWhiteSpace($text)) { continue }

    $style = $p.SelectSingleNode("w:pPr/w:pStyle", $nsm)
    $styleVal = if ($style) { $style.w_val } else { "" }
    $numLabel = Get-NumLabel $p $nsm
    $hasDrawing = $null -ne $p.SelectSingleNode(".//w:drawing", $nsm)

    $isHeading = $styleVal -match "Heading|Title|T[íi]tulo|titulo" -or
        ($numLabel -and $text.Length -lt 120 -and $text -notmatch "^\s*[\(\[]")

    if ($isHeading -or $numLabel -or $text -match "^(REFERENCI|BIBLIOGR|ÍNDICE|INDICE|Figura|Tabla)\b" -or $hasDrawing) {
        $prefix = if ($numLabel) { $numLabel } else { "   " }
        [void]$sb.AppendLine("P$paraIndex | $prefix | style=$styleVal | draw=$hasDrawing | $text")
    }
}

$sb.ToString() | Set-Content -LiteralPath $OutPath -Encoding UTF8
Write-Host "Wrote $($sb.Length) chars to $OutPath"
