// Admin-only: change a referral's start date, rate or window, or remove it.
//   PATCH { referredAt?, ratePercent?, windowMonths?, status?: 'active' | 'removed' }

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { updateAffiliateReferralAdmin } from '@/lib/supabaseAdmin';
import { affiliateDbError } from '@/lib/affiliateServer';
import type { DbAffiliateReferral } from '@/lib/affiliates';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await getAuthenticatedAdmin(request))) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const v: Partial<DbAffiliateReferral> = {};
  if ('referredAt' in b) { if (typeof b.referredAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.referredAt)) return Response.json({ error: 'Choose a valid date.' }, { status: 400 }); v.referred_at = b.referredAt; }
  if ('ratePercent' in b) { const r = Number(b.ratePercent); if (!Number.isFinite(r) || r < 0 || r > 100) return Response.json({ error: 'Rate must be 0–100%.' }, { status: 400 }); v.rate_percent = Math.round(r * 100) / 100; }
  if ('windowMonths' in b) { const w = Number(b.windowMonths); if (!Number.isInteger(w) || w < 1 || w > 120) return Response.json({ error: 'Window must be 1–120 months.' }, { status: 400 }); v.window_months = w; }
  if ('status' in b) { if (b.status !== 'active' && b.status !== 'removed') return Response.json({ error: 'Unknown status.' }, { status: 400 }); v.status = b.status; }
  const { data, error } = await updateAffiliateReferralAdmin(id, v);
  if (error) return Response.json({ error: affiliateDbError(error) }, { status: 500 });
  if (!data?.[0]) return Response.json({ error: 'Referral not found.' }, { status: 404 });
  return Response.json({ referral: data[0], error: null });
}
