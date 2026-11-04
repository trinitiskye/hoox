// Public: the program terms shown on the "Affiliate Programs" page.

export const runtime = 'edge';

import { loadAffiliateSettings } from '@/lib/affiliateServer';

export async function GET() {
  const { settings: s } = await loadAffiliateSettings();
  return Response.json(
    { rate: s.defaultRate, windowMonths: s.windowMonths, feePerRegistration: s.fallbackFee, minPayout: s.minPayout, cookieDays: s.cookieDays, acceptingApplications: s.acceptingApplications },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
}
