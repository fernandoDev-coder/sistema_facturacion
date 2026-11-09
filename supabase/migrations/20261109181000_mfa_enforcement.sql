-- Admins without a factor are routed to enrollment. Keep a trusted operator with
-- Dashboard access for identity-checked recovery; no public recovery bypass exists.
create or replace function public.mfa_required()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and is_super_admin)
    or exists(select 1 from auth.mfa_factors where user_id = auth.uid() and status = 'verified');
$$;
revoke all on function public.mfa_required() from public, anon;
grant execute on function public.mfa_required() to authenticated;

create or replace function public.mfa_access_allowed()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null
    and exists(select 1 from auth.sessions where id = nullif(auth.jwt()->>'session_id', '')::uuid and user_id = auth.uid())
    and (not public.mfa_required() or (
      coalesce(auth.jwt()->>'aal', '') = 'aal2'
      and exists(select 1 from auth.mfa_factors where user_id = auth.uid() and status = 'verified')
    ));
$$;
revoke all on function public.mfa_access_allowed() from public, anon;
grant execute on function public.mfa_access_allowed() to authenticated;

-- Restrictive policies combine with existing owner checks, never replacing them.
do $$
declare t text;
begin
  foreach t in array array['profiles','company_settings','communities','invoices','recurring_plans',
    'expense_documents','invoice_items','fiscal_records','audit_logs','subscriptions','billing_events'] loop
    execute format('create policy mfa_required_access on public.%I as restrictive for all to authenticated using ((select public.mfa_access_allowed())) with check ((select public.mfa_access_allowed()))', t);
  end loop;
end;
$$;

create policy mfa_required_storage on storage.objects as restrictive for all to authenticated
  using (bucket_id not in ('company-logos', 'expense-documents') or (select public.mfa_access_allowed()))
  with check (bucket_id not in ('company-logos', 'expense-documents') or (select public.mfa_access_allowed()));

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.mfa_access_allowed() and coalesce(auth.jwt()->>'aal', '') = 'aal2'
    and exists(select 1 from public.profiles where id = auth.uid() and is_super_admin);
$$;

-- The existing fiscal functions are SECURITY DEFINER. Guard direct RPC calls too.
alter function public.issue_invoice(uuid) rename to issue_invoice_internal;
revoke all on function public.issue_invoice_internal(uuid) from public, anon, authenticated;
alter function public.cancel_invoice(uuid, text) rename to cancel_invoice_internal;
revoke all on function public.cancel_invoice_internal(uuid, text) from public, anon, authenticated;

create function public.issue_invoice(p_invoice_id uuid)
returns public.invoices language plpgsql security definer set search_path = '' as $$
begin
  if not public.mfa_access_allowed() then raise exception 'MFA required' using errcode = '42501'; end if;
  return public.issue_invoice_internal(p_invoice_id);
end;
$$;
create function public.cancel_invoice(p_invoice_id uuid, p_reason text)
returns public.invoices language plpgsql security definer set search_path = '' as $$
begin
  if not public.mfa_access_allowed() then raise exception 'MFA required' using errcode = '42501'; end if;
  return public.cancel_invoice_internal(p_invoice_id, p_reason);
end;
$$;
revoke all on function public.issue_invoice(uuid), public.cancel_invoice(uuid, text) from public, anon;
grant execute on function public.issue_invoice(uuid), public.cancel_invoice(uuid, text) to authenticated;
