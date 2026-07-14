create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user',
  plan text not null default 'starter',
  is_super_admin boolean not null default false,
  has_lifetime_access boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text,
  subscription_current_period_end timestamp with time zone,
  onboarding_completed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  constraint profiles_role_check check (role in ('user', 'admin', 'super_admin')),
  constraint profiles_plan_check check (plan in ('starter', 'pro', 'premium', 'enterprise'))
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
  logo_url text,
  invoice_footer text,
  default_invoice_series text not null default 'F',
  next_invoice_number integer not null default 1,
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
  status text not null default 'draft' check (status in ('draft', 'issued', 'cancelled', 'corrective')),
  issued_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  corrected_invoice_id uuid references public.invoices(id) on delete set null,
  invoice_series text,
  sequential_number integer,
  fiscal_record_id uuid,
  fiscal_status text not null default 'not_generated' check (
    fiscal_status in ('not_generated', 'generated_internal', 'pending_aeat', 'accepted', 'rejected', 'error')
  ),
  notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.invoices add column if not exists document_type text not null default 'invoice';
alter table public.invoices add column if not exists issued_at timestamp with time zone;
alter table public.invoices add column if not exists cancelled_at timestamp with time zone;
alter table public.invoices add column if not exists corrected_invoice_id uuid references public.invoices(id) on delete set null;
alter table public.invoices add column if not exists invoice_series text;
alter table public.invoices add column if not exists sequential_number integer;
alter table public.invoices add column if not exists fiscal_record_id uuid;
alter table public.invoices add column if not exists fiscal_status text not null default 'not_generated';

create table if not exists public.recurring_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  name text not null,
  concept text not null,
  base_amount numeric not null default 0,
  tax_rate numeric not null default 21,
  frequency text not null default 'monthly',
  billing_day int not null default 1,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint recurring_plans_frequency_check check (frequency = 'monthly'),
  constraint recurring_plans_billing_day_check check (billing_day between 1 and 28),
  constraint recurring_plans_tax_rate_check check (tax_rate >= 0 and tax_rate <= 100)
);

alter table public.invoices add column if not exists recurring_plan_id uuid references public.recurring_plans(id) on delete set null;

create table if not exists public.expense_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  supplier_name text not null,
  invoice_number text,
  issue_date date not null,
  total_amount numeric not null default 0,
  tax_amount numeric,
  category text,
  file_url text not null,
  status text not null default 'pending',
  created_at timestamp with time zone not null default now(),
  constraint expense_documents_status_check check (status in ('pending', 'paid', 'archived')),
  constraint expense_documents_amount_check check (total_amount >= 0),
  constraint expense_documents_tax_amount_check check (tax_amount is null or tax_amount >= 0)
);

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

create table if not exists public.fiscal_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  record_type text not null check (record_type in ('alta', 'anulacion')),
  mode text not null default 'internal_pending_verifactu' check (mode in ('internal_pending_verifactu', 'verifactu', 'no_verifactu')),
  record_version text not null default 'internal-v1',
  record_payload jsonb not null,
  record_xml text,
  hash text,
  previous_record_id uuid references public.fiscal_records(id) on delete set null,
  previous_hash text,
  chain_sequence integer not null,
  generated_at timestamp with time zone not null default now(),
  submitted_at timestamp with time zone,
  aeat_status text not null default 'not_submitted' check (aeat_status in ('not_submitted', 'pending', 'accepted', 'rejected', 'error')),
  aeat_response jsonb,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  metadata jsonb,
  created_at timestamp with time zone not null default now()
);

alter table public.invoices drop constraint if exists invoices_fiscal_record_id_fkey;
alter table public.invoices add constraint invoices_fiscal_record_id_fkey
foreign key (fiscal_record_id) references public.fiscal_records(id) on delete set null;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text,
  plan text not null default 'pro',
  status text not null,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint subscriptions_plan_check check (plan in ('pro', 'premium', 'enterprise'))
);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  type text not null,
  payload jsonb not null,
  processed_at timestamp with time zone,
  processing_error text,
  created_at timestamp with time zone not null default now()
);

alter table public.billing_events alter column processed_at drop not null;
alter table public.billing_events alter column processed_at drop default;
alter table public.billing_events add column if not exists processing_error text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-logos',
  'company-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expense-documents',
  'expense-documents',
  false,
  5242880,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists plan text not null default 'starter';
alter table public.profiles add column if not exists is_super_admin boolean not null default false;
alter table public.profiles add column if not exists has_lifetime_access boolean not null default false;
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;
alter table public.profiles add column if not exists subscription_status text;
alter table public.profiles add column if not exists subscription_current_period_end timestamp with time zone;
alter table public.profiles add column if not exists onboarding_completed_at timestamp with time zone;

