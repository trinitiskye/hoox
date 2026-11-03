-- ============================================================
-- HOOX "Submit your Event" requests — run once in Supabase SQL Editor
-- Project: Hoox (iefjracmxpkpwndrksps)
-- Idempotent: safe to re-run.
--
-- Creates:
--   1) public.event_submissions — one row per expo / trade show / boat show
--      request submitted from /events/submit
--   2) storage bucket "event-submissions" (public read) for the logo and
--      16:9 hero image organizers upload with their request. Files use
--      random, unguessable paths and are only ever linked from the admin view
--      until a submission is approved.
--
-- Security model:
--   - RLS is ON with NO public policies: the anon key can neither read nor
--     write this table. Submissions contain organizer contact details.
--   - The public form posts to src/app/api/event-submissions, which validates
--     the input and inserts with the service-role key.
--   - Admins review submissions through src/app/api/admin/event-submissions/**,
--     which checks the signed admin session.
-- ============================================================

create table if not exists public.event_submissions (
  id                  uuid primary key default gen_random_uuid(),
  status              text not null default 'new'
                        check (status in ('new', 'in_review', 'approved', 'declined')),

  -- 1. Contact
  contact_name        text not null,
  contact_title       text,
  contact_email       text not null,
  contact_phone       text,
  organization        text not null,
  organization_website text,

  -- 2. Event
  event_name          text not null,
  event_type          text not null,
  start_date          date not null,
  end_date            date not null,
  daily_hours         text,
  venue_name          text not null,
  address             text,
  city                text not null,
  state               text not null,
  zip                 text,
  country             text not null default 'US',
  short_description   text not null,
  long_description    text,
  ticket_url          text,
  ticket_price        text,
  expected_attendance integer,
  exhibitor_count     integer,
  fishing_focus       text[] not null default '{}',
  social_links        text,

  -- 3. Media
  logo_url            text,
  hero_image_url      text,
  hero_alt_text       text,

  -- 4. Promotion requested
  packages            text[] not null default '{}',
  preferred_start     date,
  preferred_end       date,
  promo_code          text,
  billing_name        text,
  billing_email       text,
  notes               text,

  -- 5. Agreements
  agreed_rights       boolean not null default false,
  agreed_terms        boolean not null default false,
  marketing_opt_in    boolean not null default false,

  -- Admin review
  admin_notes         text,
  reviewed_at         timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint event_submissions_dates_chk check (end_date >= start_date)
);

create index if not exists event_submissions_status_created_idx
  on public.event_submissions (status, created_at desc);

create or replace function public.event_submissions_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists event_submissions_touch_updated_at on public.event_submissions;
create trigger event_submissions_touch_updated_at
  before update on public.event_submissions
  for each row execute function public.event_submissions_touch_updated_at();

alter table public.event_submissions enable row level security;
-- Intentionally no policies: only the service role (server API routes) can access.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-submissions', 'event-submissions', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])  -- no SVG: it can carry scripts
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
