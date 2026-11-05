-- ============================================================
-- HOOX: vessel types for tournaments and series (Kayak, Powerboat …)
-- Project: Hoox (iefjracmxpkpwndrksps)
-- Idempotent: safe to re-run. Safe before or after the code deploy.
-- The list of allowed types lives in src/lib/vessels.ts.
-- ============================================================

alter table public.tournaments add column if not exists vessel_types text[] not null default '{}';
alter table public.series      add column if not exists vessel_types text[] not null default '{}';

create index if not exists tournaments_vessel_types_idx on public.tournaments using gin (vessel_types);

-- The public view of tournaments is the table itself (read-only for the public key), so nothing else to grant.
