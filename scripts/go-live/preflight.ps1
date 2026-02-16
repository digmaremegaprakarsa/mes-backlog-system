param(
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
Write-Host '== Go-Live Preflight ==' -ForegroundColor Cyan

Write-Host '[1/6] Node version' -ForegroundColor Yellow
node -v

Write-Host '[2/6] npm version' -ForegroundColor Yellow
npm -v

Write-Host '[3/6] Security audit' -ForegroundColor Yellow
npm audit --omit=dev

Write-Host '[4/6] Typecheck' -ForegroundColor Yellow
npx tsc -p apps/web/tsconfig.json --noEmit

if (-not $SkipBuild) {
  Write-Host '[5/6] Build (may take several minutes)' -ForegroundColor Yellow
  $env:NEXT_TELEMETRY_DISABLED = '1'
  npm run build
}

Write-Host '[6/6] Supabase migration status' -ForegroundColor Yellow
npx supabase migration list

Write-Host 'Preflight complete.' -ForegroundColor Green