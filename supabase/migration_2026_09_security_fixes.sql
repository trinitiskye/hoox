-- ============================================================
-- HOOX security & schema-drift fixes — run in Supabase SQL Editor
-- Project: Hoox (iefjracmxpkpwndrksps)
-- Safe to run once against the live database; each step is idempotent.
-- ============================================================

-- 1) Allow the roles/statuses the app actually uses.
--    Without this, judge registrations and the admin "Ban" action
--    fail with a check-constraint violation.
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role in ('angler', 'director', 'admin', 'sponsor', 'judge'));

alter table public.users drop constraint if exists users_status_check;
alter table public.users add constraint users_status_check
  check (status in ('active', 'pending', 'inactive', 'paused', 'banned'));

-- 2) Close the privilege-escalation hole: the anon (public) API key is
--    shipped in the browser bundle, so today ANYONE can call the
--    Supabase REST API directly and either create a brand-new user
--    row with role='admin', or flip an existing user's role to
--    'admin' — completely bypassing the app's login/registration UI.
--    This blocks both paths at the database level. It does not
--    affect any real flow in the app: no current insert or update in
--    the codebase ever sets role to 'admin'.
drop policy if exists "Anyone can create user" on public.users;
create policy "Anyone can create user" on public.users
  for insert with check (role <> 'admin');

drop policy if exists "Anyone can update users" on public.users;
create policy "Anyone can update users" on public.users
  for update using (true) with check (role <> 'admin');

-- ============================================================
-- NOT fixed by this script — read before assuming you're covered:
--
-- The app authenticates entirely in browser JavaScript with the
-- public anon key. That means, independent of the policy change
-- above:
--   - Any visitor can still UPDATE or DELETE any tournament,
--     registration, or submission row (and non-role fields on any
--     user row, including their password hash) via a direct REST
--     call, because those policies still read "using (true))" with
--     no way to tell a real admin/director apart from anyone else
--     at the database level.
--   - Every user's password hash is readable by anyone who calls
--     the REST API, because the app's own login flow reads it
--     client-side to verify passwords in the browser. Since the
--     hashing scheme (src/lib/auth.ts) is a non-cryptographic,
--     reversible scheme, that means every password is effectively
--     public.
--
-- Closing those requires moving login and privileged writes (ban,
-- edit tournament, approve/deny submissions, delete anything) into
-- server-side API routes that use the SUPABASE_SERVICE_ROLE_KEY and
-- check the caller's session themselves — the anon key would then
-- lose update/delete access entirely. That's a real follow-up
-- project, not a one-line policy change.
-- ============================================================
