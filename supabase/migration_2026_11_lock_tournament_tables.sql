-- ============================================================
-- HOOX: lock down tournaments, series, registrations and submissions
-- Project: Hoox (iefjracmxpkpwndrksps)
-- Idempotent: safe to re-run. Safe to run before or after the code deploy:
-- the website only READS these tables with the public key.
--
-- Before this, anyone with the public (anon) key, which ships in the
-- website's JavaScript, could create, change or delete any tournament,
-- series, registration or catch submission with a direct API call.
-- After this the public key can only read them. Every write goes through
-- the HOOX server, which checks who is signed in:
--   /api/tournaments, /api/series                 directors (own) and admins
--   /api/tournaments/:id/registrations            anglers register themselves
--   /api/tournaments/:id/submissions              registered anglers submit catches
--   /api/submissions/:id                          director, their judges, admins review
-- ============================================================

-- 1. Link registrations and catches to the angler's account ------------------
-- ("angler" stays as the name shown on leaderboards)
alter table public.registrations add column if not exists angler_id text;
alter table public.submissions   add column if not exists angler_id text;
create unique index if not exists registrations_one_per_angler_idx
  on public.registrations (tournament_id, angler_id) where angler_id is not null;
create index if not exists submissions_angler_idx on public.submissions (angler_id);

-- 2. Public key: read only ------------------------------------------------------
revoke insert, update, delete on public.tournaments   from anon, authenticated;
revoke insert, update, delete on public.series        from anon, authenticated;
revoke insert, update, delete on public.registrations from anon, authenticated;
revoke insert, update, delete on public.submissions   from anon, authenticated;

drop policy if exists "Anyone can create tournament"  on public.tournaments;
drop policy if exists "Anyone can update tournaments" on public.tournaments;
drop policy if exists "Anyone can delete tournaments" on public.tournaments;
drop policy if exists "Anyone can create series"      on public.series;
drop policy if exists "Anyone can register"           on public.registrations;
drop policy if exists "Anyone can delete registrations" on public.registrations;
drop policy if exists "Anyone can submit"             on public.submissions;
drop policy if exists "Anyone can update submissions" on public.submissions;
drop policy if exists "Anyone can delete submissions" on public.submissions;

-- Supabase's default grants also give the public key TRUNCATE, REFERENCES and
-- TRIGGER on every table. The app never needs them; remove them everywhere,
-- including on tables created later.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke truncate, references, trigger on tables from anon, authenticated;

-- Leftover from the original schema (users writes were closed by the secure-passwords migration)
drop policy if exists "Anyone can delete users" on public.users;

-- Check: should list only SELECT for anon on these four tables
select table_name, string_agg(privilege_type, ', ' order by privilege_type) as anon_privileges
  from information_schema.role_table_grants
 where grantee = 'anon' and table_schema = 'public'
   and table_name in ('tournaments', 'series', 'registrations', 'submissions')
 group by table_name;
