param(
  [Parameter(Mandatory = $true)] [string]$Owner,
  [Parameter(Mandatory = $true)] [string]$Repo,
  [Parameter(Mandatory = $true)] [string]$Token,
  [string]$Workflow = 'ci-gate.yml',
  [string]$Ref = 'main',
  [int]$PollSeconds = 15,
  [int]$TimeoutMinutes = 25
)

$ErrorActionPreference = 'Stop'

$headers = @{
  Authorization = "Bearer $Token"
  Accept = 'application/vnd.github+json'
  'X-GitHub-Api-Version' = '2022-11-28'
}

$dispatchUri = "https://api.github.com/repos/$Owner/$Repo/actions/workflows/$Workflow/dispatches"
$dispatchBody = @{ ref = $Ref }

Write-Host "Dispatching workflow $Workflow on $Ref ..." -ForegroundColor Yellow
Invoke-RestMethod -Method Post -Uri $dispatchUri -Headers $headers -Body ($dispatchBody | ConvertTo-Json) -ContentType 'application/json'

$deadline = (Get-Date).AddMinutes($TimeoutMinutes)
$runId = $null

while ((Get-Date) -lt $deadline -and -not $runId) {
  Start-Sleep -Seconds $PollSeconds
  $runsUri = "https://api.github.com/repos/$Owner/$Repo/actions/workflows/$Workflow/runs?branch=$Ref&event=workflow_dispatch&per_page=1"
  $runs = Invoke-RestMethod -Method Get -Uri $runsUri -Headers $headers
  if ($runs.workflow_runs.Count -gt 0) {
    $runId = $runs.workflow_runs[0].id
    $runUrl = $runs.workflow_runs[0].html_url
    Write-Host "Run detected: $runId" -ForegroundColor Cyan
    Write-Host "URL: $runUrl"
  }
}

if (-not $runId) { throw 'No workflow run detected before timeout.' }

while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds $PollSeconds
  $runUri = "https://api.github.com/repos/$Owner/$Repo/actions/runs/$runId"
  $run = Invoke-RestMethod -Method Get -Uri $runUri -Headers $headers
  Write-Host ("Status: {0} | Conclusion: {1}" -f $run.status, $run.conclusion)
  if ($run.status -eq 'completed') {
    if ($run.conclusion -eq 'success') {
      Write-Host 'Workflow completed successfully.' -ForegroundColor Green
      exit 0
    }
    throw "Workflow failed with conclusion: $($run.conclusion). URL: $($run.html_url)"
  }
}

throw 'Workflow polling timed out.'