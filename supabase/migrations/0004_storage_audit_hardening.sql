create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid references public.workshops(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  table_name text not null,
  record_id text,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);
create index if not exists idx_audit_logs_workshop on public.audit_logs (workshop_id, created_at desc);

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload_old jsonb;
  payload_new jsonb;
  v_workshop uuid;
  v_record_id text;
begin
  if TG_OP = 'DELETE' then
    payload_old := to_jsonb(old);
    payload_new := null;
    v_workshop := coalesce((payload_old ->> 'workshop_id')::uuid, null);
    v_record_id := payload_old ->> 'id';
  elsif TG_OP = 'INSERT' then
    payload_old := null;
    payload_new := to_jsonb(new);
    v_workshop := coalesce((payload_new ->> 'workshop_id')::uuid, null);
    v_record_id := payload_new ->> 'id';
  else
    payload_old := to_jsonb(old);
    payload_new := to_jsonb(new);
    v_workshop := coalesce((payload_new ->> 'workshop_id')::uuid, (payload_old ->> 'workshop_id')::uuid, null);
    v_record_id := coalesce(payload_new ->> 'id', payload_old ->> 'id');
  end if;

  insert into public.audit_logs (workshop_id, actor_id, table_name, record_id, action, old_data, new_data)
  values (v_workshop, auth.uid(), TG_TABLE_NAME, v_record_id, TG_OP, payload_old, payload_new);

  if TG_OP = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

alter table public.audit_logs enable row level security;

drop policy if exists "Audit logs read by workshop" on public.audit_logs;
create policy "Audit logs read by workshop" on public.audit_logs
for select using (workshop_id = public.current_workshop_id() or public.is_admin_or_supervisor());

drop policy if exists "Audit logs insert authenticated" on public.audit_logs;
create policy "Audit logs insert authenticated" on public.audit_logs
for insert with check (auth.role() in ('authenticated', 'service_role'));

drop trigger if exists trg_audit_work_orders on public.work_orders;
create trigger trg_audit_work_orders
after insert or update or delete on public.work_orders
for each row execute procedure public.audit_row_change();

drop trigger if exists trg_audit_progress on public.work_order_progress;
create trigger trg_audit_progress
after insert or update or delete on public.work_order_progress
for each row execute procedure public.audit_row_change();

drop trigger if exists trg_audit_inventory on public.inventory_items;
create trigger trg_audit_inventory
after insert or update or delete on public.inventory_items
for each row execute procedure public.audit_row_change();

drop trigger if exists trg_audit_schedules on public.schedules;
create trigger trg_audit_schedules
after insert or update or delete on public.schedules
for each row execute procedure public.audit_row_change();

drop trigger if exists trg_audit_attachments on public.attachments;
create trigger trg_audit_attachments
after insert or update or delete on public.attachments
for each row execute procedure public.audit_row_change();

drop trigger if exists trg_audit_workshop_settings on public.workshop_settings;
create trigger trg_audit_workshop_settings
after insert or update or delete on public.workshop_settings
for each row execute procedure public.audit_row_change();

insert into storage.buckets (id, name, public, file_size_limit)
values ('wo-attachments', 'wo-attachments', false, 15728640)
on conflict (id) do nothing;

drop policy if exists "WO Attachments read" on storage.objects;
create policy "WO Attachments read" on storage.objects
for select using (
  bucket_id = 'wo-attachments'
  and (
    split_part(name, '/', 1) = public.current_workshop_id()::text
    or public.is_admin_or_supervisor()
  )
);

drop policy if exists "WO Attachments write" on storage.objects;
create policy "WO Attachments write" on storage.objects
for insert with check (
  bucket_id = 'wo-attachments'
  and split_part(name, '/', 1) = public.current_workshop_id()::text
  and public.current_role() in ('admin', 'supervisor', 'operator')
);

drop policy if exists "WO Attachments update" on storage.objects;
create policy "WO Attachments update" on storage.objects
for update using (
  bucket_id = 'wo-attachments'
  and split_part(name, '/', 1) = public.current_workshop_id()::text
  and public.current_role() in ('admin', 'supervisor', 'operator')
);

drop policy if exists "WO Attachments delete" on storage.objects;
create policy "WO Attachments delete" on storage.objects
for delete using (
  bucket_id = 'wo-attachments'
  and split_part(name, '/', 1) = public.current_workshop_id()::text
  and public.current_role() in ('admin', 'supervisor', 'operator')
);