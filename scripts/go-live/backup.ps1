param(
  [string]$OutputDir = 'backups'
)

$ErrorActionPreference = 'Stop'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$dir = Join-Path $PSScriptRoot "..\..\$OutputDir"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$schemaFile = Join-Path $dir "schema-$timestamp.sql"
$dataFile = Join-Path $dir "data-$timestamp.sql"

Write-Host "Export schema -> $schemaFile"
npx supabase db dump --linked --schema public --file $schemaFile

Write-Host "Export data -> $dataFile"
npx supabase db dump --linked --data-only --schema public --file $dataFile

Write-Host 'Backup completed.' -ForegroundColor Green