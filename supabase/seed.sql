-- DEVELOPMENT SAMPLE DATA ONLY. This does nothing unless demo@example.invalid already exists in auth.users.
do $$
declare demo_owner uuid; demo_company uuid; demo_app uuid;
begin
  select id into demo_owner from auth.users where email = 'demo@example.invalid' limit 1;
  if demo_owner is null then raise notice 'Skipping sample seed: create demo@example.invalid first if desired.'; return; end if;
  insert into public.profiles(id,email,full_name) values (demo_owner,'demo@example.invalid','Sample User') on conflict do nothing;
  insert into public.companies(owner_id,name) values (demo_owner,'SAMPLE — Atlas Labs') on conflict (owner_id,name) do update set name=excluded.name returning id into demo_company;
  insert into public.applications(owner_id,company_id,role_title,stage,priority,tags,description) values (demo_owner,demo_company,'SAMPLE — Senior Product Designer','Interview','High',array['SAMPLE'], 'Fictional development record; not a live job.') returning id into demo_app;
  insert into public.tasks(owner_id,application_id,title,kind,due_at) values (demo_owner,demo_app,'SAMPLE — Prepare portfolio walkthrough','interview_prep',now()+interval '1 day');
end $$;
