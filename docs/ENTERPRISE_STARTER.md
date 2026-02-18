# MES Enterprise Starter

Starter ini adalah versi production-ready dari MES Backlog System dengan fondasi enterprise untuk tim dan scale.

## Fitur

- Auth multi role (`admin`, `supervisor`, `operator`, `viewer`)
- Realtime updates (Supabase channel)
- Backlog CRUD
- Progress tracking
- Dashboard charts
- Notifications inbox (realtime + mark read)
- File upload attachments
- Role guard (UI guard + RLS guard)
- API layer wrapper (`withApi`, `unwrap`)
- Production structure (services/hooks/lib/components/types/app routes)

## Struktur Utama

- `apps/web/app/*`: routes dan page layer
- `apps/web/services/*`: data access / API layer
- `apps/web/hooks/*`: query, realtime, auth/profile hooks
- `apps/web/lib/*`: auth, roles, guard, constants, errors
- `apps/web/components/*`: UI reusable
- `apps/web/types/*`: domain types
- `supabase/migrations/*`: schema, RLS, hardening

## Alur Auth + Role

1. User login via Supabase Auth di `/login`.
2. Session profile dibaca dari tabel `profiles`.
3. Role guard (`RoleGate`) mengatur akses aksi UI.
4. RLS policy Supabase tetap jadi guard final di database.

## Catatan Deploy

1. Pastikan env Netlify:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Jalankan migration terbaru termasuk:
   - `0005_fix_profiles_rls_recursion.sql`
3. Pastikan setiap user memiliki:
   - `profiles.role`
   - `profiles.workshop_id`
