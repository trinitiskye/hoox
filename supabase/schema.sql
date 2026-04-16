-- ============================================================
-- FishTournament Pro - Supabase Schema
-- Run this in your Supabase project: SQL Editor > New query
-- Project: Hoox (iefjracmxpkpwndrksps)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  password_hash text,
  role text not null default 'angler' check (role in ('angler', 'director', 'admin', 'sponsor')),
  status text not null default 'active' check (status in ('active', 'pending', 'inactive', 'paused')),
  organization text,
  address text,
  city text,
  state text,
  zip text,
  phone text,
  website text,
  avatar text,
  message text,
  banner_image text,
  banner_start_date date,
  banner_end_date date,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TOURNAMENTS TABLE
-- ============================================================
create table if not exists public.tournaments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  location text,
  city text,
  state text,
  species text,
  fish_types text[],
  start_date date not null,
  start_time time not null default '06:00',
  end_date date not null,
  end_time time not null default '18:00',
  timezone text default 'America/Chicago',
  registration_fee numeric(10,2),
  entry_fee numeric(10,2),
  max_participants integer,
  image text,
  created_by text not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'completed')),
  director_fee_percentage numeric(5,2) default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SERIES TABLE
-- ============================================================
create table if not exists public.series (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_by text not null,
  tournament_ids uuid[],
  created_at timestamptz not null default now()
);

-- ============================================================
-- REGISTRATIONS TABLE
-- ============================================================
create table if not exists public.registrations (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  angler text not null,
  fee numeric(10,2),
  app_owner_cut numeric(10,2),
  director_receives numeric(10,2),
  registered_at timestamptz not null default now()
);

-- ============================================================
-- SUBMISSIONS TABLE
-- ============================================================
create table if not exists public.submissions (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  angler text not null,
  species text not null,
  size numeric(6,2) not null,
  catch_date date not null,
  catch_time time not null,
  location text,
  image text,
  photo text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS
alter table public.users enable row level security;
alter table public.tournaments enable row level security;
alter table public.series enable row level security;
alter table public.registrations enable row level security;
alter table public.submissions enable row level security;

-- PUBLIC READ policies (anon key can read all public data)
create policy "Public can read users" on public.users for select using (true);
create policy "Public can read tournaments" on public.tournaments for select using (true);
create policy "Public can read series" on public.series for select using (true);
create policy "Public can read registrations" on public.registrations for select using (true);
create policy "Public can read submissions" on public.submissions for select using (true);

-- SERVICE ROLE has full access (used server-side / from our API)
-- These are implicit when using the service_role key, no policy needed.

-- ANON INSERT policies (for registration, submission, user creation)
create policy "Anyone can create user" on public.users for insert with check (true);
create policy "Anyone can register" on public.registrations for insert with check (true);
create policy "Anyone can submit" on public.submissions for insert with check (true);
create policy "Anyone can create tournament" on public.tournaments for insert with check (true);
create policy "Anyone can create series" on public.series for insert with check (true);

-- UPDATE policies (use service role key from API routes for admin ops)
create policy "Anyone can update users" on public.users for update using (true);
create policy "Anyone can update tournaments" on public.tournaments for update using (true);
create policy "Anyone can update submissions" on public.submissions for update using (true);

-- DELETE policies
create policy "Anyone can delete users" on public.users for delete using (true);
create policy "Anyone can delete tournaments" on public.tournaments for delete using (true);
create policy "Anyone can delete registrations" on public.registrations for delete using (true);
create policy "Anyone can delete submissions" on public.submissions for delete using (true);

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index if not exists idx_tournaments_status on public.tournaments(status);
create index if not exists idx_tournaments_start_date on public.tournaments(start_date);
create index if not exists idx_registrations_tournament_id on public.registrations(tournament_id);
create index if not exists idx_submissions_tournament_id on public.submissions(tournament_id);
create index if not exists idx_submissions_status on public.submissions(status);
create index if not exists idx_users_role on public.users(role);
create index if not exists idx_users_email on public.users(email);

-- ============================================================
-- SAMPLE DATA (optional - remove before production)
-- ============================================================
insert into public.users (id, name, email, role, status, organization, created_at) values
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@fishtournament.com', 'admin', 'active', 'FishTournament Pro', now()),
  ('00000000-0000-0000-0000-000000000002', 'John Smith', 'john.smith@example.com', 'director', 'active', 'Lake Pleasant Fishing Club', now()),
  ('00000000-0000-0000-0000-000000000003', 'Mike Johnson', 'mike.johnson@example.com', 'angler', 'active', null, now()),
  ('00000000-0000-0000-0000-000000000004', 'Sarah Williams', 'sarah.williams@example.com', 'angler', 'active', null, now())
on conflict (email) do nothing;
