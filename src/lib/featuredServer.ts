// SERVER-ONLY helpers for featured placements: approval side effects.
import { updateFeaturedRequestAdmin, setClubFeaturedAdmin, setClubHeroAdmin } from './supabaseAdmin';
import { loadTypePricing } from './featurePricing';
import { planIn, placementWindow, type DbFeaturedRequest } from './featured';

/**
 * Turn a placement on: work out its dates, store them on the row, and for
 * clubs set the flag the Clubs pages read. Returns the updated row + a warning.
 */
export async function activatePlacement(r: DbFeaturedRequest): Promise<{ row: DbFeaturedRequest; warning: string | null }> {
  const months = r.term_months || planIn((await loadTypePricing(r.listing_type)).pricing[r.placement], r.plan)?.months || 1;
  const { from, until } = placementWindow(months, r.start_date);
  const { data } = await updateFeaturedRequestAdmin(r.id, { featured_from: from, featured_until: until });
  const row = data?.[0] ?? { ...r, featured_from: from, featured_until: until };

  let warning: string | null = null;
  if (!r.listing_id) {
    warning = 'Approved, but this request isn’t linked to a listing on HOOX, so nothing shows on the site. Edit it to pick the listing.';
  } else if (r.listing_type === 'club' && !r.listing_id.startsWith('demo:')) {
    const res = r.placement === 'hero' ? await setClubHeroAdmin(r.listing_id, true, until) : await setClubFeaturedAdmin(r.listing_id, true, until);
    if (res.error) warning = /featured_hero/i.test(res.error)
      ? 'Approved, but the club couldn’t be featured. Run supabase/migration_2026_11_featured_placements.sql in Supabase.'
      : 'Approved, but the club couldn’t be updated. Please try again.';
  }
  return { row, warning };
}

/** Turn a placement off (approved → anything else) */
export async function deactivatePlacement(r: DbFeaturedRequest) {
  if (r.listing_type === 'club' && r.listing_id && !r.listing_id.startsWith('demo:')) {
    if (r.placement === 'hero') await setClubHeroAdmin(r.listing_id, false, null);
    else await setClubFeaturedAdmin(r.listing_id, false, null);
  }
}