create index if not exists company_settings_owner_id_idx on public.company_settings(owner_id);
create index if not exists profiles_email_idx on public.profiles(email);
create unique index if not exists profiles_stripe_customer_id_key on public.profiles(stripe_customer_id) where stripe_customer_id is not null;
create index if not exists profiles_stripe_subscription_id_idx on public.profiles(stripe_subscription_id);
create index if not exists communities_owner_id_idx on public.communities(owner_id);
create index if not exists communities_owner_id_name_idx on public.communities(owner_id, name);
create index if not exists invoices_owner_id_idx on public.invoices(owner_id);
create index if not exists invoices_owner_year_month_idx on public.invoices(owner_id, year, month);
create index if not exists invoices_owner_document_year_idx on public.invoices(owner_id, document_type, year);
create index if not exists invoices_owner_recurring_period_idx on public.invoices(owner_id, recurring_plan_id, year, month) where recurring_plan_id is not null;
create index if not exists invoices_community_id_idx on public.invoices(community_id);
create unique index if not exists invoices_owner_issued_number_key
on public.invoices(owner_id, invoice_series, sequential_number)
where document_type = 'invoice'
  and status in ('issued', 'cancelled', 'corrective')
  and invoice_series is not null
  and sequential_number is not null;
create index if not exists recurring_plans_owner_id_idx on public.recurring_plans(owner_id);
create index if not exists recurring_plans_owner_active_idx on public.recurring_plans(owner_id, is_active);
create index if not exists expense_documents_owner_issue_date_idx on public.expense_documents(owner_id, issue_date);
create index if not exists expense_documents_owner_status_idx on public.expense_documents(owner_id, status);
create index if not exists invoice_items_owner_id_idx on public.invoice_items(owner_id);
create index if not exists invoice_items_invoice_id_idx on public.invoice_items(invoice_id);
create index if not exists fiscal_records_owner_id_idx on public.fiscal_records(owner_id);
create index if not exists fiscal_records_invoice_id_idx on public.fiscal_records(invoice_id);
create index if not exists fiscal_records_generated_at_idx on public.fiscal_records(generated_at);
create index if not exists fiscal_records_chain_sequence_idx on public.fiscal_records(chain_sequence);
create unique index if not exists fiscal_records_owner_chain_sequence_key on public.fiscal_records(owner_id, chain_sequence);
create index if not exists audit_logs_owner_id_idx on public.audit_logs(owner_id);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at);
create index if not exists subscriptions_owner_id_idx on public.subscriptions(owner_id);
create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions(stripe_customer_id);

alter table public.company_settings add column if not exists logo_url text;
alter table public.company_settings add column if not exists default_invoice_series text not null default 'F';
alter table public.company_settings add column if not exists next_invoice_number integer not null default 1;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (
  role in ('user', 'admin', 'super_admin')
);

alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (
  plan in ('starter', 'pro', 'premium', 'enterprise')
);

update public.profiles
set role = coalesce(role, 'user'),
    plan = coalesce(plan, 'starter'),
    is_super_admin = coalesce(is_super_admin, false),
    has_lifetime_access = coalesce(has_lifetime_access, false);

update public.profiles
set onboarding_completed_at = created_at
where onboarding_completed_at is null
  and (
    exists (select 1 from public.company_settings where company_settings.owner_id = profiles.id)
    or exists (select 1 from public.communities where communities.owner_id = profiles.id)
    or exists (select 1 from public.invoices where invoices.owner_id = profiles.id)
  );

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

alter table public.invoices drop constraint if exists invoices_status_check;
update public.invoices
set status = 'issued',
    issued_at = coalesce(issued_at, updated_at, created_at)
where document_type = 'invoice'
  and status in ('pending', 'paid');

update public.invoices
set status = 'draft'
where document_type = 'budget'
  and status in ('pending', 'paid');

alter table public.invoices add constraint invoices_status_check check (
  status in ('draft', 'issued', 'cancelled', 'corrective')
);

alter table public.invoices drop constraint if exists invoices_fiscal_status_check;
alter table public.invoices add constraint invoices_fiscal_status_check check (
  fiscal_status in ('not_generated', 'generated_internal', 'pending_aeat', 'accepted', 'rejected', 'error')
);

alter table public.recurring_plans drop constraint if exists recurring_plans_frequency_check;
alter table public.recurring_plans add constraint recurring_plans_frequency_check check (
  frequency = 'monthly'
);

