-- ============================================================
-- HOOX "We recommend" — example banners for testing (optional)
-- Run AFTER migration_2026_10_home_banners.sql, in the Supabase SQL Editor.
-- Safe to re-run: skips any banner whose name already exists.
-- Images are served from the site itself (public/home/banners/), so they
-- load once this commit is deployed to hoox.app.
-- Links are left empty on purpose — add each advertiser's real
-- click-through URL in Admin → Advertising → Home Page Banners.
-- ============================================================

insert into public.home_banners
  (title, image_url, link_url, open_in_new_tab, is_active, sort_order)
select v.*
from (values
  ('Eco Fishing Shop', 'https://hoox.app/home/banners/eco-fishing-shop.png', null::text, true, true, 0),
  ('Lowrance',         'https://hoox.app/home/banners/lowrance.png',         null::text, true, true, 1),
  ('Torqeedo',         'https://hoox.app/home/banners/torqeedo.png',         null::text, true, true, 2),
  ('Big Adventures',   'https://hoox.app/home/banners/big-adventures.png',   null::text, true, true, 3),
  ('Millertech',       'https://hoox.app/home/banners/millertech.png',       null::text, true, true, 4),
  ('KastKing',         'https://hoox.app/home/banners/kastking.png',         null::text, true, true, 5)
) as v(title, image_url, link_url, open_in_new_tab, is_active, sort_order)
where not exists (select 1 from public.home_banners b where b.title = v.title);
