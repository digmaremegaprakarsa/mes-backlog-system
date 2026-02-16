param(
  [string]$ChecklistPath = 'docs/go-live/GO_LIVE_CHECKLIST.md'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $ChecklistPath)) {
  throw "Checklist not found: $ChecklistPath"
}

$content = Get-Content -Raw -Path $ChecklistPath
$replacement = @"
## 2. Build/deploy validation
- Status: CLOSED
- Evidence:
  - CI Gate run hijau (Node 20, audit+typecheck+build).
  - Branch protection active dengan required check `Audit + Typecheck + Build`.

"@
$content = [regex]::Replace($content, '## 2\. Build/deploy validation[\s\S]*?(?=## 3\.)', $replacement)

[System.IO.File]::WriteAllText($ChecklistPath, $content, (New-Object System.Text.UTF8Encoding($false)))
Write-Host 'Checklist point #2 marked CLOSED.' -ForegroundColor Green
