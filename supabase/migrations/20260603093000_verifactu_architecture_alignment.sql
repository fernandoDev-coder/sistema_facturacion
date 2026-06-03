create extension if not exists pgcrypto;

alter table public.company_settings add column if not exists default_invoice_series text not null default 'F';
alter table public.company_settings add column if not exists next_invoice_number integer not null default 1;

alter table public.invoices add column if not exists issued_at timestamp with time zone;
alter table public.invoices add column if not exists cancelled_at timestamp with time zone;
alter table public.invoices add column if not exists corrected_invoice_id uuid references public.invoices(id) on delete set null;
alter table public.invoices add column if not exists invoice_series text;
alter table public.invoices add column if not exists sequential_number integer;
alter table public.invoices add column if not exists fiscal_status text not null default 'not_generated';

update public.invoices
set status = 'issued',
    issued_at = coalesce(issued_at, updated_at, created_at)
where document_type = 'invoice'
  and status in ('pending', 'paid');

update public.invoices
set status = 'draft'
where document_type = 'budget'
  and status in ('pending', 'paid');

alter table public.invoices drop constraint if exists invoices_status_check;
alter table public.invoices add constraint invoices_status_check check (
  status in ('draft', 'issued', 'cancelled', 'corrective')
);

alter table public.invoices drop constraint if exists invoices_fiscal_status_check;
alter table public.invoices add constraint invoices_fiscal_status_check check (
  fiscal_status in ('not_generated', 'generated_internal', 'pending_aeat', 'accepted', 'rejected', 'error')
);

alter table public.invoices drop constraint if exists invoices_sequential_number_check;
alter table public.invoices add constraint invoices_sequential_number_check check (
  sequential_number is null or sequential_number > 0
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

alter table public.invoices add column if not exists fiscal_record_id uuid;
alter table public.invoices drop constraint if exists invoices_fiscal_record_id_fkey;
alter table public.invoices add constraint invoices_fiscal_record_id_fkey
foreign key (fiscal_record_id) references public.fiscal_records(id) on delete set null;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  metadata jsonb,
  created_at timestamp with time zone not null default now()
);

create index if not exists invoices_owner_series_number_idx on public.invoices(owner_id, invoice_series, sequential_number);
create unique index if not exists invoices_owner_issued_number_key
on public.invoices(owner_id, invoice_series, sequential_number)
where document_type = 'invoice'
  and status in ('issued', 'cancelled', 'corrective')
  and invoice_series is not null
  and sequential_number is not null;

create index if not exists fiscal_records_owner_id_idx on public.fiscal_records(owner_id);
create index if not exists fiscal_records_invoice_id_idx on public.fiscal_records(invoice_id);
create index if not exists fiscal_records_generated_at_idx on public.fiscal_records(generated_at);
create index if not exists fiscal_records_chain_sequence_idx on public.fiscal_records(chain_sequence);
create unique index if not exists fiscal_records_owner_chain_sequence_key on public.fiscal_records(owner_id, chain_sequence);
create index if not exists audit_logs_owner_id_idx on public.audit_logs(owner_id);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at);

alter table public.fiscal_records enable row level security;
alter table public.audit_logs enable row level security;

grant select on public.fiscal_records to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant select, insert, update, delete on public.fiscal_records, public.audit_logs to service_role;

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

create or replace function public.prevent_fiscal_record_changes()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Los registros fiscales internos no se pueden editar ni borrar.';
end;
$$;

drop trigger if exists prevent_fiscal_record_update on public.fiscal_records;
create trigger prevent_fiscal_record_update
before update on public.fiscal_records
for each row execute function public.prevent_fiscal_record_changes();

drop trigger if exists prevent_fiscal_record_delete on public.fiscal_records;
create trigger prevent_fiscal_record_delete
before delete on public.fiscal_records
for each row execute function public.prevent_fiscal_record_changes();

