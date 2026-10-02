-- Additive migration: apply before deploying the simplified email workspace.
begin;
alter table public.outbound_send_attempts
  add column if not exists to_addresses text[] not null default '{}',
  add column if not exists subject text,
  add column if not exists tracking_token text,
  add column if not exists first_opened_at timestamptz,
  add column if not exists open_count integer not null default 0,
  add column if not exists replied_at timestamptz,
  add column if not exists archived_at timestamptz;
create unique index if not exists outbound_tracking_token_idx
  on public.outbound_send_attempts(tracking_token) where tracking_token is not null;
create index if not exists outbound_owner_finished_idx
  on public.outbound_send_attempts(owner_id, finished_at desc) where status = 'sent';
create index if not exists email_threads_owner_recent_idx
  on public.email_threads(owner_id, last_message_at desc);

create table public.email_preferences (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  daily_target integer not null default 20 check (daily_target between 0 and 100000),
  monthly_target integer not null default 400 check (monthly_target between 0 and 1000000),
  updated_at timestamptz not null default now()
);
alter table public.email_preferences enable row level security;
create policy email_preferences_owner_all on public.email_preferences for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create trigger set_updated_at before update on public.email_preferences
  for each row execute function public.set_updated_at();

create table public.editable_cvs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  body_text text not null check (char_length(body_text) between 1 and 50000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.editable_cvs enable row level security;
create policy editable_cvs_owner_all on public.editable_cvs for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create trigger set_updated_at before update on public.editable_cvs
  for each row execute function public.set_updated_at();
create index editable_cvs_owner_updated_idx on public.editable_cvs(owner_id, updated_at desc);

-- Atomic open counting; deleting a tracker stops subsequent open recording.
create function public.record_workspace_mail_open(p_token text)
returns void language sql security definer set search_path = '' as $$
  update public.outbound_send_attempts
  set first_opened_at = coalesce(first_opened_at, now()), open_count = open_count + 1
  where tracking_token = p_token and status = 'sent' and archived_at is null;
$$;
revoke all on function public.record_workspace_mail_open(text) from public, anon, authenticated;
grant execute on function public.record_workspace_mail_open(text) to service_role;
commit;
