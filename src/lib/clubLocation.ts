// SERVER-ONLY: make sure an approved club has map coordinates.
import { geocodePlace } from './geocode';
import { updateClubSubmissionAdmin } from './supabaseAdmin';
import type { DbClubSubmission } from './clubSubmission';

export type LocateResult = { club: DbClubSubmission; warning: string | null };

const hasCoords = (s: DbClubSubmission) => Number.isFinite(s.lat) && Number.isFinite(s.lng);

/** Looks up and saves lat/lng when missing. Never throws. */
export async function ensureClubLocation(s: DbClubSubmission): Promise<LocateResult> {
  if (hasCoords(s)) return { club: s, warning: null };
  const found = await geocodePlace(s.city, s.state, s.country).catch(() => null);
  if (!found) {
    return { club: s, warning: `Couldn’t find “${s.city}, ${s.state}” on the map. The club is listed in the directory but has no map pin. Check the city spelling.` };
  }
  const { error } = await updateClubSubmissionAdmin(s.id, found).catch(() => ({ error: 'save failed' as string | null }));
  const warning = error
    ? /lat|lng|column/i.test(error)
      ? 'Map location found but not saved. Run supabase/migration_2026_11_club_locations.sql in Supabase so pins are stored.'
      : null
    : null;
  return { club: { ...s, ...found }, warning };
}
