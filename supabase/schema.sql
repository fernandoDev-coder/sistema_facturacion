create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.company_settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  fiscal_name text,
  tax_id text,
  address text,
  postal_code text,
  city text,
  province text,
  email text,
  phone text,
  iban text,
  invoice_footer text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint company_settings_owner_id_key unique (owner_id),
  constraint company_settings_tax_id_format_check check (
    tax_id is null or tax_id ~ '^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]|[ABEH][0-9]{7}[0-9]|[NPQSW][0-9]{7}[A-J]|[CDFGJUVR][0-9]{7}[0-9A-J])$'
  ),
  constraint company_settings_postal_code_format_check check (
    postal_code is null or (postal_code ~ '^[0-9]{5}$' and substring(postal_code from 1 for 2)::int between 1 and 52)
  ),
  constraint company_settings_phone_format_check check (
    phone is null or phone ~ '^\+34[6789][0-9]{8}$'
  ),
  constraint company_settings_iban_format_check check (
    iban is null or iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$'
  )
);

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  tax_id text,
  address text,
  postal_code text,
  city text,
  province text,
  email text,
  phone text,
  default_subject text,
  default_vat numeric not null default 21,
  notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint communities_tax_id_format_check check (
    tax_id is null or tax_id ~ '^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]|[ABEH][0-9]{7}[0-9]|[NPQSW][0-9]{7}[A-J]|[CDFGJUVR][0-9]{7}[0-9A-J])$'
  ),
  constraint communities_postal_code_format_check check (
    postal_code is null or (postal_code ~ '^[0-9]{5}$' and substring(postal_code from 1 for 2)::int between 1 and 52)
  ),
  constraint communities_phone_format_check check (
    phone is null or phone ~ '^\+34[6789][0-9]{8}$'
  ),
  constraint communities_default_vat_range_check check (
    default_vat >= 0 and default_vat <= 100
  )
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  document_type text not null default 'invoice',
  community_name text,
  community_tax_id text,
  community_address text,
  community_postal_code text,
  community_city text,
  community_province text,
  community_email text,
  community_phone text,
  invoice_number text not null,
  invoice_date date not null,
  month int not null check (month between 1 and 12),
  year int not null check (year between 2000 and 2200),
  subject text not null,
  amount numeric not null default 0,
  vat_rate numeric not null default 21,
  vat_amount numeric not null default 0,
  total numeric not null default 0,
  status text not null default 'draft' check (status in ('draft', 'pending', 'paid', 'cancelled')),
  notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.invoices add column if not exists document_type text not null default 'invoice';

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  amount numeric not null default 0,
  vat_rate numeric not null default 21,
  vat_amount numeric not null default 0,
  total numeric not null default 0,
  sort_order int not null default 0,
  created_at timestamp with time zone not null default now()
);

create index if not exists company_settings_owner_id_idx on public.company_settings(owner_id);
create index if not exists communities_owner_id_idx on public.communities(owner_id);
create index if not exists communities_owner_id_name_idx on public.communities(owner_id, name);
create index if not exists invoices_owner_id_idx on public.invoices(owner_id);
create index if not exists invoices_owner_year_month_idx on public.invoices(owner_id, year, month);
create index if not exists invoices_owner_document_year_idx on public.invoices(owner_id, document_type, year);
create index if not exists invoices_community_id_idx on public.invoices(community_id);
create index if not exists invoice_items_owner_id_idx on public.invoice_items(owner_id);
create index if not exists invoice_items_invoice_id_idx on public.invoice_items(invoice_id);

alter table public.company_settings drop constraint if exists company_settings_tax_id_format_check;
alter table public.company_settings add constraint company_settings_tax_id_format_check check (
  tax_id is null or tax_id ~ '^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]|[ABEH][0-9]{7}[0-9]|[NPQSW][0-9]{7}[A-J]|[CDFGJUVR][0-9]{7}[0-9A-J])$'
);

alter table public.company_settings drop constraint if exists company_settings_postal_code_format_check;
alter table public.company_settings add constraint company_settings_postal_code_format_check check (
  postal_code is null or (postal_code ~ '^[0-9]{5}$' and substring(postal_code from 1 for 2)::int between 1 and 52)
);