create or replace function public.prevent_issued_invoice_direct_changes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if old.document_type = 'invoice' and old.status <> 'draft' then
      raise exception 'Las facturas emitidas no se eliminan; deben anularse o rectificarse.';
    end if;
    return old;
  end if;

  if old.document_type = 'invoice'
     and coalesce(current_setting('app.fiscal_rpc', true), '') <> 'true' then
    if old.status <> 'draft' then
      raise exception 'Esta factura ya ha sido emitida y no puede modificarse directamente.';
    end if;

    if new.status <> 'draft' then
      raise exception 'Las facturas deben emitirse mediante issue_invoice.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_issued_invoice_update on public.invoices;
create trigger prevent_issued_invoice_update
before update on public.invoices
for each row execute function public.prevent_issued_invoice_direct_changes();

drop trigger if exists prevent_issued_invoice_delete on public.invoices;
create trigger prevent_issued_invoice_delete
before delete on public.invoices
for each row execute function public.prevent_issued_invoice_direct_changes();

create or replace function public.prevent_issued_invoice_item_changes()
returns trigger
language plpgsql
as $$
declare
  target_invoice_id uuid;
  parent_invoice public.invoices%rowtype;
begin
  target_invoice_id := case when tg_op = 'DELETE' then old.invoice_id else new.invoice_id end;

  select *
  into parent_invoice
  from public.invoices
  where id = target_invoice_id;

  if parent_invoice.document_type = 'invoice'
     and parent_invoice.status <> 'draft'
     and coalesce(current_setting('app.fiscal_rpc', true), '') <> 'true' then
    raise exception 'Las lineas de una factura emitida no pueden modificarse directamente.';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists prevent_issued_invoice_items_insert on public.invoice_items;
create trigger prevent_issued_invoice_items_insert
before insert on public.invoice_items
for each row execute function public.prevent_issued_invoice_item_changes();

drop trigger if exists prevent_issued_invoice_items_update on public.invoice_items;
create trigger prevent_issued_invoice_items_update
before update on public.invoice_items
for each row execute function public.prevent_issued_invoice_item_changes();

drop trigger if exists prevent_issued_invoice_items_delete on public.invoice_items;
create trigger prevent_issued_invoice_items_delete
before delete on public.invoice_items
for each row execute function public.prevent_issued_invoice_item_changes();

drop policy if exists "invoices_delete_own" on public.invoices;
create policy "invoices_delete_own"
on public.invoices for delete
using (auth.uid() = owner_id and (document_type = 'budget' or status = 'draft'));

create or replace function public.issue_invoice(p_invoice_id uuid)
returns public.invoices
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_owner_id uuid := auth.uid();
  v_invoice public.invoices%rowtype;
  v_company public.company_settings%rowtype;
  v_items_count integer;
  v_amount numeric;
  v_vat_amount numeric;
  v_total numeric;
  v_series text;
  v_number integer;
  v_previous public.fiscal_records%rowtype;
  v_payload jsonb;
  v_fiscal_record_id uuid;
  v_hash text;
