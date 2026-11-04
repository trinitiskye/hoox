// Admin-only: update or delete one brand promotion.
//   PATCH { status?, price?, startDate?, endDate?, target?, notes?, payment?: { amount, paidAt } | null }

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { getSponsorPromotionAdmin, updateSponsorPromotionAdmin, deleteSponsorPromotionAdmin, updateSponsorAccountAdmin } from '@/lib/supabaseAdmin';
import { loadSponsorPackages, promotionFromBody, sponsorDbError } from '@/lib/sponsorServer';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const { data: before, error: getErr } = await getSponsorPromotionAdmin(id);
  if (getErr) return Response.json({ error: sponsorDbError(getErr) }, { status: 500 });
  const prev = before?.[0];
  if (!prev) return Response.json({ error: 'Promotion not found.' }, { status: 404 });
  const { packages } = await loadSponsorPackages();
  const { value, error } = promotionFromBody(b, packages, prev);
  if (!value) return Response.json({ error }, { status: 400 });
  const { data, error: dbErr } = await updateSponsorPromotionAdmin(id, value);
  if (dbErr || !data?.[0]) return Response.json({ error: sponsorDbError(dbErr || '') }, { status: 500 });
  if (value.status === 'booked' && prev.status !== 'booked') await updateSponsorAccountAdmin(prev.account_id, { status: 'active' });
  return Response.json({ promotion: data[0], error: null });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const { error } = await deleteSponsorPromotionAdmin(id);
  if (error) return Response.json({ error: sponsorDbError(error) }, { status: 500 });
  return Response.json({ ok: true, error: null });
}
