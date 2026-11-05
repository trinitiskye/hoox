-- ============================================================
-- HOOX: team entries, judging by length and/or weight, prizes and side pots
-- Project: Hoox (iefjracmxpkpwndrksps)
-- Idempotent: safe to re-run. Safe before or after the code deploy.
-- Requires migration_2026_11_lock_tournament_tables.sql (angler_id columns).
--
-- Tournaments gain a format (src/lib/tournamentFormat.ts):
--   entry_type individual | team, team_min/team_max, fee_basis per_entry | per_angler,
--   scoring weight | length | both, primary_measure, fish_limit,
--   place_prizes (jsonb list), side_pots (jsonb list of pots and bonus awards)
-- Teams: public.teams + public.team_members (captain invites teammates by email).
-- Registrations: one per individual angler, or one per team (team_id).
-- Catches: weight_lb and/or length_in, credited to the angler and their team.
-- ============================================================

-- 1. Tournament format ------------------------------------------------------
alter table public.tournaments add column if not exists entry_type      text    not null default 'individual';
alter table public.tournaments add column if not exists team_min        integer not null default 1;
alter table public.tournaments add column if not exists team_max        integer not null default 1;
alter table public.tournaments add column if not exists fee_basis       text    not null default 'per_entry';
alter table public.tournaments add column if not exists scoring         text    not null default 'weight';
alter table public.tournaments add column if not exists primary_measure text    not null default 'weight';
alter table public.tournaments add column if not exists fish_limit      integer;
alter table public.tournaments add column if not exists place_prizes    jsonb   not null default '[]';
alter table public.tournaments add column if not exists side_pots       jsonb   not null default '[]';

do $$ begin
  alter table public.tournaments add constraint tournaments_entry_type_chk check (entry_type in ('individual', 'team'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.tournaments add constraint tournaments_scoring_chk check (scoring in ('weight', 'length', 'both') and primary_measure in ('weight', 'length'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.tournaments add constraint tournaments_team_size_chk check (team_min >= 1 and team_max >= team_min and team_max <= 20);
exception when duplicate_object then null; end $$;

-- 2. Teams ------------------------------------------------------------------
create table if not exists public.teams (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references public.tournaments(id) on delete cascade,
  name           text not null,
  captain_id     text not null,
  created_at     timestamptz not null default now()
);
create index if not exists teams_tournament_idx on public.teams (tournament_id);

create table if not exists public.team_members (
  id             uuid primary key default gen_random_uuid(),
  team_id        uuid not null references public.teams(id) on delete cascade,
  tournament_id  uuid not null references public.tournaments(id) on delete cascade,
  user_id        text,                       -- set once they accept (or when added by account)
  email          text not null,              -- invite address (lowercase)
  name           text,                       -- display name once known
  role           text not null default 'member',   -- captain | member
  status         text not null default 'invited',  -- invited | accepted | declined | removed
  invited_by     text,
  invited_at     timestamptz not null default now(),
  responded_at   timestamptz
);
do $$ begin
  alter table public.team_members add constraint team_members_status_chk check (status in ('invited', 'accepted', 'declined', 'removed') and role in ('captain', 'member'));
exception when duplicate_object then null; end $$;
create index if not exists team_members_team_idx on public.team_members (team_id);
create index if not exists team_members_email_idx on public.team_members (lower(email));
-- An angler can only be on one team per tournament
create unique index if not exists team_members_one_team_idx on public.team_members (tournament_id, user_id) where status = 'accepted' and user_id is not null;

-- 3. Registrations: team link and side pots ---------------------------------
alter table public.registrations add column if not exists team_id       uuid references public.teams(id) on delete cascade;
alter table public.registrations add column if not exists side_pots     text[] not null default '{}';
alter table public.registrations add column if not exists side_pot_fees numeric(10,2) not null default 0;
create unique index if not exists registrations_one_per_team_idx on public.registrations (team_id) where team_id is not null;

-- 4. Catches: weight and/or length, and the team they count for --------------
alter table public.submissions add column if not exists weight_lb numeric(8,2);
alter table public.submissions add column if not exists length_in numeric(8,2);
alter table public.submissions add column if not exists team_id   uuid references public.teams(id) on delete set null;
create index if not exists submissions_team_idx on public.submissions (team_id);

-- 5. Access ---------------------------------------------------------------------
-- Teams and members (which hold invite emails) are only read and written by the
-- HOOX server. Public pages get team names and standings from
-- /api/tournaments/:id/leaderboard.
alter table public.teams        enable row level security;
alter table public.team_members enable row level security;
revoke all on public.teams, public.team_members from anon, authenticated;
