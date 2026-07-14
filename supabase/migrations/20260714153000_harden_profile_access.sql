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

revoke update on public.profiles from authenticated;
grant update (email, full_name, onboarding_completed_at) on public.profiles to authenticated;
revoke insert on public.profiles from authenticated;
grant insert (id, email, full_name, onboarding_completed_at) on public.profiles to authenticated;

notify pgrst, 'reload schema';
