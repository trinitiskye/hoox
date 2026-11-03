-- ============================================================
-- HOOX "Feature your Club" requests — run once in Supabase SQL Editor
-- Project: Hoox (iefjracmxpkpwndrksps)
-- Idempotent: safe to re-run. Requires migration_2026_11_club_submissions.sql.
--
-- Creates:
--   1) public.club_feature_requests — one row per request sent from
--      /clubs/feature by a signed-in Angler or Tournament Director.
--   2) featured / featured_until on public.club_submissions. Approving a
--      request that's linked to a listed club turns featuring on for the
--      plan's length; the /clubs page and home page Featured Clubs row
--      read these through src/app/api/clubs.
--
-- Security model: RLS on, no public policies. Writes go through
-- src/app/api/club-feature-requests (signed session required) and
-- src/app/api/admin/club-feature-requests/** (admin session required).
-- ============================================================

alter table public.club_submissions add column if not exists featured boolean not null default false;
alter table public.club_submissions add column if not exists featured_until date;

create table if not exists public.club_feature_requests (
  id               uuid primary key default gen_random_uuid(),
  status           text not null default 'new'
                     check (status in ('new', 'in_review', 'approved', 'declined')),

  requested_by     uuid not null references public.users(id) on delete cascade,
  requester_name   text not null,
  requester_email  text not null,
  requester_role   text not null,
  contact_phone    text,

  -- The club: a listed club (preferred) or just a name for one not on HOOX yet
  club_submission_id uuid references public.club_submissions(id) on delete set null,
  club_name        text not null,

  plan             text not null check (plan in ('monthly', 'season', 'annual')),
  start_date       date,
  promo_code       text,
  notes            text,

  admin_notes      text,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists club_feature_requests_status_created_idx
  on public.club_feature_requests (status, created_at desc);

create or replace function public.club_feature_requests_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists club_feature_requests_touch_updated_at on public.club_feature_requests;
create trigger club_feature_requests_touch_updated_at
  before update on public.club_feature_requests
  for each row execute function public.club_feature_requests_touch_updated_at();

alter table public.club_feature_requests enable row level security;
-- Intentionally no policies: only the service role (server API routes) can access.
