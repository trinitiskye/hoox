-- ============================================================
-- HOOX home page hero carousel — run once in Supabase SQL Editor
-- Project: Hoox (iefjracmxpkpwndrksps)
-- Idempotent: safe to re-run.
--
-- Creates:
--   1) public.hero_slides  — one row per hero ad in the home carousel
--   2) storage bucket "hero-images" (public read) for uploaded artwork
--
-- Security model (matches src/app/api/admin/users/[id]/route.ts):
--   - The public anon key can only READ active slides.
--   - All inserts/updates/deletes and image uploads go through
--     src/app/api/admin/hero-slides/** which checks the signed admin
--     session cookie and uses the service-role key (bypasses RLS).
--     No anon write policies exist on purpose.
-- ============================================================

create table if not exists public.hero_slides (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,                       -- internal name + image alt text
  image_url       text not null,
  button_label    text,
  button_url      text,
  open_in_new_tab boolean not null default true,
  button_position text not null default 'bottom-left',
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.hero_slides drop constraint if exists hero_slides_button_position_check;
alter table public.hero_slides add constraint hero_slides_button_position_check
  check (button_position in ('bottom-left', 'bottom-center', 'bottom-right'));

create index if not exists hero_slides_active_order_idx
  on public.hero_slides (is_active, sort_order);

-- keep updated_at current
create or replace function public.hero_slides_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hero_slides_touch_updated_at on public.hero_slides;
create trigger hero_slides_touch_updated_at
  before update on public.hero_slides
  for each row execute function public.hero_slides_touch_updated_at();

-- RLS: public can read ACTIVE slides only; no anon writes.
alter table public.hero_slides enable row level security;

drop policy if exists "Public can read active hero slides" on public.hero_slides;
create policy "Public can read active hero slides" on public.hero_slides
  for select using (is_active = true);

-- Storage bucket for hero artwork (public read; writes via service role only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hero-images', 'hero-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