begin
  if v_owner_id is null then
    raise exception 'No autenticado.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_owner_id::text, 0));

  select *
  into v_invoice
  from public.invoices
  where id = p_invoice_id
    and owner_id = v_owner_id
    and document_type = 'invoice'
  for update;

  if not found then
    raise exception 'Factura no encontrada.';
  end if;

  if v_invoice.status <> 'draft' then
    raise exception 'Solo se pueden emitir facturas en borrador.';
  end if;

  select *
  into v_company
  from public.company_settings
  where owner_id = v_owner_id
  for update;

  if not found
     or nullif(trim(coalesce(v_company.fiscal_name, '')), '') is null
     or nullif(trim(coalesce(v_company.tax_id, '')), '') is null
     or nullif(trim(coalesce(v_company.address, '')), '') is null then
    raise exception 'Completa los datos minimos del emisor antes de emitir.';
  end if;

  if v_invoice.community_id is null
     or nullif(trim(coalesce(v_invoice.community_name, '')), '') is null
     or nullif(trim(coalesce(v_invoice.community_tax_id, '')), '') is null
     or nullif(trim(coalesce(v_invoice.community_address, '')), '') is null then
    raise exception 'Completa los datos minimos del receptor antes de emitir.';
  end if;

  select count(*), coalesce(sum(amount), 0), coalesce(sum(vat_amount), 0), coalesce(sum(total), 0)
  into v_items_count, v_amount, v_vat_amount, v_total
  from public.invoice_items
  where owner_id = v_owner_id
    and invoice_id = p_invoice_id;

  if v_items_count < 1 then
    raise exception 'Anade al menos un concepto antes de emitir.';
  end if;

  if abs(v_invoice.amount - v_amount) > 0.01
     or abs(v_invoice.vat_amount - v_vat_amount) > 0.01
     or abs(v_invoice.total - v_total) > 0.01 then
    raise exception 'Los importes de la factura no son coherentes con sus lineas.';
  end if;

  v_series := coalesce(nullif(trim(v_invoice.invoice_series), ''), nullif(trim(v_company.default_invoice_series), ''), 'F');
  v_number := coalesce(v_invoice.sequential_number, v_company.next_invoice_number, 1);

  update public.company_settings
  set next_invoice_number = greatest(coalesce(next_invoice_number, 1), v_number + 1)
  where owner_id = v_owner_id;

  select *
  into v_previous
  from public.fiscal_records
  where owner_id = v_owner_id
  order by chain_sequence desc
  limit 1;

  v_payload := jsonb_build_object(
    'issuer', jsonb_build_object(
      'legal_name', v_company.fiscal_name,
      'tax_id', v_company.tax_id,
      'address', concat_ws(' ', v_company.address, v_company.postal_code, v_company.city, v_company.province)
    ),
    'recipient', jsonb_build_object(
      'legal_name', v_invoice.community_name,
      'tax_id', v_invoice.community_tax_id,
      'address', concat_ws(' ', v_invoice.community_address, v_invoice.community_postal_code, v_invoice.community_city, v_invoice.community_province)
    ),
    'invoice', jsonb_build_object(
      'invoice_id', v_invoice.id,
      'invoice_series', v_series,
      'sequential_number', v_number,
      'issue_date', v_invoice.invoice_date,
      'issued_at', now(),
      'status', 'issued',
      'type', v_invoice.document_type
    ),
    'lines', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'description', description,
        'quantity', 1,
        'unit_price', amount,
        'tax_rate', vat_rate,
        'base_amount', amount,
        'tax_amount', vat_amount,
        'total_amount', total
      ) order by sort_order), '[]'::jsonb)
      from public.invoice_items
      where owner_id = v_owner_id and invoice_id = p_invoice_id
    ),
    'totals', jsonb_build_object(
      'taxable_base', v_invoice.amount,
      'tax_amount', v_invoice.vat_amount,
      'total_amount', v_invoice.total
    ),
    'metadata', jsonb_build_object(
      'generated_by', v_owner_id,
      'app_version', null,
      'internal_record_version', 'internal-v1'
    )
  );

  v_hash := encode(digest(convert_to(v_payload::text || coalesce(v_previous.hash, ''), 'UTF8'), 'sha256'), 'hex');

  insert into public.fiscal_records (
    owner_id, invoice_id, record_type, record_payload, hash,
    previous_record_id, previous_hash, chain_sequence, generated_at
  )
  values (
    v_owner_id, p_invoice_id, 'alta', v_payload, v_hash,
    v_previous.id, v_previous.hash, coalesce(v_previous.chain_sequence, 0) + 1, now()
  )
  returning id into v_fiscal_record_id;

  perform set_config('app.fiscal_rpc', 'true', true);

  update public.invoices
  set status = 'issued',
      issued_at = now(),
      invoice_series = v_series,
      sequential_number = v_number,
      invoice_number = v_series || '-' || lpad(v_number::text, 6, '0'),
      fiscal_record_id = v_fiscal_record_id,
      fiscal_status = 'generated_internal',
      updated_at = now()
  where id = p_invoice_id
  returning * into v_invoice;

  insert into public.audit_logs(owner_id, entity_type, entity_id, action, metadata)
  values
    (v_owner_id, 'fiscal_record', v_fiscal_record_id, 'fiscal_record_created', jsonb_build_object('record_type', 'alta')),
    (v_owner_id, 'invoice', p_invoice_id, 'invoice_issued', jsonb_build_object('fiscal_record_id', v_fiscal_record_id));

  return v_invoice;
