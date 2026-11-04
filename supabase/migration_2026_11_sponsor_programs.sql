-- ============================================================
-- HOOX Sponsor Programs — run once in Supabase SQL Editor
-- Project: Hoox (iefjracmxpkpwndrksps)
-- Idempotent: safe to re-run.
--
--   public.sponsor_accounts    brands that sponsor HOOX (customer accounts)
--   public.sponsor_promotions  each sponsor tier or brand placement sold / proposed
--   site_settings 'sponsor_packages'  editable packages & prices (saved from the admin)
--
-- RLS is on with no public policies: only the admin API (service role) reads or writes.
-- ============================================================

create table if not exists public.sponsor_accounts (
  id             uuid primary key default gen_random_uuid(),
  brand_name     text not null,
  website        text,
  logo_url       text,
  category       text,
  contact_name   text,
  contact_email  text,
  contact_phone  text,
  status         text not null default 'prospect',
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

do $$ begin
  alter table public.sponsor_accounts add constraint sponsor_accounts_status_chk
    check (status in ('prospect', 'active', 'inactive'));
exception when duplicate_object then null; end $$;

create table if not exists public.sponsor_promotions (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid not null references public.sponsor_accounts(id) on delete restrict,
  kind           text not null,                -- 'tier' | 'placement'
  package_id     text not null,
  package_name   text not null,
  option_label   text,
  term_months    integer not null default 0,   -- 0 = one-time (per tournament, per send …)
  target         text,                         -- which tournament / series / newsletter
  price          numeric(10,2) not null default 0,
  start_date     date not null,
  end_date       date not null,
  status         text not null default 'proposal',
  booked_at      timestamptz,
  amount_paid    numeric(10,2),
  paid_at        timestamptz,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

do $$ begin
  alter table public.sponsor_promotions add constraint sponsor_promotions_kind_chk check (kind in ('tier', 'placement'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.sponsor_promotions add constraint sponsor_promotions_status_chk check (status in ('proposal', 'booked', 'cancelled'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.sponsor_promotions add constraint sponsor_promotions_dates_chk check (end_date >= start_date);
exception when duplicate_object then null; end $$;

create index if not exists sponsor_promotions_account_idx on public.sponsor_promotions (account_id);
create index if not exists sponsor_promotions_status_idx  on public.sponsor_promotions (status, end_date);

-- keep updated_at current
create or replace function public.sponsor_touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists sponsor_accounts_touch on public.sponsor_accounts;
create trigger sponsor_accounts_touch before update on public.sponsor_accounts for each row execute function public.sponsor_touch_updated_at();
drop trigger if exists sponsor_promotions_touch on public.sponsor_promotions;
create trigger sponsor_promotions_touch before update on public.sponsor_promotions for each row execute function public.sponsor_touch_updated_at();

alter table public.sponsor_accounts   enable row level security;
alter table public.sponsor_promotions enable row level security;
