-- ============================================================
-- HOOX "We recommend" banners — optional image + placeholder
-- Run in the Supabase SQL Editor AFTER migration_2026_10_home_banners.sql.
-- Safe to re-run.
--
-- 1) Image is now optional: banners without one show the
--    "Advertise with us!" placeholder (public/home/banners/advertise-placeholder.png).
-- 2) Every banner opens in a new tab.
-- 3) Clears the images on the example banners (whose files were removed),
--    so they all show the placeholder. Banners with your own uploaded
--    images are left alone.
-- ============================================================

alter table public.home_banners alter column image_url drop not null;

update public.home_banners set open_in_new_tab = true where open_in_new_tab is distinct from true;

update public.home_banners
set image_url = null
where image_url like 'https://hoox.app/home/banners/%';
