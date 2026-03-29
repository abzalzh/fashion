
create extension if not exists pgcrypto;

do $$
begin
  if exists (select 1 from pg_type where typname = 'user_role' and typnamespace = (select oid from pg_namespace where nspname = 'public')) then
    null;
  else
    create type public.user_role as enum ('customer', 'franchisee', 'production');
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_type where typname = 'order_status' and typnamespace = (select oid from pg_namespace where nspname = 'public')) then
    null;
  else
    create type public.order_status as enum ('PLACED', 'IN_PRODUCTION', 'READY');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role public.user_role not null default 'customer',
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid (),
  slug text not null unique,
  title text not null,
  description text,
  price_cents int not null check (price_cents >= 0),
  in_stock boolean not null default true,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now ()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid (),
  customer_id uuid not null references public.profiles (id) on delete restrict,
  product_id uuid not null references public.products (id) on delete restrict,
  status public.order_status not null default 'PLACED',
  is_preorder boolean not null default false,
  preorder_ready_date date,
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

create index if not exists orders_customer_idx on public.orders (customer_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at desc);

create table if not exists public.production_tasks (
  id uuid primary key default gen_random_uuid (),
  order_id uuid not null references public.orders (id) on delete cascade,
  step_index int not null check (step_index >= 1),
  label text not null,
  completed_at timestamptz,
  created_at timestamptz not null default now (),
  unique (order_id, step_index)
);

create index if not exists production_tasks_order_idx on public.production_tasks (order_id);

create or replace function public.touch_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_touch_updated on public.orders;
create trigger orders_touch_updated
before update on public.orders
for each row
execute function public.touch_updated_at ();

create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r text;
  mapped public.user_role;
  user_email text;
begin
  r := coalesce(new.raw_user_meta_data ->> 'role', 'customer');
  mapped :=
    case r
      when 'franchisee' then 'franchisee'::public.user_role
      when 'production' then 'production'::public.user_role
      else 'customer'::public.user_role
    end;
  user_email := coalesce(new.email, new.raw_user_meta_data ->> 'email', '');
  
  insert into public.profiles (id, email, role)
  values (new.id, user_email, mapped)
  on conflict (id) do update
    set email = excluded.email,
        role = excluded.role,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user ();

create or replace function public.accept_order (p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  fr boolean;
  n int;
begin
  select exists (
    select 1 from public.profiles p where p.id = auth.uid () and p.role = 'franchisee'
  )
  into fr;
  if not fr then
    raise exception 'not_allowed';
  end if;

  update public.orders
  set
    status = 'IN_PRODUCTION',
    accepted_at = coalesce(accepted_at, now()),
    updated_at = now()
  where
    id = p_order_id
    and status = 'PLACED';

  get diagnostics n = row_count;
  if n = 0 then
    return;
  end if;

  delete from public.production_tasks where order_id = p_order_id;

  insert into public.production_tasks (order_id, step_index, label)
  values
    (p_order_id, 1, 'CUT'),
    (p_order_id, 2, 'SEW'),
    (p_order_id, 3, 'FINISH');
end;
$$;

create or replace function public.complete_current_production_task (p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pr boolean;
  tid uuid;
begin
  select exists (
    select 1 from public.profiles p where p.id = auth.uid () and p.role = 'production'
  )
  into pr;
  if not pr then
    raise exception 'not_allowed';
  end if;

  if not exists (
    select 1 from public.orders o where o.id = p_order_id and o.status = 'IN_PRODUCTION'
  ) then
    raise exception 'invalid_order_state';
  end if;

  select t.id into tid
  from public.production_tasks t
  where
    t.order_id = p_order_id
    and t.completed_at is null
  order by t.step_index asc
  limit 1;

  if tid is null then
    return;
  end if;

  update public.production_tasks
  set completed_at = now()
  where id = tid;

  if
    not exists (
      select 1
      from public.production_tasks t
      where
        t.order_id = p_order_id
        and t.completed_at is null
    )
  then
    update public.orders
    set
      status = 'READY',
      completed_at = now(),
      updated_at = now()
    where
      id = p_order_id;
  end if;
end;
$$;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.accept_order (uuid) to authenticated;
grant execute on function public.complete_current_production_task (uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.production_tasks enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
for select using (id = auth.uid ());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update using (id = auth.uid ())
with check (id = auth.uid ());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
for insert with check (id = auth.uid ());

drop policy if exists products_select_auth on public.products;
create policy products_select_auth on public.products
for select using (auth.role () = 'authenticated');

drop policy if exists orders_select_scope on public.orders;
create policy orders_select_scope on public.orders
for select using (
  customer_id = auth.uid ()
  or exists (select 1 from public.profiles p where p.id = auth.uid () and p.role = 'franchisee')
  or exists (select 1 from public.profiles p where p.id = auth.uid () and p.role = 'production')
);

drop policy if exists orders_insert_customer on public.orders;
create policy orders_insert_customer on public.orders
for insert with check (
  customer_id = auth.uid ()
  and exists (select 1 from public.profiles p where p.id = auth.uid () and p.role = 'customer')
);


drop policy if exists production_tasks_select_scope on public.production_tasks;
create policy production_tasks_select_scope on public.production_tasks
for select using (
  exists (
    select 1
    from public.orders o
    where
      o.id = production_tasks.order_id
      and (
        o.customer_id = auth.uid ()
        or exists (select 1 from public.profiles p where p.id = auth.uid () and p.role = 'franchisee')
        or exists (select 1 from public.profiles p where p.id = auth.uid () and p.role = 'production')
      )
  )
);


alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.production_tasks;
