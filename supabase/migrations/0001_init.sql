create extension if not exists "pgcrypto";

create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  wo_number text not null,
  customer_name text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.work_order_progress (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  stage text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  part_number text not null,
  part_name text not null,
  stock integer not null default 0,
  updated_at timestamptz not null default now()
);