-- Fix recursive RLS evaluation on public.profiles that can cause:
-- "stack depth limit exceeded"

create or replace function public.current_role()
returns public.app_role
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role public.app_role;
begin
  select p.role into v_role
  from public.profiles p
  where p.id = auth.uid();

  return coalesce(v_role, 'viewer'::public.app_role);
end;
$$;

create or replace function public.current_workshop_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_workshop_id uuid;
begin
  select p.workshop_id into v_workshop_id
  from public.profiles p
  where p.id = auth.uid();

  return v_workshop_id;
end;
$$;

drop policy if exists "Profiles self read" on public.profiles;
create policy "Profiles self read" on public.profiles
for select using (
  id = auth.uid()
  or public.current_role() in ('admin'::public.app_role, 'supervisor'::public.app_role)
);
