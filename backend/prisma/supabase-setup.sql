-- ============================================================================
-- Supabase setup — run AFTER `prisma migrate` (or `prisma db push`) has created
-- the public.profiles / mock_tests / attempts tables.
--
-- Run this in the Supabase dashboard:  SQL Editor -> New query -> paste -> Run.
--
-- It does two things:
--   1) Auto-creates a public.profiles row whenever a new auth.users row appears.
--   2) Enables Row Level Security (defense-in-depth). The backend connects with
--      a privileged role that BYPASSES RLS and scopes every query to the user in
--      code, so these policies are a second line of defense (e.g. if anon/auth
--      keys ever touch these tables directly).
-- ============================================================================

-- 1) Profile auto-provisioning trigger ---------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users that already exist.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- 2) Row Level Security ------------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.attempts  enable row level security;
alter table public.mock_tests enable row level security;

-- Profiles: a user can see/update only their own row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Attempts: a user can read/write only their own attempts.
drop policy if exists "attempts_all_own" on public.attempts;
create policy "attempts_all_own" on public.attempts
  for all using (auth.uid() = "userId") with check (auth.uid() = "userId");

-- Mock tests: no direct client access (only the service-role backend reads them).
-- With RLS enabled and no policy, anon/auth keys get nothing; service role bypasses.