alter table public.expense_documents drop constraint if exists expense_documents_status_check;
alter table public.expense_documents add constraint expense_documents_status_check check (
  status in ('pending', 'paid', 'archived')
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

drop trigger if exists set_recurring_plans_updated_at on public.recurring_plans;
create trigger set_recurring_plans_updated_at
before update on public.recurring_plans
for each row execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
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

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select profiles.is_super_admin
      from public.profiles
      where profiles.id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.protect_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  low_privilege_role boolean := coalesce(auth.role(), '') in ('anon', 'authenticated');
begin
  if not low_privilege_role then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role is distinct from 'user'
      or new.plan is distinct from 'starter'
      or new.is_super_admin is distinct from false
      or new.has_lifetime_access is distinct from false
      or new.stripe_customer_id is not null
      or new.stripe_subscription_id is not null
      or new.subscription_status is not null
      or new.subscription_current_period_end is not null then
      raise exception 'profile access fields can only be changed by service role';
    end if;

    return new;
  end if;

  if new.role is distinct from old.role
    or new.plan is distinct from old.plan
    or new.is_super_admin is distinct from old.is_super_admin
    or new.has_lifetime_access is distinct from old.has_lifetime_access
    or new.stripe_customer_id is distinct from old.stripe_customer_id
    or new.stripe_subscription_id is distinct from old.stripe_subscription_id
    or new.subscription_status is distinct from old.subscription_status
    or new.subscription_current_period_end is distinct from old.subscription_current_period_end then
    raise exception 'profile access fields can only be changed by service role';
  end if;

  return new;
end;
$$;

create or replace function public.audit_profile_access_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
    or new.plan is distinct from old.plan
    or new.is_super_admin is distinct from old.is_super_admin
    or new.has_lifetime_access is distinct from old.has_lifetime_access then
    insert into public.audit_logs (owner_id, entity_type, entity_id, action, metadata)
    values (
      new.id,
      'profile',
      new.id,
      'profile_access_changed',
      jsonb_build_object(
        'old', jsonb_build_object(
          'role', old.role,
          'plan', old.plan,
          'is_super_admin', old.is_super_admin,
          'has_lifetime_access', old.has_lifetime_access
        ),
        'new', jsonb_build_object(
          'role', new.role,
          'plan', new.plan,
          'is_super_admin', new.is_super_admin,
          'has_lifetime_access', new.has_lifetime_access
        )
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_sensitive_fields on public.profiles;
create trigger protect_profile_sensitive_fields
before insert or update on public.profiles
for each row execute function public.protect_profile_sensitive_fields();

drop trigger if exists audit_profile_access_changes on public.profiles;
create trigger audit_profile_access_changes
after update on public.profiles
for each row execute function public.audit_profile_access_changes();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.company_settings enable row level security;
alter table public.communities enable row level security;
alter table public.invoices enable row level security;
alter table public.recurring_plans enable row level security;
alter table public.expense_documents enable row level security;
alter table public.invoice_items enable row level security;
alter table public.fiscal_records enable row level security;
alter table public.audit_logs enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_events enable row level security;

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete
on public.profiles,
   public.company_settings,
   public.communities,
   public.invoices,
   public.recurring_plans,
   public.expense_documents,
   public.invoice_items,
   public.subscriptions
to authenticated;

grant select on public.fiscal_records to authenticated;
grant select, insert on public.audit_logs to authenticated;

revoke update on public.profiles from authenticated;
grant update (email, full_name, onboarding_completed_at) on public.profiles to authenticated;
revoke insert on public.profiles from authenticated;
grant insert (id, email, full_name, onboarding_completed_at) on public.profiles to authenticated;

grant select, insert, update, delete
on public.profiles,
   public.company_settings,
   public.communities,
   public.invoices,
   public.recurring_plans,
   public.expense_documents,
   public.invoice_items,
   public.fiscal_records,
   public.audit_logs,
   public.subscriptions,
   public.billing_events
to service_role;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_select_super_admin" on public.profiles;
create policy "profiles_select_super_admin"
on public.profiles for select
using (public.is_super_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_update_super_admin" on public.profiles;
create policy "profiles_update_super_admin"
on public.profiles for update
using (public.is_super_admin())
with check (public.is_super_admin());

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

drop policy if exists "company_logos_public_read" on storage.objects;
create policy "company_logos_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'company-logos');

drop policy if exists "company_logos_insert_own" on storage.objects;
create policy "company_logos_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'company-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "company_logos_update_own" on storage.objects;
create policy "company_logos_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'company-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'company-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "company_logos_delete_own" on storage.objects;
create policy "company_logos_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'company-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "expense_documents_select_own_files" on storage.objects;
create policy "expense_documents_select_own_files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'expense-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "expense_documents_insert_own_files" on storage.objects;
create policy "expense_documents_insert_own_files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'expense-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "expense_documents_update_own_files" on storage.objects;
create policy "expense_documents_update_own_files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'expense-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'expense-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "expense_documents_delete_own_files" on storage.objects;
create policy "expense_documents_delete_own_files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'expense-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

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
with check (
  auth.uid() = owner_id
  and exists (
    select 1
    from public.communities
    where communities.id = invoices.community_id
      and communities.owner_id = auth.uid()
  )
);

drop policy if exists "invoices_update_own" on public.invoices;
create policy "invoices_update_own"
on public.invoices for update
using (auth.uid() = owner_id)
with check (
  auth.uid() = owner_id
  and exists (
    select 1
    from public.communities
    where communities.id = invoices.community_id
      and communities.owner_id = auth.uid()
  )
);

drop policy if exists "invoices_delete_own" on public.invoices;
create policy "invoices_delete_own"
on public.invoices for delete
using (auth.uid() = owner_id and (document_type = 'budget' or status = 'draft'));

drop policy if exists "recurring_plans_select_own" on public.recurring_plans;
create policy "recurring_plans_select_own"
on public.recurring_plans for select
using (auth.uid() = owner_id);

drop policy if exists "recurring_plans_insert_own" on public.recurring_plans;
create policy "recurring_plans_insert_own"
on public.recurring_plans for insert
with check (
  auth.uid() = owner_id
  and exists (
    select 1
    from public.communities
    where communities.id = recurring_plans.community_id
      and communities.owner_id = auth.uid()
  )
);

drop policy if exists "recurring_plans_update_own" on public.recurring_plans;
create policy "recurring_plans_update_own"
on public.recurring_plans for update
using (auth.uid() = owner_id)
with check (
  auth.uid() = owner_id
  and exists (
    select 1
    from public.communities
    where communities.id = recurring_plans.community_id
      and communities.owner_id = auth.uid()
  )
);

drop policy if exists "recurring_plans_delete_own" on public.recurring_plans;
create policy "recurring_plans_delete_own"
on public.recurring_plans for delete
using (auth.uid() = owner_id);

drop policy if exists "expense_documents_select_own" on public.expense_documents;
create policy "expense_documents_select_own"
on public.expense_documents for select
using (auth.uid() = owner_id);

drop policy if exists "expense_documents_insert_own" on public.expense_documents;
create policy "expense_documents_insert_own"
on public.expense_documents for insert
with check (auth.uid() = owner_id);

drop policy if exists "expense_documents_update_own" on public.expense_documents;
create policy "expense_documents_update_own"
on public.expense_documents for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "expense_documents_delete_own" on public.expense_documents;
create policy "expense_documents_delete_own"
on public.expense_documents for delete
using (auth.uid() = owner_id);

drop policy if exists "invoice_items_select_own" on public.invoice_items;
create policy "invoice_items_select_own"
on public.invoice_items for select
using (
  auth.uid() = owner_id
  and exists (
    select 1
    from public.invoices
    where invoices.id = invoice_items.invoice_id
      and invoices.owner_id = auth.uid()
  )
);

drop policy if exists "invoice_items_insert_own" on public.invoice_items;
create policy "invoice_items_insert_own"
on public.invoice_items for insert
with check (
  auth.uid() = owner_id
  and exists (
    select 1
    from public.invoices
    where invoices.id = invoice_items.invoice_id
      and invoices.owner_id = auth.uid()
  )
);

drop policy if exists "invoice_items_update_own" on public.invoice_items;
create policy "invoice_items_update_own"
on public.invoice_items for update
using (
  auth.uid() = owner_id
  and exists (
    select 1
    from public.invoices
    where invoices.id = invoice_items.invoice_id
      and invoices.owner_id = auth.uid()
  )
)
with check (
  auth.uid() = owner_id
  and exists (
    select 1
    from public.invoices
    where invoices.id = invoice_items.invoice_id
      and invoices.owner_id = auth.uid()
  )
);

drop policy if exists "invoice_items_delete_own" on public.invoice_items;
create policy "invoice_items_delete_own"
on public.invoice_items for delete
using (
  auth.uid() = owner_id
  and exists (
    select 1
    from public.invoices
    where invoices.id = invoice_items.invoice_id
      and invoices.owner_id = auth.uid()
  )
);

drop policy if exists "fiscal_records_select_own" on public.fiscal_records;
create policy "fiscal_records_select_own"
on public.fiscal_records for select
using (auth.uid() = owner_id);

drop policy if exists "audit_logs_select_own" on public.audit_logs;
create policy "audit_logs_select_own"
on public.audit_logs for select
using (auth.uid() = owner_id);

drop policy if exists "audit_logs_insert_own" on public.audit_logs;
create policy "audit_logs_insert_own"
on public.audit_logs for insert
with check (auth.uid() = owner_id);

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
on public.subscriptions for select
using (auth.uid() = owner_id);

drop policy if exists "subscriptions_select_super_admin" on public.subscriptions;
create policy "subscriptions_select_super_admin"
on public.subscriptions for select
using (public.is_super_admin());
