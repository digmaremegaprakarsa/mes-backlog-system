insert into public.workshops (id, code, name)
values
  ('11111111-1111-1111-1111-111111111111', 'WKS-01', 'Bengkel Pusat')
on conflict (id) do nothing;

insert into public.work_orders (wo_number, customer_name, status, workshop_id, description, priority)
values
  ('WO-2026-0001', 'PT Maju Jaya', 'pending', '11111111-1111-1111-1111-111111111111', 'Overhaul engine', 'high'),
  ('WO-2026-0002', 'CV Sinar Teknik', 'in_progress', '11111111-1111-1111-1111-111111111111', 'Brake system replacement', 'normal'),
  ('WO-2026-0003', 'PT Baja Utama', 'completed', '11111111-1111-1111-1111-111111111111', 'Inspection and calibration', 'low')
on conflict do nothing;

insert into public.inventory_items (part_number, part_name, stock, minimum_stock, workshop_id)
values
  ('BRK-PAD-001', 'Brake Pad', 50, 10, '11111111-1111-1111-1111-111111111111'),
  ('FLT-OIL-002', 'Oil Filter', 30, 8, '11111111-1111-1111-1111-111111111111')
on conflict do nothing;
