create extension if not exists "pgcrypto";

create type public.app_role as enum ('admin', 'supervisor', 'operator', 'viewer');

create table if not exists public.workshops (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'viewer',
  workshop_id uuid references public.workshops(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.work_orders
  add column if not exists workshop_id uuid references public.workshops(id) on delete set null,
  add column if not exists description text,
  add column if not exists due_date date,
  add column if not exists priority text not null default 'normal',
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  work_order_id uuid references public.work_orders(id) on delete set null,
  station text not null,
  planned_start timestamptz not null,
  planned_end timestamptz not null,
  status text not null default 'planned',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  work_order_id uuid references public.work_orders(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  file_name text not null,
  file_path text not null,
  content_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  work_order_id uuid references public.work_orders(id) on delete set null,
  movement_type text not null check (movement_type in ('in','out','adjustment')),
  qty integer not null,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.workshop_settings (
  workshop_id uuid primary key references public.workshops(id) on delete cascade,
  timezone text not null default 'Asia/Jakarta',
  workday_start time not null default '08:00',
  workday_end time not null default '17:00',
  sla_hours integer not null default 24,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inventory_items
  add column if not exists workshop_id uuid references public.workshops(id) on delete set null,
  add column if not exists minimum_stock integer not null default 0;

alter table public.work_order_progress
  add column if not exists workshop_id uuid references public.workshops(id) on delete set null,
  add column if not exists note text,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null,
  add column if not exists created_at timestamptz not null default now();

alter table public.notifications
  add column if not exists workshop_id uuid references public.workshops(id) on delete set null,
  add column if not exists kind text not null default 'general',
  add column if not exists action_url text;

create index if not exists idx_work_orders_workshop_status on public.work_orders (workshop_id, status);
create index if not exists idx_progress_work_order on public.work_order_progress (work_order_id, updated_at desc);
create index if not exists idx_inventory_workshop on public.inventory_items (workshop_id, stock);
create index if not exists idx_schedule_workshop on public.schedules (workshop_id, planned_start);
create index if not exists idx_notifications_user on public.notifications (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.current_role()
returns public.app_role
language sql
stable
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'viewer'::public.app_role);
$$;

create or replace function public.current_workshop_id()
returns uuid
language sql
stable
as $$
  select workshop_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin_or_supervisor()
returns boolean
language sql
stable
as $$
  select public.current_role() in ('admin'::public.app_role, 'supervisor'::public.app_role);
$$;

alter table public.workshops enable row level security;
alter table public.profiles enable row level security;
alter table public.work_orders enable row level security;
alter table public.work_order_progress enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.schedules enable row level security;
alter table public.notifications enable row level security;
alter table public.attachments enable row level security;
alter table public.workshop_settings enable row level security;

drop policy if exists "Profiles self read" on public.profiles;
create policy "Profiles self read" on public.profiles
for select using (id = auth.uid() or public.is_admin_or_supervisor());

drop policy if exists "Profiles self update" on public.profiles;
create policy "Profiles self update" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Profiles admin insert" on public.profiles;
create policy "Profiles admin insert" on public.profiles
for insert with check (public.current_role() = 'admin');

drop policy if exists "Workshops read by membership" on public.workshops;
create policy "Workshops read by membership" on public.workshops
for select using (id = public.current_workshop_id() or public.is_admin_or_supervisor());

drop policy if exists "Workshops write admin" on public.workshops;
create policy "Workshops write admin" on public.workshops
for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

drop policy if exists "Work orders read by workshop" on public.work_orders;
create policy "Work orders read by workshop" on public.work_orders
for select using (workshop_id = public.current_workshop_id() or public.is_admin_or_supervisor());

drop policy if exists "Work orders write operator+" on public.work_orders;
create policy "Work orders write operator+" on public.work_orders
for all using (
  workshop_id = public.current_workshop_id() and public.current_role() in ('admin','supervisor','operator')
) with check (
  workshop_id = public.current_workshop_id() and public.current_role() in ('admin','supervisor','operator')
);

drop policy if exists "Progress read by workshop" on public.work_order_progress;
create policy "Progress read by workshop" on public.work_order_progress
for select using (workshop_id = public.current_workshop_id() or public.is_admin_or_supervisor());

drop policy if exists "Progress write operator+" on public.work_order_progress;
create policy "Progress write operator+" on public.work_order_progress
for all using (
  workshop_id = public.current_workshop_id() and public.current_role() in ('admin','supervisor','operator')
) with check (
  workshop_id = public.current_workshop_id() and public.current_role() in ('admin','supervisor','operator')
);

drop policy if exists "Inventory read by workshop" on public.inventory_items;
create policy "Inventory read by workshop" on public.inventory_items
for select using (workshop_id = public.current_workshop_id() or public.is_admin_or_supervisor());

drop policy if exists "Inventory write supervisor+" on public.inventory_items;
create policy "Inventory write supervisor+" on public.inventory_items
for all using (
  workshop_id = public.current_workshop_id() and public.current_role() in ('admin','supervisor')
) with check (
  workshop_id = public.current_workshop_id() and public.current_role() in ('admin','supervisor')
);

drop policy if exists "Inventory movement read" on public.inventory_movements;
create policy "Inventory movement read" on public.inventory_movements
for select using (workshop_id = public.current_workshop_id() or public.is_admin_or_supervisor());

drop policy if exists "Inventory movement write operator+" on public.inventory_movements;
create policy "Inventory movement write operator+" on public.inventory_movements
for all using (
  workshop_id = public.current_workshop_id() and public.current_role() in ('admin','supervisor','operator')
) with check (
  workshop_id = public.current_workshop_id() and public.current_role() in ('admin','supervisor','operator')
);

drop policy if exists "Schedules read by workshop" on public.schedules;
create policy "Schedules read by workshop" on public.schedules
for select using (workshop_id = public.current_workshop_id() or public.is_admin_or_supervisor());

drop policy if exists "Schedules write supervisor+" on public.schedules;
create policy "Schedules write supervisor+" on public.schedules
for all using (
  workshop_id = public.current_workshop_id() and public.current_role() in ('admin','supervisor')
) with check (
  workshop_id = public.current_workshop_id() and public.current_role() in ('admin','supervisor')
);

drop policy if exists "Notifications read own" on public.notifications;
create policy "Notifications read own" on public.notifications
for select using (user_id = auth.uid() or public.is_admin_or_supervisor());

drop policy if exists "Notifications write system" on public.notifications;
create policy "Notifications write system" on public.notifications
for all using (public.current_role() in ('admin','supervisor','operator'))
with check (public.current_role() in ('admin','supervisor','operator'));

drop policy if exists "Attachments read by workshop" on public.attachments;
create policy "Attachments read by workshop" on public.attachments
for select using (workshop_id = public.current_workshop_id() or public.is_admin_or_supervisor());

drop policy if exists "Attachments write operator+" on public.attachments;
create policy "Attachments write operator+" on public.attachments
for all using (
  workshop_id = public.current_workshop_id() and public.current_role() in ('admin','supervisor','operator')
) with check (
  workshop_id = public.current_workshop_id() and public.current_role() in ('admin','supervisor','operator')
);

drop policy if exists "Settings read by workshop" on public.workshop_settings;
create policy "Settings read by workshop" on public.workshop_settings
for select using (workshop_id = public.current_workshop_id() or public.is_admin_or_supervisor());

drop policy if exists "Settings write supervisor+" on public.workshop_settings;
create policy "Settings write supervisor+" on public.workshop_settings
for all using (
  workshop_id = public.current_workshop_id() and public.current_role() in ('admin','supervisor')
) with check (
  workshop_id = public.current_workshop_id() and public.current_role() in ('admin','supervisor')
);

drop trigger if exists trg_workshops_updated_at on public.workshops;
create trigger trg_workshops_updated_at
before update on public.workshops
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_work_orders_updated_at on public.work_orders;
create trigger trg_work_orders_updated_at
before update on public.work_orders
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_schedules_updated_at on public.schedules;
create trigger trg_schedules_updated_at
before update on public.schedules
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_workshop_settings_updated_at on public.workshop_settings;
create trigger trg_workshop_settings_updated_at
before update on public.workshop_settings
for each row execute procedure public.set_updated_at();
