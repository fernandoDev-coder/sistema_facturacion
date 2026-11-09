create table public.monthly_operations (
  owner_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  request jsonb not null,
  invoice_ids uuid[] not null,
  created_at timestamptz not null default now(),
  primary key(owner_id, operation_id)
);
alter table public.monthly_operations enable row level security;
revoke all on public.monthly_operations from anon, authenticated;

create function public.create_monthly_drafts(p_operation_id uuid, p_month integer, p_year integer,
  p_rows jsonb, p_confirm_duplicates boolean default false)
returns uuid[] language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  profile public.profiles;
  prior public.monthly_operations;
  request jsonb := jsonb_build_object('month',p_month,'year',p_year,'rows',p_rows,'confirm',p_confirm_duplicates);
  row jsonb;
  community public.communities;
  invoice_id uuid;
  ids uuid[] := '{}';
  base numeric;
  rate numeric;
  tax numeric;
  subject text;
begin
  if actor is null or not public.mfa_access_allowed() then raise exception 'MFA required' using errcode = '42501'; end if;
  if p_operation_id is null or p_month is null or p_month not between 1 and 12
    or p_year is null or p_year not between 2000 and 2200
    or p_rows is null or p_confirm_duplicates is null
    or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) not between 1 and 500 then
    raise exception 'invalid monthly request';
  end if;
  -- Serialize monthly operations per owner, including different keys for the same period.
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 0));
  select * into profile from public.profiles where id = actor;
  if not found or not (profile.plan in ('premium','enterprise') or profile.is_super_admin or profile.has_lifetime_access) then
    raise exception 'Premium required' using errcode = '42501';
  end if;
  select * into prior from public.monthly_operations where owner_id = actor and operation_id = p_operation_id;
  if found then
    if prior.request <> request then raise exception 'idempotency key reused with different request'; end if;
    return prior.invoice_ids;
  end if;
  if (select count(distinct value->>'community_id') from jsonb_array_elements(p_rows)) <> jsonb_array_length(p_rows) then
    raise exception 'duplicate community in request';
  end if;
  for row in select value from jsonb_array_elements(p_rows) loop
    select * into community from public.communities where id = (row->>'community_id')::uuid and owner_id = actor;
    if not found then raise exception 'community not owned' using errcode = '42501'; end if;
    if not p_confirm_duplicates and exists(select 1 from public.invoices where owner_id = actor
      and community_id = community.id and document_type = 'invoice' and month = p_month and year = p_year) then
      raise exception 'duplicate confirmation required' using errcode = '23505';
    end if;
    base := round((row->>'amount')::numeric, 2);
    rate := (row->>'vat_rate')::numeric;
    subject := btrim(row->>'subject');
    if base is null or base < 0 or base > 1000000000 or rate is null or rate < 0 or rate > 100
      or subject is null or length(subject) not between 1 and 2000 then raise exception 'invalid monthly row'; end if;
    tax := round(base * rate / 100, 2);
    invoice_id := gen_random_uuid();
    insert into public.invoices(id,owner_id,community_id,document_type,invoice_number,invoice_date,month,year,
      subject,amount,vat_rate,vat_amount,total,status,notes,community_name,community_tax_id,community_address,
      community_postal_code,community_city,community_province,community_email,community_phone)
    values(invoice_id,actor,community.id,'invoice','D-'||p_year||'-'||invoice_id::text,make_date(p_year,p_month,1),p_month,p_year,
      subject,base,rate,tax,base+tax,'draft',left(row->>'notes',4000),community.name,community.tax_id,community.address,
      community.postal_code,community.city,community.province,community.email,community.phone);
    insert into public.invoice_items(owner_id,invoice_id,description,amount,vat_rate,vat_amount,total,sort_order)
      values(actor,invoice_id,subject,base,rate,tax,base+tax,0);
    insert into public.audit_logs(owner_id,entity_type,entity_id,action,metadata)
      values(actor,'invoice',invoice_id,'invoice_created',jsonb_build_object('source','monthly_bulk','operation_id',p_operation_id));
    ids := array_append(ids, invoice_id);
  end loop;
  insert into public.monthly_operations(owner_id,operation_id,request,invoice_ids) values(actor,p_operation_id,request,ids);
  return ids;
end;
$$;
revoke all on function public.create_monthly_drafts(uuid,integer,integer,jsonb,boolean) from public, anon;
grant execute on function public.create_monthly_drafts(uuid,integer,integer,jsonb,boolean) to authenticated;
