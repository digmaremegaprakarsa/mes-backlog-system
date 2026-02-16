# Critical QA Scenarios

## Backlog
1. Create WO, edit WO, delete WO (optimistic UI tetap konsisten).
2. Pagination: pindah halaman, kembali halaman, data tetap benar.
3. Filter search + status menghasilkan total count benar.

## Attachments
1. Upload image, preview modal fullscreen, pinch/drag/double-tap zoom.
2. Upload PDF, preview fullscreen + zoom controls.
3. Delete attachment menghapus storage object + row DB.

## Progress / Inventory / Scheduling
1. CRUD + optimistic update tidak meninggalkan ghost row.
2. Pagination count sinkron setelah create/delete.

## Settings / Audit
1. Save settings sukses.
2. Filter audit (table/action/date) menghasilkan subset benar.
3. Export CSV berisi data sesuai filter.

Pass criteria:
- Tidak ada crash, toast error tidak muncul untuk flow normal.
- State UI konsisten setelah refresh.