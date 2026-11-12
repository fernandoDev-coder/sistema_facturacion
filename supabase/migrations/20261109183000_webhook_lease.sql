alter table public.billing_events add column processing_token uuid;
alter table public.billing_events add column processing_until timestamptz;

create function public.claim_billing_event(p_event_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare event public.billing_events; token uuid := gen_random_uuid();
begin
  select * into event from public.billing_events where event_id = p_event_id for update;
  if not found then raise exception 'event missing'; end if;
  if event.processed_at is not null then return jsonb_build_object('status','done'); end if;
  if event.processing_until > clock_timestamp() then return jsonb_build_object('status','busy'); end if;
  update public.billing_events set processing_token = token, processing_until = clock_timestamp() + interval '5 minutes'
    where event_id = p_event_id;
  return jsonb_build_object('status','acquired','token',token);
end;
$$;
create function public.finish_billing_event(p_event_id text, p_token uuid, p_error text default null)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.billing_events set processing_token = null, processing_until = null,
    processed_at = case when p_error is null then clock_timestamp() else null end,
    processing_error = p_error
    where event_id = p_event_id and processing_token = p_token;
  return found;
end;
$$;
revoke all on function public.claim_billing_event(text), public.finish_billing_event(text,uuid,text) from public, anon, authenticated;
grant execute on function public.claim_billing_event(text), public.finish_billing_event(text,uuid,text) to service_role;
