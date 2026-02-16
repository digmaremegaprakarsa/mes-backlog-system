param(
  [Parameter(Mandatory = $true)] [string]$Owner,
  [Parameter(Mandatory = $true)] [string]$Repo,
  [string]$Branch = 'main',
  [Parameter(Mandatory = $true)] [string]$Token,
  [string]$RequiredCheck = 'Audit + Typecheck + Build',
  [ValidateRange(0, 6)] [int]$RequiredApprovals = 1,
  [ValidateSet(0,1)] [int]$RequireLastPushApproval = 1
)

$ErrorActionPreference = 'Stop'

$headers = @{
  Authorization = "Bearer $Token"
  Accept = 'application/vnd.github+json'
  'X-GitHub-Api-Version' = '2022-11-28'
}

$uri = "https://api.github.com/repos/$Owner/$Repo/branches/$Branch/protection"
$body = @{
  required_status_checks = @{
    strict = $true
    contexts = @($RequiredCheck)
  }
  enforce_admins = $true
  required_pull_request_reviews = @{
    dismiss_stale_reviews = $true
    require_code_owner_reviews = $false
    required_approving_review_count = $RequiredApprovals
    require_last_push_approval = [bool]$RequireLastPushApproval
  }
  restrictions = $null
  required_linear_history = $true
  allow_force_pushes = $false
  allow_deletions = $false
  block_creations = $false
  required_conversation_resolution = $true
  lock_branch = $false
  allow_fork_syncing = $true
}

Write-Host ("Applying branch protection to {0}/{1}:{2} ..." -f $Owner, $Repo, $Branch) -ForegroundColor Yellow
Invoke-RestMethod -Method Put -Uri $uri -Headers $headers -Body ($body | ConvertTo-Json -Depth 10) -ContentType 'application/json' | Out-Null
Write-Host 'Branch protection applied.' -ForegroundColor Green
