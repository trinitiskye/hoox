// Admin-only: edit, approve, pause or delete one affiliate.

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { getAffiliateAdmin, updateAffiliateAdmin, deleteAffiliateAdmin } from '@/lib/supabaseAdmin';
import { affiliateFromBody, affiliateDbError } from '@/lib/affiliateServer';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await getAuthenticatedAdmin(request))) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const { value, error } = affiliateFromBody(b, true, true);
  if (!value) return Response.json({ error }, { status: 400 });
  if (value.status === 'active') {
    const { data: prev } = await getAffiliateAdmin(id);
    if (prev?.[0] && !prev[0].approved_at) value.approved_at = new Date().toISOString();
  }
  const { data, error: dbErr } = await updateAffiliateAdmin(id, value);
  if (dbErr) return Response.json({ error: affiliateDbError(dbErr) }, { status: 500 });
  if (!data?.[0]) return Response.json({ error: 'Affiliate not found.' }, { status: 404 });
  return Response.json({ affiliate: data[0], error: null });
}

export async function DELETE(request: Request, { params }: Ctx) {
  if (!(await getAuthenticatedAdmin(request))) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const { error } = await deleteAffiliateAdmin(id);
  if (error) return Response.json({ error: affiliateDbError(error) }, { status: 409 });
  return Response.json({ ok: true, error: null });
}
