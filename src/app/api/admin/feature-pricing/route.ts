// Admin-only: read and update "Feature your Club" pricing.
export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { loadFeaturePricing, saveFeaturePricing } from '@/lib/featurePricing';
import { parseFeaturePricing, DEFAULT_FEATURE_PRICING } from '@/lib/clubFeature';

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { pricing, saved, updatedAt } = await loadFeaturePricing();
  return Response.json({ pricing, defaults: DEFAULT_FEATURE_PRICING, saved, updatedAt, error: null });
}

export async function PUT(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const { value, error } = parseFeaturePricing((body as { pricing?: unknown })?.pricing);
  if (error || !value) return Response.json({ error: error || 'Invalid pricing.' }, { status: 400 });

  const res = await saveFeaturePricing(value, admin.id);
  if (res.error) {
    const missing = /site_settings|relation|does not exist/i.test(res.error);
    return Response.json(
      { error: missing ? 'Pricing can’t be saved yet. Run supabase/migration_2026_11_feature_pricing.sql in Supabase first.' : 'Couldn’t save pricing. Please try again.' },
      { status: 500 },
    );
  }
  return Response.json({ pricing: value, saved: true, updatedAt: res.data?.[0]?.updated_at ?? new Date().toISOString(), error: null });
}