end;
$$;

create or replace function public.cancel_invoice(p_invoice_id uuid, p_reason text)
returns public.invoices
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_owner_id uuid := auth.uid();
  v_invoice public.invoices%rowtype;
  v_previous public.fiscal_records%rowtype;
  v_original public.fiscal_records%rowtype;
  v_payload jsonb;
  v_fiscal_record_id uuid;
  v_hash text;
begin
  if v_owner_id is null then
    raise exception 'No autenticado.';
  end if;

  if nullif(trim(coalesce(p_reason, '')), '') is null then
    raise exception 'Indica el motivo de anulacion.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_owner_id::text, 0));

  select *
  into v_invoice
  from public.invoices
  where id = p_invoice_id
    and owner_id = v_owner_id
    and document_type = 'invoice'
  for update;

  if not found then
    raise exception 'Factura no encontrada.';
  end if;

  if v_invoice.status <> 'issued' then
    raise exception 'Solo se pueden anular facturas emitidas.';
  end if;

  select *
  into v_original
  from public.fiscal_records
  where id = v_invoice.fiscal_record_id
     or (invoice_id = p_invoice_id and record_type = 'alta')
  order by generated_at asc
  limit 1;

  select *
  into v_previous
  from public.fiscal_records
  where owner_id = v_owner_id
  order by chain_sequence desc
  limit 1;

  v_payload := jsonb_build_object(
    'invoice_id', v_invoice.id,
    'original_fiscal_record_id', v_original.id,
    'original_invoice_series', v_invoice.invoice_series,
    'original_sequential_number', v_invoice.sequential_number,
    'reason', trim(p_reason),
    'cancelled_at', now(),
    'user_id', v_owner_id,
    'owner_id', v_owner_id
  );

  v_hash := encode(digest(convert_to(v_payload::text || coalesce(v_previous.hash, ''), 'UTF8'), 'sha256'), 'hex');

  insert into public.fiscal_records (
    owner_id, invoice_id, record_type, record_payload, hash,
    previous_record_id, previous_hash, chain_sequence, generated_at
  )
  values (
    v_owner_id, p_invoice_id, 'anulacion', v_payload, v_hash,
    v_previous.id, v_previous.hash, coalesce(v_previous.chain_sequence, 0) + 1, now()
  )
  returning id into v_fiscal_record_id;

  perform set_config('app.fiscal_rpc', 'true', true);

  update public.invoices
  set status = 'cancelled',
      cancelled_at = now(),
      fiscal_record_id = v_fiscal_record_id,
      fiscal_status = 'generated_internal',
      updated_at = now()
  where id = p_invoice_id
  returning * into v_invoice;

  insert into public.audit_logs(owner_id, entity_type, entity_id, action, metadata)
  values
    (v_owner_id, 'fiscal_record', v_fiscal_record_id, 'fiscal_record_created', jsonb_build_object('record_type', 'anulacion')),
    (v_owner_id, 'invoice', p_invoice_id, 'invoice_cancelled', jsonb_build_object(
      'fiscal_record_id', v_fiscal_record_id,
      'original_fiscal_record_id', v_original.id,
      'reason', trim(p_reason)
    ));

  return v_invoice;
end;
$$;

grant execute on function public.issue_invoice(uuid) to authenticated;
grant execute on function public.cancel_invoice(uuid, text) to authenticated;