alter table public.company_settings drop constraint if exists company_settings_phone_format_check;
alter table public.company_settings add constraint company_settings_phone_format_check check (
  phone is null or phone ~ '^\+34[6789][0-9]{8}$'
);

alter table public.company_settings drop constraint if exists company_settings_iban_format_check;
alter table public.company_settings add constraint company_settings_iban_format_check check (
  iban is null or iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$'
);

alter table public.communities drop constraint if exists communities_tax_id_format_check;
alter table public.communities add constraint communities_tax_id_format_check check (
  tax_id is null or tax_id ~ '^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]|[ABEH][0-9]{7}[0-9]|[NPQSW][0-9]{7}[A-J]|[CDFGJUVR][0-9]{7}[0-9A-J])$'
);

alter table public.communities drop constraint if exists communities_postal_code_format_check;
alter table public.communities add constraint communities_postal_code_format_check check (
  postal_code is null or (postal_code ~ '^[0-9]{5}$' and substring(postal_code from 1 for 2)::int between 1 and 52)
);

alter table public.communities drop constraint if exists communities_phone_format_check;
alter table public.communities add constraint communities_phone_format_check check (
  phone is null or phone ~ '^\+34[6789][0-9]{8}$'
);

alter table public.communities drop constraint if exists communities_default_vat_range_check;
alter table public.communities add constraint communities_default_vat_range_check check (
  default_vat >= 0 and default_vat <= 100
);

alter table public.invoices drop constraint if exists invoices_document_type_check;
alter table public.invoices add constraint invoices_document_type_check check (
  document_type in ('invoice', 'budget')
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_company_settings_updated_at on public.company_settings;
create trigger set_company_settings_updated_at
before update on public.company_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_communities_updated_at on public.communities;
create trigger set_communities_updated_at
before update on public.communities
for each row execute function public.set_updated_at();

drop trigger if exists set_invoices_updated_at on public.invoices;
create trigger set_invoices_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.company_settings enable row level security;
alter table public.communities enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "company_settings_select_own" on public.company_settings;
create policy "company_settings_select_own"
on public.company_settings for select
using (auth.uid() = owner_id);

drop policy if exists "company_settings_insert_own" on public.company_settings;
create policy "company_settings_insert_own"
on public.company_settings for insert
with check (auth.uid() = owner_id);

drop policy if exists "company_settings_update_own" on public.company_settings;
create policy "company_settings_update_own"
on public.company_settings for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "company_settings_delete_own" on public.company_settings;
create policy "company_settings_delete_own"
on public.company_settings for delete
using (auth.uid() = owner_id);

drop policy if exists "communities_select_own" on public.communities;
create policy "communities_select_own"
on public.communities for select
using (auth.uid() = owner_id);

drop policy if exists "communities_insert_own" on public.communities;
create policy "communities_insert_own"
on public.communities for insert
with check (auth.uid() = owner_id);

drop policy if exists "communities_update_own" on public.communities;
create policy "communities_update_own"
on public.communities for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "communities_delete_own" on public.communities;
create policy "communities_delete_own"
on public.communities for delete
using (auth.uid() = owner_id);

drop policy if exists "invoices_select_own" on public.invoices;
create policy "invoices_select_own"
on public.invoices for select
using (auth.uid() = owner_id);

drop policy if exists "invoices_insert_own" on public.invoices;
create policy "invoices_insert_own"
on public.invoices for insert
with check (auth.uid() = owner_id);

drop policy if exists "invoices_update_own" on public.invoices;
create policy "invoices_update_own"
on public.invoices for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "invoices_delete_own" on public.invoices;
create policy "invoices_delete_own"
on public.invoices for delete
using (auth.uid() = owner_id);

drop policy if exists "invoice_items_select_own" on public.invoice_items;
create policy "invoice_items_select_own"
on public.invoice_items for select
using (auth.uid() = owner_id);

drop policy if exists "invoice_items_insert_own" on public.invoice_items;
create policy "invoice_items_insert_own"
on public.invoice_items for insert
with check (auth.uid() = owner_id);

drop policy if exists "invoice_items_update_own" on public.invoice_items;
create policy "invoice_items_update_own"
on public.invoice_items for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "invoice_items_delete_own" on public.invoice_items;
create policy "invoice_items_delete_own"
on public.invoice_items for delete
using (auth.uid() = owner_id);
