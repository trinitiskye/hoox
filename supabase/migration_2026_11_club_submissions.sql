-- ============================================================
-- HOOX "Submit a Club" requests — run once in Supabase SQL Editor
-- Project: Hoox (iefjracmxpkpwndrksps)
-- Idempotent: safe to re-run.
--
-- Creates:
--   1) public.club_submissions — one row per club listing request sent from
--      /clubs/submit. Only signed-in Anglers and Tournament Directors can
--      submit; submitted_by links the row to their HOOX account.
--   2) storage bucket "club-submissions" (public read) for the club logo and
--      cover photo. Files use random, unguessable paths.
--
-- Security model:
--   - RLS is ON with NO public policies: the anon key can neither read nor
--     write this table.
--   - The form posts to src/app/api/club-submissions, which verifies the
--     account (signed session or email + password) and inserts with the
--     service-role key.
--   - Admins review through src/app/api/admin/club-submissions/**.
-- ============================================================

create table if not exists public.club_submissions (
  id                uuid primary key default gen_random_uuid(),
  status            text not null default 'new'
                      check (status in ('new', 'in_review', 'approved', 'declined')),

  -- Who submitted it (their HOOX account)
  submitted_by      uuid not null references public.users(id) on delete cascade,
  submitter_name    text not null,
  submitter_email   text not null,
  submitter_role    text not null,           -- 'angler' | 'director' | 'admin' at time of submission
  club_role         text,                    -- their role in the club (President, Organizer, Member…)

  -- Club
  club_name         text not null,
  city              text not null,
  state             text not null,
  country           text not null default 'US',
  styles            text[] not null default '{}',
  species           text,
  skill_level       text,
  schedule          text,
  member_count      integer,
  membership        text,                    -- 'free' | 'paid'
  dues              text,
  about             text not null,
  website           text,
  contact_email     text,
  contact_phone     text,
  social_links      text,
  logo_url          text,
  cover_image_url   text,
  agreed_authorized boolean not null default false,

  -- Admin review
  admin_notes       text,
  reviewed_at       timestamptz,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists club_submissions_status_created_idx
  on public.club_submissions (status, created_at desc);
create index if not exists club_submissions_submitted_by_idx
  on public.club_submissions (submitted_by);

create or replace function public.club_submissions_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists club_submissions_touch_updated_at on public.club_submissions;
create trigger club_submissions_touch_updated_at
  before update on public.club_submissions
  for each row execute function public.club_submissions_touch_updated_at();

alter table public.club_submissions enable row level security;
-- Intentionally no policies: only the service role (server API routes) can access.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('club-submissions', 'club-submissions', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])  -- no SVG: it can carry scripts
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
