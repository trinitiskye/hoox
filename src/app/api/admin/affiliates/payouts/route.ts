// Admin-only: record money paid to an affiliate.
//   POST { affiliateId, amount, paidAt?, method?, reference?, notes? }

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { getAffiliateAdmin, createAffiliatePayoutAdmin } from '@/lib/supabaseAdmin';
import { affiliateDbError } from '@/lib/affiliateServer';
import { PAYOUT_METHODS, todayIso, type PayoutMethod } from '@/lib/affiliates';

export async function POST(request: Request) {
  if (!(await getAuthenticatedAdmin(request))) return Response.json({ error: 'Forbidden' }, { status: 403 });
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const { data: affs } = await getAffiliateAdmin(String(b.affiliateId || ''));
  if (!affs?.[0]) return Response.json({ error: 'Affiliate not found.' }, { status: 404 });
  const amount = Number(b.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) return Response.json({ error: 'Enter the amount paid.' }, { status: 400 });
  const method = typeof b.method === 'string' && PAYOUT_METHODS.includes(b.method as PayoutMethod) ? (b.method as PayoutMethod) : null;
  const s = (k: string, max: number) => (typeof b[k] === 'string' ? (b[k] as string).trim().slice(0, max) : '') || null;
  const paidAt = typeof b.paidAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.paidAt) ? b.paidAt : todayIso();
  const { data, error } = await createAffiliatePayoutAdmin({ affiliate_id: affs[0].id, amount: Math.round(amount * 100) / 100, method, reference: s('reference', 120), notes: s('notes', 1000), paid_at: paidAt });
  if (error || !data?.[0]) return Response.json({ error: affiliateDbError(error || '') }, { status: 500 });
  return Response.json({ payout: data[0], error: null });
}
