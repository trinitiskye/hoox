// PUBLIC: featured pricing for a listing type (both products).
//   GET ?type=club|tournament|series|event  → { pricing: { badge, hero } }
export const runtime = 'edge';

import { loadTypePricing } from '@/lib/featurePricing';
import { LISTING_TYPES, type ListingType } from '@/lib/featured';

export async function GET(request: Request) {
  const t = new URL(request.url).searchParams.get('type') || 'club';
  const type = (LISTING_TYPES as readonly string[]).includes(t) ? (t as ListingType) : 'club';
  const { pricing } = await loadTypePricing(type);
  return Response.json({ type, pricing }, { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30' } });
}
