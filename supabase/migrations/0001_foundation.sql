-- Northstar foundation. Apply to a new Supabase project with `supabase db push`.
create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.application_stage as enum ('Saved','Applied','Screening','Interview','Offer','Rejected','Withdrawn');
create type public.task_status as enum ('pending','completed','cancelled','needs_review');
create type public.task_kind as enum ('follow_up','interview_prep','general');
create type public.connection_status as enum ('connected','needs_reconnect','disconnected','error');
create type public.send_status as enum ('pending','sending','sent','failed','uncertain');
create type public.sync_status as enum ('idle','queued','running','failed','needs_full_sync');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  professional_summary text,
  skills text[] not null default '{}',
  experience jsonb not null default '[]',
  portfolio_links jsonb not null default '[]',
  email_signature text,
  preferred_tone text not null default 'Professional, warm, and concise',
  timezone text not null default 'Asia/Karachi',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null, domain text, website_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(owner_id, name), unique(id, owner_id)
);
create table public.contacts (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid, name text not null, email text, phone text, title text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id, owner_id),
  foreign key (company_id, owner_id) references public.companies(id, owner_id) on delete set null
);
create table public.resume_files (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null, original_filename text not null, mime_type text not null, size_bytes bigint not null check (size_bytes between 1 and 10485760),
  sha256 text not null, created_at timestamptz not null default now(), unique(owner_id, storage_path), unique(id, owner_id)
);
create table public.resume_versions (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  resume_file_id uuid not null, label text not null, version_number integer not null check (version_number > 0), notes text, is_default boolean not null default false,
  created_at timestamptz not null default now(), unique(owner_id, label, version_number), unique(id, owner_id),
  foreign key (resume_file_id, owner_id) references public.resume_files(id, owner_id) on delete restrict
);
create table public.applications (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null, resume_version_id uuid, role_title text not null, job_url text, description text, location text,
  work_arrangement text check (work_arrangement in ('Remote','Hybrid','On-site')), salary_min numeric, salary_max numeric,
  salary_currency char(3), source text, saved_at timestamptz not null default now(), applied_at timestamptz,
  stage public.application_stage not null default 'Saved', priority text not null default 'Normal' check (priority in ('Low','Normal','High')),
  tags text[] not null default '{}', notes text, archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (salary_min is null or salary_max is null or salary_min <= salary_max), unique(id, owner_id),
  foreign key (company_id, owner_id) references public.companies(id, owner_id) on delete restrict,
  foreign key (resume_version_id, owner_id) references public.resume_versions(id, owner_id) on delete set null
);
create table public.application_contacts (
  owner_id uuid not null references auth.users(id) on delete cascade, application_id uuid not null, contact_id uuid not null, role text,
  is_primary boolean not null default false, created_at timestamptz not null default now(), primary key(application_id, contact_id),
  foreign key (application_id, owner_id) references public.applications(id, owner_id) on delete cascade,
  foreign key (contact_id, owner_id) references public.contacts(id, owner_id) on delete cascade
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, application_id uuid,
  title text not null, description text, kind public.task_kind not null default 'general', status public.task_status not null default 'pending',
  due_at timestamptz not null, completed_at timestamptz, reminder_sent_at timestamptz, reply_message_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id, owner_id),
  foreign key (application_id, owner_id) references public.applications(id, owner_id) on delete cascade
);
create table public.interviews (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, application_id uuid not null,
  starts_at timestamptz not null, ends_at timestamptz, timezone text not null default 'Asia/Karachi', format text, location_or_url text,
  interviewer_names text[] not null default '{}', notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id, owner_id),
  foreign key (application_id, owner_id) references public.applications(id, owner_id) on delete cascade
);
create table public.email_accounts (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('gmail')), provider_account_id text not null, email_address text not null,
  status public.connection_status not null default 'connected', granted_scopes text[] not null default '{}',
  sync_query text not null default '(job OR interview OR recruiter OR application)', import_after date not null default (current_date - 90),
  sync_interval_minutes integer not null default 15 check (sync_interval_minutes between 15 and 1440), last_successful_sync_at timestamptz,
  last_error_code text, last_error_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(owner_id, provider), unique(provider, provider_account_id), unique(id, owner_id)
);
create table public.email_threads (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, email_account_id uuid not null,
  provider_thread_id text not null, subject text, snippet text, participant_emails text[] not null default '{}',
  last_message_at timestamptz not null, unread_count integer not null default 0, gmail_permalink text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(email_account_id, provider_thread_id), unique(id, owner_id),
  foreign key (email_account_id, owner_id) references public.email_accounts(id, owner_id) on delete cascade
);
create table public.email_messages (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, email_account_id uuid not null, email_thread_id uuid not null,
  provider_message_id text not null, provider_history_id text, rfc_message_id text, in_reply_to text, reference_headers text[],
  direction text not null check (direction in ('incoming','outgoing')), from_address text not null, to_addresses text[] not null default '{}',
  cc_addresses text[] not null default '{}', bcc_addresses text[] not null default '{}', reply_to_addresses text[] not null default '{}',
  subject text, sent_at timestamptz not null, received_at timestamptz, body_text text, body_html_sanitized text, snippet text,
  label_ids text[] not null default '{}', has_attachments boolean not null default false, raw_headers jsonb not null default '{}',
  created_at timestamptz not null default now(), unique(email_account_id, provider_message_id), unique(id, owner_id),
  foreign key (email_account_id, owner_id) references public.email_accounts(id, owner_id) on delete cascade,
  foreign key (email_thread_id, owner_id) references public.email_threads(id, owner_id) on delete cascade
);
alter table public.tasks add constraint tasks_reply_message_owner_fk foreign key (reply_message_id, owner_id) references public.email_messages(id, owner_id) on delete set null;
create table public.thread_applications (
  owner_id uuid not null references auth.users(id) on delete cascade, email_thread_id uuid not null, application_id uuid not null,
  association_source text not null check (association_source in ('manual','suggested')), confidence numeric check (confidence between 0 and 1), confirmed_at timestamptz,
  created_at timestamptz not null default now(), primary key(email_thread_id, application_id),
  foreign key (email_thread_id, owner_id) references public.email_threads(id, owner_id) on delete cascade,
  foreign key (application_id, owner_id) references public.applications(id, owner_id) on delete cascade
);
create table public.email_attachments (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, email_message_id uuid not null,
  provider_attachment_id text not null, filename text not null, mime_type text, size_bytes bigint, storage_path text, content_id text, created_at timestamptz not null default now(), unique(id, owner_id), unique(email_message_id, provider_attachment_id, filename),
  foreign key (email_message_id, owner_id) references public.email_messages(id, owner_id) on delete cascade
);
create table public.local_email_drafts (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, email_account_id uuid not null,
  email_thread_id uuid, application_id uuid, to_addresses text[] not null default '{}', cc_addresses text[] not null default '{}', bcc_addresses text[] not null default '{}',
  subject text, body_text text not null default '', attachment_refs jsonb not null default '[]', ai_original_body text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id, owner_id),
  foreign key (email_account_id, owner_id) references public.email_accounts(id, owner_id) on delete cascade,
  foreign key (email_thread_id, owner_id) references public.email_threads(id, owner_id) on delete set null,
  foreign key (application_id, owner_id) references public.applications(id, owner_id) on delete set null
);
create table public.outbound_send_attempts (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, email_account_id uuid not null,
  local_draft_id uuid, idempotency_key text not null, request_fingerprint text not null, status public.send_status not null default 'pending',
  provider_message_id text, provider_thread_id text, error_code text, safe_error_message text, started_at timestamptz, finished_at timestamptz,
  reconciliation_checked_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(email_account_id, idempotency_key), unique(id, owner_id),
  foreign key (email_account_id, owner_id) references public.email_accounts(id, owner_id) on delete cascade,
  foreign key (local_draft_id, owner_id) references public.local_email_drafts(id, owner_id) on delete set null
);
create table public.sync_state (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, email_account_id uuid not null,
  status public.sync_status not null default 'idle', gmail_history_id text, next_page_token text, full_sync_query text,
  full_sync_started_at timestamptz, last_attempt_at timestamptz, last_successful_at timestamptz, lock_token uuid, lock_expires_at timestamptz,
  progress_current integer not null default 0, progress_total integer, error_code text, safe_error_message text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(email_account_id), unique(id, owner_id),
  foreign key (email_account_id, owner_id) references public.email_accounts(id, owner_id) on delete cascade
);
create table public.application_activity (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, application_id uuid not null,
  activity_type text not null, summary text not null, metadata jsonb not null default '{}', occurred_at timestamptz not null default now(), created_at timestamptz not null default now(), unique(id, owner_id),
  foreign key (application_id, owner_id) references public.applications(id, owner_id) on delete cascade
);
create table public.ai_usage_metadata (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, application_id uuid,
  purpose text not null, model text not null, input_tokens integer, output_tokens integer, provider_response_id text,
  prompt_fingerprint text, created_at timestamptz not null default now(),
  foreign key (application_id, owner_id) references public.applications(id, owner_id) on delete set null
);
create table public.rate_limit_events (
  id bigint generated always as identity primary key, owner_id uuid not null references auth.users(id) on delete cascade,
  action text not null, created_at timestamptz not null default now()
);
create table private.oauth_credentials (
  account_id uuid primary key references public.email_accounts(id) on delete cascade, owner_id uuid not null references auth.users(id) on delete cascade,
  encrypted_refresh_token text not null, key_version integer not null default 1, updated_at timestamptz not null default now()
);

