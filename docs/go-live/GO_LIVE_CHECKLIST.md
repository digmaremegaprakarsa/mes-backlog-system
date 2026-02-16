# Go-Live Checklist (Execution)

Tanggal evaluasi: 2026-02-16

## 1. Security dependencies
- Status: CLOSED
- Evidence:
  - `npm audit` -> 0 vulnerabilities
  - Next upgraded ke `15.5.10`

## 2. Build/deploy validation
- Status: CLOSED
- Evidence:
  - CI Gate run hijau (Node 20, audit+typecheck+build).
  - Branch protection active dengan required check Audit + Typecheck + Build.
## 3. Auth + role flow validation
- Status: READY FOR UAT
- Implemented:
  - RLS policies applied (`0002`)
  - workshop resolution by `profiles.workshop_id`
- Action required:
  - Eksekusi `docs/go-live/AUTH_RLS_UAT.md`
  - Simpan report PASS ke `docs/go-live/reports/AUTH_RLS_UAT_REPORT.md` (dari template `.template.md`)
  - Jalankan `scripts/go-live/close-auth-rls-checkpoint.ps1`

## 4. Critical QA scenarios
- Status: READY FOR EXECUTION
- Action required:
  - Eksekusi `docs/go-live/QA_SCENARIOS.md`
  - Simpan report PASS ke `docs/go-live/reports/QA_SCENARIOS_REPORT.md` (dari template `.template.md`)
  - Jalankan `scripts/go-live/close-qa-checkpoint.ps1`

## 5. Operations (monitoring, backup, rollback)
- Status: READY FOR EXECUTION
- Implemented:
  - Global error toast + retry strategy
  - Audit logs + export CSV
  - Backup script: `scripts/go-live/backup.ps1`
- Action required:
  - Eksekusi `docs/go-live/OPS_RUNBOOK.md`
