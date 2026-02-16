param(
  [string]$ChecklistPath = 'docs/go-live/GO_LIVE_CHECKLIST.md',
  [string]$ReportPath = 'docs/go-live/reports/QA_SCENARIOS_REPORT.md'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $ChecklistPath)) {
  throw "Checklist not found: $ChecklistPath"
}

if (-not (Test-Path $ReportPath)) {
  throw "QA report not found: $ReportPath"
}

$report = Get-Content -Raw -Path $ReportPath
if ($report -notmatch '(?m)^FINAL RESULT:\s*PASS\s*$') {
  throw "Report is not PASS. Update $ReportPath with 'FINAL RESULT: PASS' after QA."
}

$content = Get-Content -Raw -Path $ChecklistPath
$replacement = @"
## 4. Critical QA scenarios
- Status: CLOSED
- Evidence:
  - Critical QA PASS (`$ReportPath`).
  - Attachment preview/zoom, pagination, optimistic updates, dan audit filter/export tervalidasi.

"@
$content = [regex]::Replace($content, '## 4\. Critical QA scenarios[\s\S]*?(?=## 5\.)', $replacement)

[System.IO.File]::WriteAllText($ChecklistPath, $content, (New-Object System.Text.UTF8Encoding($false)))
Write-Host 'Checklist point #4 marked CLOSED.' -ForegroundColor Green
