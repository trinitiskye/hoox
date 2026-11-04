-- ============================================================
-- HOOX Affiliate Program — run once in Supabase SQL Editor
-- Project: Hoox (iefjracmxpkpwndrksps)
-- Idempotent: safe to re-run.
--
--   public.affiliates           people/orgs who refer tournament directors (applications + approved)
--   public.affiliate_referrals  which director each affiliate referred, with the rate and window locked in
--   public.affiliate_payouts    money HOOX has paid each affiliate
--   site_settings 'affiliate_program'  default rate, earning window, minimum payout … (saved from the admin)
--
-- Commissions are calculated from public.registrations (HOOX's cut × rate),
-- so nothing here has to be kept in sync with registrations.
-- RLS is on with no public policies: only the HOOX API (service role) reads or writes.
-- ============================================================

create table if not exists public.affiliates (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  name            text not null,
  email           text not null,
  phone           text,
  organization    text,
  website         text,
  audience        text,
  rate_percent    numeric(5,2) not null default 20,
  window_months   integer not null default 12,
  status          text not null default 'pending',
  source          text not null default 'web',
  payout_method   text,
  payout_details  text,
  notes           text,
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
do $$ begin
  alter table public.affiliates add constraint affiliates_status_chk check (status in ('pending', 'active', 'paused', 'declined'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.affiliates add constraint affiliates_rate_chk check (rate_percent >= 0 and rate_percent <= 100);
exception when duplicate_object then null; end $$;
create unique index if not exists affiliates_email_idx on public.affiliates (lower(email));

create table if not exists public.affiliate_referrals (
  id              uuid primary key default gen_random_uuid(),
  affiliate_id    uuid not null references public.affiliates(id) on delete restrict,
  director_id     text not null,               -- public.users.id of the referred tournament director
  director_name   text not null,
  director_email  text,
  referred_at     date not null default current_date,
  rate_percent    numeric(5,2) not null,
  window_months   integer not null,
  source          text not null default 'link', -- 'link' (signed up with the referral link) | 'admin'
  status          text not null default 'active',
  created_at      timestamptz not null default now()
);
do $$ begin
  alter table public.affiliate_referrals add constraint affiliate_referrals_status_chk check (status in ('active', 'removed'));
exception when duplicate_object then null; end $$;
-- A director can only be credited to one affiliate at a time
create unique index if not exists affiliate_referrals_director_idx on public.affiliate_referrals (director_id) where status = 'active';
create index if not exists affiliate_referrals_affiliate_idx on public.affiliate_referrals (affiliate_id);

create table if not exists public.affiliate_payouts (
  id              uuid primary key default gen_random_uuid(),
  affiliate_id    uuid not null references public.affiliates(id) on delete restrict,
  amount          numeric(10,2) not null check (amount > 0),
  method          text,
  reference       text,
  paid_at         date not null default current_date,
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists affiliate_payouts_affiliate_idx on public.affiliate_payouts (affiliate_id);

create or replace function public.affiliates_touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists affiliates_touch on public.affiliates;
create trigger affiliates_touch before update on public.affiliates for each row execute function public.affiliates_touch_updated_at();

alter table public.affiliates          enable row level security;
alter table public.affiliate_referrals enable row level security;
alter table public.affiliate_payouts   enable row level security;