create index applications_owner_stage_idx on public.applications(owner_id, stage) where archived_at is null;
create index applications_owner_updated_idx on public.applications(owner_id, updated_at desc);
create index contacts_owner_email_idx on public.contacts(owner_id, lower(email));
create index tasks_owner_due_idx on public.tasks(owner_id, status, due_at);
create index interviews_owner_start_idx on public.interviews(owner_id, starts_at);
create index email_threads_account_recent_idx on public.email_threads(email_account_id, last_message_at desc);
create index email_messages_thread_sent_idx on public.email_messages(email_thread_id, sent_at);
create index email_messages_rfc_idx on public.email_messages(email_account_id, rfc_message_id) where rfc_message_id is not null;
create index activity_application_time_idx on public.application_activity(application_id, occurred_at desc);
create index rate_limit_lookup_idx on public.rate_limit_events(owner_id, action, created_at desc);

create function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['profiles','companies','contacts','applications','tasks','interviews','email_accounts','email_threads','local_email_drafts','outbound_send_attempts','sync_state'] loop execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t); end loop; end $$;

-- RLS: every exposed user table is owner-scoped. Service role bypasses RLS for background work.
do $$ declare t text; begin foreach t in array array['companies','contacts','resume_files','resume_versions','applications','application_contacts','tasks','interviews','email_accounts','email_threads','email_messages','thread_applications','email_attachments','local_email_drafts','outbound_send_attempts','sync_state','application_activity','ai_usage_metadata','rate_limit_events'] loop
  execute format('alter table public.%I enable row level security', t);
  execute format('create policy %I on public.%I for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id)', t || '_owner_all', t);
