// Admin-only: read and update featured pricing for one listing type.
//   GET ?type=…   PUT ?type=… { pricing: { badge, hero } }
export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { loadTypePricing, saveTypePricing } from '@/lib/featurePricing';
import { DEFAULT_TYPE_PRICING, LISTING_TYPES, parseTypePricing, type ListingType } from '@/lib/featured';

const typeOf = (request: Request) => {
  const t = new URL(request.url).searchParams.get('type') || 'club';
  return (LISTING_TYPES as readonly string[]).includes(t) ? (t as ListingType) : null;
};

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const type = typeOf(request);
  if (!type) return Response.json({ error: 'Unknown listing type.' }, { status: 400 });
  const { pricing, saved, updatedAt } = await loadTypePricing(type);
  return Response.json({ type, pricing, defaults: DEFAULT_TYPE_PRICING[type], saved, updatedAt, error: null });
}

export async function PUT(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const type = typeOf(request);
  if (!type) return Response.json({ error: 'Unknown listing type.' }, { status: 400 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const { value, error } = parseTypePricing((body as { pricing?: unknown })?.pricing, type);
  if (error || !value) return Response.json({ error: error || 'Invalid pricing.' }, { status: 400 });
  const res = await saveTypePricing(type, value, admin.id);
  if (res.error) {
    const missing = /site_settings|relation|does not exist/i.test(res.error);
    return Response.json({ error: missing ? 'Pricing can’t be saved yet. Run supabase/migration_2026_11_feature_pricing.sql in Supabase first.' : 'Couldn’t save pricing. Please try again.' }, { status: 500 });
  }
  return Response.json({ pricing: value, saved: true, updatedAt: res.data?.[0]?.updated_at ?? new Date().toISOString(), error: null });
}
