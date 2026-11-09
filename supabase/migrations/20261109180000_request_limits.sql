-- Apply to a test project before enabling this release. No client can reset its own counters.
create table if not exists public.request_limits (
  key text primary key,
  hits integer not null,
  expires_at timestamptz not null
);
create index if not exists request_limits_expiry on public.request_limits(expires_at);
alter table public.request_limits enable row level security;
revoke all on public.request_limits from anon, authenticated;

create or replace function public.consume_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  bucket public.request_limits;
  ts timestamptz := clock_timestamp();
begin
  if p_limit < 1 or p_window_seconds < 1 or p_window_seconds > 86400 or length(p_key) <> 64 then
    raise exception 'invalid rate policy';
  end if;
  -- TTL reclamation is bounded per request; the expiry index avoids a full table scan.
  delete from public.request_limits where key in (
    select key from public.request_limits where expires_at < ts order by expires_at limit 100
  );
  insert into public.request_limits(key, hits, expires_at)
    values(p_key, 1, ts + make_interval(secs => p_window_seconds))
  on conflict (key) do update set
    hits = case when request_limits.expires_at <= ts then 1 else least(request_limits.hits + 1, p_limit + 1) end,
    expires_at = case when request_limits.expires_at <= ts then ts + make_interval(secs => p_window_seconds) else request_limits.expires_at end
  returning * into bucket;
  return jsonb_build_object('allowed', bucket.hits <= p_limit,
    'retry_after', greatest(1, ceil(extract(epoch from bucket.expires_at - ts))::integer));
end;
$$;
revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
