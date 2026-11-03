-- ============================================================
-- HOOX editable "Feature your Club" pricing — run once in Supabase SQL Editor
-- Project: Hoox (iefjracmxpkpwndrksps)
-- Idempotent: safe to re-run. Requires migration_2026_11_club_feature_requests.sql.
--
-- Creates:
--   1) public.site_settings — small key/value store for admin-editable
--      settings. Pricing lives under key 'club_feature_pricing' and is edited
--      in Admin → Clubs → Feature your Club pricing.
--   2) price_quoted / term_months / plan_name on club_feature_requests, so a
--      request keeps the price it was made at even if pricing changes later.
--
-- Security: RLS on, no public policies. Reads/writes go through
-- src/app/api/feature-pricing (public read) and
-- src/app/api/admin/feature-pricing (admin session required).
-- ============================================================

create table if not exists public.site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_by  uuid references public.users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

alter table public.site_settings enable row level security;
-- Intentionally no policies: only the service role (server API routes) can access.

alter table public.club_feature_requests add column if not exists price_quoted numeric(10,2);
alter table public.club_feature_requests add column if not exists term_months integer;
alter table public.club_feature_requests add column if not exists plan_name text;
