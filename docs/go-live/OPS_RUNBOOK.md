# Ops Runbook

## Monitoring
1. Pantau error toast pattern dari client.
2. Aktifkan log aggregation di platform deploy (Netlify + Supabase logs).
3. Review `audit_logs` harian untuk anomali write activity.

## Backup
1. Jalankan `scripts/go-live/backup.ps1` sebelum deploy besar.
2. Simpan output SQL di storage terpisah (encrypted).

## Rollback
1. Rollback app:
   - redeploy commit stabil terakhir.
2. Rollback DB:
   - gunakan backup SQL snapshot terakhir.
   - jika perlu rollback migration, lakukan manual SQL reversal dengan maintenance window.

## Release Gate
Go live hanya jika:
- Preflight complete (audit/typecheck/build/migration list)
- Auth+RLS UAT pass
- Critical QA pass
- Backup snapshot tersimpan