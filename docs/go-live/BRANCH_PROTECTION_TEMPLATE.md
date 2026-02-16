# Branch Protection Template (Exact)

Target branch: `main`

## GitHub UI exact settings

1. Branch protection rule pattern: `main`
2. Enable:
   - `Require a pull request before merging`
   - `Require approvals` = `1`
   - `Dismiss stale pull request approvals when new commits are pushed`
   - `Require approval of the most recent reviewable push`
   - `Require conversation resolution before merging`
   - `Require status checks to pass before merging`
   - `Require branches to be up to date before merging` (strict mode)
   - Required status checks: `Audit + Typecheck + Build`
   - `Require linear history`
   - `Include administrators`
3. Disable:
   - `Allow force pushes`
   - `Allow deletions`

## Apply via script (recommended)

```powershell
$token = '<GITHUB_TOKEN_WITH_repo_admin>'
$owner = '<ORG_OR_USER>'
$repo = '<REPO_NAME>'

powershell -ExecutionPolicy Bypass -File scripts/go-live/set-branch-protection.ps1 `
  -Owner $owner -Repo $repo -Branch main -Token $token -RequiredCheck 'Audit + Typecheck + Build'
```

## Exact API payload reference

`PUT /repos/{owner}/{repo}/branches/main/protection`

Key fields:
- `required_status_checks.strict = true`
- `required_status_checks.contexts = ["Audit + Typecheck + Build"]`
- `required_pull_request_reviews.required_approving_review_count = 1`
- `required_pull_request_reviews.dismiss_stale_reviews = true`
- `required_pull_request_reviews.require_last_push_approval = true`
- `required_conversation_resolution = true`
- `enforce_admins = true`
- `required_linear_history = true`
- `allow_force_pushes = false`
- `allow_deletions = false`
