// PUBLIC: listings with a live featured placement, for one listing type.
//   GET ?type=tournament|series|club|event → { hero: [ids], badge: [ids] }
// Used by the public pages to show the page hero and Featured badges.
export const runtime = 'edge';

import { listActivePlacementsAdmin } from '@/lib/supabaseAdmin';
import { LISTING_TYPES, todayIso } from '@/lib/featured';

export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get('type') || '';
  if (!(LISTING_TYPES as readonly string[]).includes(type)) return Response.json({ hero: [], badge: [] }, { status: 400 });
  const today = todayIso();
  const { data, error } = await listActivePlacementsAdmin(type, today).catch(() => ({ data: null, error: 'unavailable' }));
  if (error || !data) return Response.json({ hero: [], badge: [] }, { headers: { 'Cache-Control': 'public, max-age=60' } });
  const live = data.filter((r) => r.listing_id && (r.featured_from ?? '0000') <= today);
  const ids = (p: string) => Array.from(new Set(live.filter((r) => r.placement === p).map((r) => r.listing_id!)));
  return Response.json({ hero: ids('hero'), badge: ids('badge') }, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' } });
}
