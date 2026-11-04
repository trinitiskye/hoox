// Admin-only: everything the Sponsor Programs pages need in one call.
//   GET → { accounts, promotions, packages, packagesSaved, error }

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { listSponsorAccountsAdmin, listSponsorPromotionsAdmin } from '@/lib/supabaseAdmin';
import { loadSponsorPackages, sponsorDbError } from '@/lib/sponsorServer';

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const [acc, promo, pk] = await Promise.all([listSponsorAccountsAdmin(), listSponsorPromotionsAdmin(), loadSponsorPackages()]);
  const err = acc.error || promo.error;
  return Response.json(
    { accounts: acc.data || [], promotions: promo.data || [], packages: pk.packages, packagesSaved: pk.saved, error: err ? sponsorDbError(err) : null },
    { status: err ? 500 : 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
