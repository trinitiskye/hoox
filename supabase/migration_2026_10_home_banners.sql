-- ============================================================
-- HOOX home page "We recommend" ad banners — run once in Supabase SQL Editor
-- Project: Hoox (iefjracmxpkpwndrksps)
-- Idempotent: safe to re-run.
--
-- Creates:
--   1) public.home_banners  — one row per banner in the "We recommend" section
--   2) storage bucket "ad-banners" (public read) for uploaded banner images
--
-- Security model (same as hero_slides):
--   - The public anon key can only READ active banners.
--   - All writes and uploads go through src/app/api/admin/home-banners/**,
--     which checks the signed admin session and uses the service-role key.
-- ============================================================

create table if not exists public.home_banners (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,                       -- advertiser name + image alt text
  image_url       text not null,
  link_url        text,
  open_in_new_tab boolean not null default true,
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists home_banners_active_order_idx
  on public.home_banners (is_active, sort_order);

create or replace function public.home_banners_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists home_banners_touch_updated_at on public.home_banners;
create trigger home_banners_touch_updated_at
  before update on public.home_banners
  for each row execute function public.home_banners_touch_updated_at();

alter table public.home_banners enable row level security;

drop policy if exists "Public can read active home banners" on public.home_banners;
create policy "Public can read active home banners" on public.home_banners
  for select using (is_active = true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ad-banners', 'ad-banners', true, 2097152,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
