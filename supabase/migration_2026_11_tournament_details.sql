-- ============================================================
-- HOOX: tournament page details + water type
-- Project: Hoox (iefjracmxpkpwndrksps)
-- Idempotent: safe to re-run. Safe before or after the code deploy.
--
--   water_type  freshwater | saltwater
--   details     jsonb: badge, hero summary, skill level, address, schedule,
--               species notes, rules, registration deadline, fee note,
--               prize pool and payout note, host contact, presenting sponsor
--               (src/lib/tournamentDetails.ts)
-- ============================================================

alter table public.tournaments add column if not exists water_type text;
alter table public.tournaments add column if not exists details    jsonb not null default '{}';

do $$ begin
  alter table public.tournaments add constraint tournaments_water_type_chk check (water_type is null or water_type in ('freshwater', 'saltwater'));
exception when duplicate_object then null; end $$;
