# Go-Live Checklist (Execution)

Tanggal evaluasi: 2026-02-16

## 1. Security dependencies
- Status: CLOSED
- Evidence:
  - `npm audit` -> 0 vulnerabilities
  - Next upgraded ke `15.5.10`

## 2. Build/deploy validation
- Status: IN PROGRESS (CI GATE ENABLED)
- Evidence:
  - Typecheck lulus: `npx tsc -p apps/web/tsconfig.json --noEmit`
  - Workflow gate dibuat: `.github/workflows/ci-gate.yml` (Node 20, audit+typecheck+build)
  - Runtime build command di environment ini timeout tanpa output.
- Action required:
  - Jalankan script `scripts/go-live/run-ci-gate.ps1` untuk dispatch + monitor run sampai hijau.
  - Terapkan branch protection via `scripts/go-live/set-branch-protection.ps1`.
  - Setelah keduanya sukses, jalankan `scripts/go-live/close-build-checkpoint.ps1`.
  - Template exact branch protection: `docs/go-live/BRANCH_PROTECTION_TEMPLATE.md`.

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