end loop; end $$;
alter table public.profiles enable row level security;
create policy profiles_owner_all on public.profiles for all to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Private token access is available only through service-role RPCs. Browser roles have no EXECUTE grant.
create function public.store_oauth_credential(p_owner_id uuid, p_account_id uuid, p_encrypted_refresh_token text, p_key_version integer default 1)
returns void language plpgsql security definer set search_path = '' as $$ begin
  insert into private.oauth_credentials(account_id, owner_id, encrypted_refresh_token, key_version) values (p_account_id, p_owner_id, p_encrypted_refresh_token, p_key_version)
  on conflict (account_id) do update set encrypted_refresh_token = excluded.encrypted_refresh_token, key_version = excluded.key_version, updated_at = now()
  where private.oauth_credentials.owner_id = excluded.owner_id;
end $$;
create function public.get_oauth_credential(p_account_id uuid) returns jsonb language sql security definer set search_path = '' stable as $$
  select jsonb_build_object('owner_id', owner_id, 'encrypted_refresh_token', encrypted_refresh_token, 'key_version', key_version) from private.oauth_credentials where account_id = p_account_id;
$$;
create function public.delete_oauth_credential(p_account_id uuid) returns void language sql security definer set search_path = '' as $$ delete from private.oauth_credentials where account_id = p_account_id; $$;
revoke all on function public.store_oauth_credential(uuid,uuid,text,integer) from public, anon, authenticated;
revoke all on function public.get_oauth_credential(uuid) from public, anon, authenticated;
revoke all on function public.delete_oauth_credential(uuid) from public, anon, authenticated;
grant execute on function public.store_oauth_credential(uuid,uuid,text,integer) to service_role;
grant execute on function public.get_oauth_credential(uuid) to service_role;
grant execute on function public.delete_oauth_credential(uuid) to service_role;

-- Private resume bucket. Objects are stored as `{auth.uid()}/...`.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types) values ('resumes','resumes',false,10485760,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']) on conflict (id) do nothing;
create policy resumes_owner_read on storage.objects for select to authenticated using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy resumes_owner_insert on storage.objects for insert to authenticated with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy resumes_owner_update on storage.objects for update to authenticated using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy resumes_owner_delete on storage.objects for delete to authenticated using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);




