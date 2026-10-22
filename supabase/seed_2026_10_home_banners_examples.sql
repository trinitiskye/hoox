-- ============================================================
-- HOOX "We recommend" — example banners for testing (optional)
-- Run AFTER migration_2026_10_home_banners.sql, in the Supabase SQL Editor.
-- These are FICTIONAL brands made for testing — not real advertisers.
-- Safe to re-run.
--
-- Part 1 removes the earlier example rows that used real brand artwork
-- (those image files have been deleted from the site).
-- Part 2 adds six fictional example banners, skipping any already present.
-- Images are served from the site itself (public/home/banners/).
-- ============================================================

delete from public.home_banners
where image_url in (
  'https://hoox.app/home/banners/eco-fishing-shop.png',
  'https://hoox.app/home/banners/lowrance.png',
  'https://hoox.app/home/banners/torqeedo.png',
  'https://hoox.app/home/banners/big-adventures.png',
  'https://hoox.app/home/banners/millertech.png',
  'https://hoox.app/home/banners/kastking.png'
);

insert into public.home_banners
  (title, image_url, link_url, open_in_new_tab, is_active, sort_order)
select v.*
from (values
  ('Cedarwake Outfitters (example)', 'https://hoox.app/home/banners/cedarwake-outfitters.png', '/partner', false, true, 0),
  ('Sonarix (example)',              'https://hoox.app/home/banners/sonarix.png',              '/partner', false, true, 1),
  ('Voltwake (example)',             'https://hoox.app/home/banners/voltwake.png',             '/partner', false, true, 2),
  ('Lunker Lodge (example)',         'https://hoox.app/home/banners/lunker-lodge.png',         '/partner', false, true, 3),
  ('Ampfin (example)',               'https://hoox.app/home/banners/ampfin.png',               '/partner', false, true, 4),
  ('Strykor (example)',              'https://hoox.app/home/banners/strykor.png',              '/partner', false, true, 5)
) as v(title, image_url, link_url, open_in_new_tab, is_active, sort_order)
where not exists (select 1 from public.home_banners b where b.title = v.title);
