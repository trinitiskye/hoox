-- ============================================================
-- HOOX featured placements for every listing type — run once in Supabase SQL Editor
-- Project: Hoox (iefjracmxpkpwndrksps)
-- Idempotent: safe to re-run. Requires migration_2026_11_club_feature_requests.sql
-- and migration_2026_11_feature_pricing.sql.
--
-- Two products for each listing type (tournaments, series, clubs, tradeshows & expos):
--   • badge — "Featured listing": Featured badge + top of the grid / list / map
--   • hero  — "Featured page hero": the large banner at the top of that type's page
--
-- public.club_feature_requests becomes the request + placement table for all
-- four types (existing club requests keep working as listing_type 'club',
-- placement 'badge'). Pricing per type lives in site_settings under
-- 'featured_pricing_<type>'.
-- ============================================================

alter table public.club_feature_requests add column if not exists listing_type text not null default 'club';
alter table public.club_feature_requests add column if not exists listing_id   text;
alter table public.club_feature_requests add column if not exists placement    text not null default 'badge';
alter table public.club_feature_requests add column if not exists source       text not null default 'web';   -- 'web' (request form) | 'admin' (added by HOOX)
alter table public.club_feature_requests add column if not exists featured_from  date;
alter table public.club_feature_requests add column if not exists featured_until date;
alter table public.club_feature_requests add column if not exists amount_paid  numeric(10,2);
alter table public.club_feature_requests add column if not exists paid_at      timestamptz;

do $$ begin
  alter table public.club_feature_requests add constraint club_feature_requests_listing_type_chk
    check (listing_type in ('tournament', 'series', 'club', 'event'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.club_feature_requests add constraint club_feature_requests_placement_chk
    check (placement in ('badge', 'hero'));
exception when duplicate_object then null; end $$;

-- Existing club rows: listing_id = the club submission they point at
update public.club_feature_requests
   set listing_id = club_submission_id::text
 where listing_type = 'club' and listing_id is null and club_submission_id is not null;

create index if not exists club_feature_requests_type_status_idx
  on public.club_feature_requests (listing_type, status, created_at desc);
create index if not exists club_feature_requests_active_idx
  on public.club_feature_requests (listing_type, placement, featured_from, featured_until)
  where status = 'approved';

-- Clubs can now be featured in the Clubs page hero separately from the badge
alter table public.club_submissions add column if not exists featured_hero boolean not null default false;
alter table public.club_submissions add column if not exists featured_hero_until date;
