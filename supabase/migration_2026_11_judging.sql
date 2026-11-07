-- ============================================================
-- HOOX: judging — per-species catch limits + tournament judges
-- Idempotent: safe to re-run. Safe before or after the code deploy.
--
--   tournaments.species_limits  jsonb { "Largemouth Bass": 3, ... }
--                                (the overall catch limit stays in fish_limit)
--   tournament_judges           judges assigned to a tournament
--       user_id set   → an existing HOOX judge account (status 'assigned')
--       user_id null  → invited by email (status 'invited'); linked when they
--                       create their judge account with that email
-- Written only by the server (service role); no public access.
-- ============================================================

alter table public.tournaments add column if not exists species_limits jsonb not null default '{}';

create table if not exists public.tournament_judges (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id       uuid references public.users(id) on delete set null,
  email         text not null,
  name          text,
  status        text not null default 'invited' check (status in ('invited', 'assigned')),
  invited_by    uuid references public.users(id) on delete set null,
  invited_at    timestamptz not null default now(),
  accepted_at   timestamptz
);
create unique index if not exists tournament_judges_one_per_email on public.tournament_judges (tournament_id, lower(email));
create index if not exists tournament_judges_user_idx on public.tournament_judges (user_id);
create index if not exists tournament_judges_email_idx on public.tournament_judges (lower(email));

alter table public.tournament_judges enable row level security;
revoke all on public.tournament_judges from anon, authenticated;
