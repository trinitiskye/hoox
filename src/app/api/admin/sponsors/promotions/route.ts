// Admin-only: add a brand promotion (a sponsor tier or placement).
//   POST { accountId, packageId, optionId, startDate, price?, endDate?, target?, notes?, status?, payment? }

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { createSponsorPromotionAdmin, updateSponsorAccountAdmin } from '@/lib/supabaseAdmin';
import { loadSponsorPackages, promotionFromBody, sponsorDbError } from '@/lib/sponsorServer';

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const { packages } = await loadSponsorPackages();
  const { value, error } = promotionFromBody(b, packages);
  if (!value) return Response.json({ error }, { status: 400 });
  const { data, error: dbErr } = await createSponsorPromotionAdmin(value);
  if (dbErr || !data?.[0]) return Response.json({ error: sponsorDbError(dbErr || '') }, { status: 500 });
  // A booked promotion makes the brand an active sponsor
  if (value.status === 'booked') await updateSponsorAccountAdmin(value.account_id!, { status: 'active' });
  return Response.json({ promotion: data[0], error: null });
}
