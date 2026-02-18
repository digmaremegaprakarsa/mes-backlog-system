# MES Backlog System

Starter repo production-ready untuk Backlog Tracker Produksi Bengkel (MES Lite) dengan Next.js + Supabase + Netlify.

## Included

- Multi role auth foundation
- Realtime-ready hooks
- Backlog / Progress / Inventory / Scheduling CRUD
- Server-side pagination + optimistic UI updates + global retry/toast error handling
- Dashboard + analytics starter
- Upload attachment ke Supabase Storage (`wo-attachments`) + preview image/pdf
- Notifications service
- Role guard + middleware
- Audit logs per aksi CRUD + filter + export CSV
- Supabase RLS policies
- Go-live runbook + preflight scripts

## Setup

1. `npm install`
2. Copy `.env.example` ke `.env`
3. Isi kredensial Supabase
4. Jalankan migration SQL di Supabase:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_full_mes_rls.sql`
   - `supabase/migrations/0003_seed_data.sql`
   - `supabase/migrations/0004_storage_audit_hardening.sql`
   - `supabase/migrations/0005_fix_profiles_rls_recursion.sql`
5. `npm run dev`

## Deploy (Netlify)

1. Push ke GitHub
2. Connect repo ke Netlify
3. Set env:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Notes

- RLS policies mengandalkan `profiles.role` dan `profiles.workshop_id`.
- Trigger `handle_new_user` otomatis membuat profile saat user baru masuk ke `auth.users`.
- Default workshop id untuk starter CRUD: `11111111-1111-1111-1111-111111111111`.
- Runtime target: Node 20 (`.nvmrc`, `package.json engines`, `netlify.toml`).

## Enterprise Starter

- Detail versi enterprise starter: `docs/ENTERPRISE_STARTER.md`

## Go-Live

1. Jalankan preflight: `powershell -ExecutionPolicy Bypass -File scripts/go-live/preflight.ps1`
2. Ikuti checklist: `docs/go-live/GO_LIVE_CHECKLIST.md`
3. Jalankan UAT auth/RLS: `docs/go-live/AUTH_RLS_UAT.md`
4. Jalankan critical QA: `docs/go-live/QA_SCENARIOS.md`
5. Jalankan ops runbook: `docs/go-live/OPS_RUNBOOK.md`
6. Aktifkan branch protection dengan required check:
   - `Audit + Typecheck + Build`
7. Gunakan template exact:
   - `docs/go-live/BRANCH_PROTECTION_TEMPLATE.md`
