param(
  [string]$ChecklistPath = 'docs/go-live/GO_LIVE_CHECKLIST.md',
  [string]$ReportPath = 'docs/go-live/reports/AUTH_RLS_UAT_REPORT.md'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $ChecklistPath)) {
  throw "Checklist not found: $ChecklistPath"
}

if (-not (Test-Path $ReportPath)) {
  throw "Auth/RLS report not found: $ReportPath"
}

$report = Get-Content -Raw -Path $ReportPath
if ($report -notmatch '(?m)^FINAL RESULT:\s*PASS\s*$') {
  throw "Report is not PASS. Update $ReportPath with 'FINAL RESULT: PASS' after UAT."
}

$content = Get-Content -Raw -Path $ChecklistPath
$replacement = @"
## 3. Auth + role flow validation
- Status: CLOSED
- Evidence:
  - Auth + RLS UAT PASS (`$ReportPath`).
  - Non-admin terisolasi per workshop dan audit log tercatat.

"@
$content = [regex]::Replace($content, '## 3\. Auth \+ role flow validation[\s\S]*?(?=## 4\.)', $replacement)

[System.IO.File]::WriteAllText($ChecklistPath, $content, (New-Object System.Text.UTF8Encoding($false)))
Write-Host 'Checklist point #3 marked CLOSED.' -ForegroundColor Green
