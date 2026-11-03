-- ============================================================
-- HOOX fish species list — run once in Supabase SQL Editor
-- Project: Hoox (iefjracmxpkpwndrksps)
-- Idempotent: safe to re-run (existing species are left as they are).
--
-- Creates public.fish_species, the master list used by the Species filter
-- on /tournaments and /search. Managed in Admin → Tournaments → Fish
-- Species (add, rename, hide, delete). Seeded with common species.
--
-- Security: RLS on, no public policies. Reads go through
-- src/app/api/species (public, active species only); writes go through
-- src/app/api/admin/species/** (admin session required).
-- ============================================================

create table if not exists public.fish_species (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null default 'freshwater'
                check (category in ('freshwater', 'saltwater', 'both')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists fish_species_name_unique on public.fish_species (lower(name));

create or replace function public.fish_species_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists fish_species_touch_updated_at on public.fish_species;
create trigger fish_species_touch_updated_at
  before update on public.fish_species
  for each row execute function public.fish_species_touch_updated_at();

alter table public.fish_species enable row level security;
-- Intentionally no policies: only the service role (server API routes) can access.

insert into public.fish_species (name, category) values
  ('Largemouth Bass', 'freshwater'),
  ('Smallmouth Bass', 'freshwater'),
  ('Spotted Bass', 'freshwater'),
  ('Striped Bass', 'freshwater'),
  ('White Bass', 'freshwater'),
  ('Hybrid Striped Bass', 'freshwater'),
  ('Crappie', 'freshwater'),
  ('Bluegill', 'freshwater'),
  ('Yellow Perch', 'freshwater'),
  ('Walleye', 'freshwater'),
  ('Sauger', 'freshwater'),
  ('Northern Pike', 'freshwater'),
  ('Muskellunge', 'freshwater'),
  ('Channel Catfish', 'freshwater'),
  ('Blue Catfish', 'freshwater'),
  ('Flathead Catfish', 'freshwater'),
  ('Rainbow Trout', 'freshwater'),
  ('Brown Trout', 'freshwater'),
  ('Brook Trout', 'freshwater'),
  ('Lake Trout', 'freshwater'),
  ('Cutthroat Trout', 'freshwater'),
  ('Carp', 'freshwater'),
  ('Redfish', 'saltwater'),
  ('Speckled Trout', 'saltwater'),
  ('Flounder', 'saltwater'),
  ('Snook', 'saltwater'),
  ('Tarpon', 'saltwater'),
  ('Sheepshead', 'saltwater'),
  ('Black Drum', 'saltwater'),
  ('Red Snapper', 'saltwater'),
  ('Grouper', 'saltwater'),
  ('King Mackerel', 'saltwater'),
  ('Spanish Mackerel', 'saltwater'),
  ('Cobia', 'saltwater'),
  ('Mahi-Mahi', 'saltwater'),
  ('Wahoo', 'saltwater'),
  ('Yellowfin Tuna', 'saltwater'),
  ('Bluefin Tuna', 'saltwater'),
  ('Yellowtail', 'saltwater'),
  ('Sailfish', 'saltwater'),
  ('Blue Marlin', 'saltwater'),
  ('White Marlin', 'saltwater'),
  ('Halibut', 'saltwater'),
  ('Lingcod', 'saltwater'),
  ('Rockfish', 'saltwater'),
  ('Calico Bass', 'saltwater'),
  ('Bluefish', 'saltwater'),
  ('Steelhead', 'both'),
  ('Chinook Salmon', 'both'),
  ('Coho Salmon', 'both'),
  ('Sockeye Salmon', 'both')
on conflict do nothing;
