# Auth + RLS UAT Script

1. Buat 3 akun:
   - admin
   - supervisor
   - operator
2. Set `profiles.role` dan `profiles.workshop_id` untuk masing-masing user.
3. Login sebagai `operator` workshop A:
   - pastikan hanya data workshop A terlihat
   - upload attachment berhasil ke prefix `workshop_id/wo_id/...`
4. Login sebagai `operator` workshop B:
   - pastikan data workshop A tidak terlihat
5. Login sebagai `supervisor`:
   - pastikan bisa CRUD schedule/inventory sesuai policy
6. Login sebagai `admin`:
   - pastikan bisa akses lintas workshop
7. Verifikasi `audit_logs` bertambah untuk setiap aksi CRUD.

Pass criteria:
- Tidak ada akses lintas workshop untuk non-admin.
- Semua aksi CRUD tercatat di audit log.
- Upload/download attachment sesuai policy storage.