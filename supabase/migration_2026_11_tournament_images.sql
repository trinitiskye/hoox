-- ============================================================
-- HOOX: storage for tournament images (banner, sponsor logo,
-- sponsor product/background image), uploaded from the tournament form
-- through /api/tournaments/upload (service role). Public read.
-- Idempotent: safe to re-run.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tournament-images', 'tournament-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
