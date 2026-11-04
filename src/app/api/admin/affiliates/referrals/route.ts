// Admin-only: credit a tournament director to an affiliate by hand.
//   POST { affiliateId, directorId, referredAt? }  (rate & window come from the affiliate)

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { getAffiliateAdmin, getUserByIdAdmin, createAffiliateReferralAdmin } from '@/lib/supabaseAdmin';
import { affiliateDbError } from '@/lib/affiliateServer';
import { todayIso } from '@/lib/affiliates';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  if (!(await getAuthenticatedAdmin(request))) return Response.json({ error: 'Forbidden' }, { status: 403 });
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const affiliateId = typeof b.affiliateId === 'string' ? b.affiliateId : '';
  const directorId = typeof b.directorId === 'string' ? b.directorId : '';
  const referredAt = typeof b.referredAt === 'string' && DATE_RE.test(b.referredAt) ? b.referredAt : todayIso();
  const [{ data: affs }, { data: users }] = await Promise.all([getAffiliateAdmin(affiliateId), getUserByIdAdmin(directorId)]);
  const aff = affs?.[0];
  const user = users?.[0];
  if (!aff) return Response.json({ error: 'Affiliate not found.' }, { status: 404 });
  if (!user || user.role !== 'director') return Response.json({ error: 'Choose a tournament director.' }, { status: 400 });
  const { data, error } = await createAffiliateReferralAdmin({
    affiliate_id: aff.id, director_id: user.id, director_name: user.name, director_email: user.email,
    referred_at: referredAt, rate_percent: aff.rate_percent, window_months: aff.window_months, source: 'admin', status: 'active',
  });
  if (error || !data?.[0]) return Response.json({ error: affiliateDbError(error || '') }, { status: 500 });
  return Response.json({ referral: data[0], error: null });
}
