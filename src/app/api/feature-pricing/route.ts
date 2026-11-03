// PUBLIC: current "Feature your Club" pricing for /clubs/feature.
export const runtime = 'edge';

import { loadFeaturePricing } from '@/lib/featurePricing';

export async function GET() {
  const { pricing } = await loadFeaturePricing();
  return Response.json({ pricing }, { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30' } });
}
