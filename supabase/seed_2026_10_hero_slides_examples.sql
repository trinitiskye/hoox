-- ============================================================
-- HOOX hero carousel — example slides for testing
-- Run AFTER migration_2026_10_hero_slides.sql, in the Supabase SQL Editor.
-- Safe to re-run: skips any slide whose title already exists.
-- Images are served from the site itself (public/home/slides/), so they
-- load once this commit is deployed to hoox.app.
-- Edit, hide, reorder or delete these in Admin → Advertising → Hero Carousel.
-- ============================================================

insert into public.hero_slides
  (title, image_url, button_label, button_url, open_in_new_tab, button_position, is_active, sort_order)
select v.*
from (values
  ('TidalGear — Built for anglers',
   'https://hoox.app/home/slides/tidalgear.jpg',
   'Visit sponsor', 'https://hoox.app/partner', true, 'bottom-left', true, 0),
  ('HOOX 2026 Tournament Series — Registration open',
   'https://hoox.app/home/slides/hoox-series-2026.jpg',
   'Register now', '/register', false, 'bottom-right', true, 1)
) as v(title, image_url, button_label, button_url, open_in_new_tab, button_position, is_active, sort_order)
where not exists (select 1 from public.hero_slides h where h.title = v.title);
