# AUTH + RLS UAT REPORT

Date: YYYY-MM-DD  
Environment: (staging/production-like)  
Tester: (name)

## Accounts tested
- admin: PASS/FAIL
- supervisor: PASS/FAIL
- operator workshop A: PASS/FAIL
- operator workshop B: PASS/FAIL

## Scenario results
1. Operator workshop A hanya lihat data workshop A: PASS/FAIL
2. Operator workshop B tidak bisa lihat data workshop A: PASS/FAIL
3. Supervisor bisa CRUD sesuai policy: PASS/FAIL
4. Admin akses lintas workshop: PASS/FAIL
5. Upload/download attachment sesuai policy storage: PASS/FAIL
6. Audit log tercatat setiap aksi CRUD: PASS/FAIL

## Defects
- (id/severity/summary) or `None`

## Notes
- (optional)

FINAL RESULT: PASS/FAIL
