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
- Status: CLOSED
- Evidence:
  - Auth + RLS UAT PASS ($ReportPath).
  - Non-admin terisolasi per workshop dan audit log tercatat.
## 4. Critical QA scenarios
- Status: CLOSED
- Evidence:
  - Critical QA PASS ($ReportPath).
  - Attachment preview/zoom, pagination, optimistic updates, dan audit filter/export tervalidasi.
## 5. Operations (monitoring, backup, rollback)
- Status: READY FOR EXECUTION
- Implemented:
  - Global error toast + retry strategy
  - Audit logs + export CSV
  - Backup script: `scripts/go-live/backup.ps1`
- Action required:
  - Eksekusi `docs/go-live/OPS_RUNBOOK.md`
