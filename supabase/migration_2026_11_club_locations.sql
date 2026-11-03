-- ============================================================
-- HOOX approved clubs on the directory + map — run once in Supabase SQL Editor
-- Project: Hoox (iefjracmxpkpwndrksps)
-- Idempotent: safe to re-run. Requires migration_2026_11_club_submissions.sql.
--
-- Adds map coordinates to club submissions. When an admin approves a club,
-- src/app/api/admin/club-submissions/[id] looks up its city/state and saves
-- lat/lng here, so the club can be pinned on the /clubs map. Approved clubs
-- are served publicly (without submitter contact details) by src/app/api/clubs.
-- ============================================================

alter table public.club_submissions add column if not exists lat double precision;
alter table public.club_submissions add column if not exists lng double precision;
