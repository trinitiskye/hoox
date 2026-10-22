-- ============================================================
-- HOOX "We recommend" — six example banners for testing (optional)
-- Run AFTER migration_2026_10_home_banners.sql and
-- migration_2026_10_home_banners_placeholder.sql.
-- They have no image, so each shows the "Advertise with us!" placeholder,
-- and link to the Become a Partner page (opens in a new tab).
-- Safe to re-run: skips any banner whose name already exists.
-- ============================================================

insert into public.home_banners
  (title, image_url, link_url, open_in_new_tab, is_active, sort_order)
select v.title, null, '/partner', true, true, v.sort_order
from (values
  ('Ad space 1', 0), ('Ad space 2', 1), ('Ad space 3', 2),
  ('Ad space 4', 3), ('Ad space 5', 4), ('Ad space 6', 5)
) as v(title, sort_order)
where not exists (select 1 from public.home_banners b where b.title = v.title);
