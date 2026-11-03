// src/app/api/clubs/route.ts
// PUBLIC list of approved clubs for the /clubs directory and map.
// Only public listing fields are returned: no submitter name/email, no
// contact email or phone, no admin notes. Clubs approved before map
// coordinates existed get them looked up (and saved) here once.

export const runtime = 'edge';

import { listApprovedClubsAdmin } from '@/lib/supabaseAdmin';
import { ensureClubLocation } from '@/lib/clubLocation';
import { CLUB_LEVELS, type DbClubSubmission } from '@/lib/clubSubmission';

const MAX_LOOKUPS_PER_REQUEST = 5; // Nominatim asks for light use
const CLUB_PLACEHOLDER_IMAGE = '/clubs/placeholder.svg';

function toPublic(s: DbClubSubmission) {
  return {
    id: `club-${s.id}`,
    name: s.club_name,
    city: s.city,
    state: s.state,
    species: (s.species || '').split(',').map((x) => x.trim()).filter(Boolean),
    styles: s.styles,
    members: s.member_count ?? 0,
    schedule: s.schedule || '',
    level: (CLUB_LEVELS as readonly string[]).includes(s.skill_level || '') ? s.skill_level : 'All skill levels',
    image: s.cover_image_url || CLUB_PLACEHOLDER_IMAGE,
    logo: s.logo_url || undefined,
    about: s.about,
    website: s.website || undefined,
    lat: Number.isFinite(s.lat) ? s.lat : null,
    lng: Number.isFinite(s.lng) ? s.lng : null,
  };
}

export async function GET() {
  try {
    const { data, error } = await listApprovedClubsAdmin();
    if (error) return Response.json({ clubs: [], error: 'Clubs are unavailable right now.' }, { status: 502 });
    const out = [];
    let lookups = 0;
    for (const s of data || []) {
      if (!Number.isFinite(s.lat) && lookups < MAX_LOOKUPS_PER_REQUEST) {
        lookups++;
        out.push(toPublic((await ensureClubLocation(s)).club));
      } else {
        out.push(toPublic(s));
      }
    }
    return Response.json(
      { clubs: out, error: null },
      { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' } },
    );
  } catch {
    return Response.json({ clubs: [], error: 'Clubs are unavailable right now.' }, { status: 500 });
  }
}
