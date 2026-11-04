// Admin-only: delete a payout recorded by mistake.

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { deleteAffiliatePayoutAdmin } from '@/lib/supabaseAdmin';
import { affiliateDbError } from '@/lib/affiliateServer';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAuthenticatedAdmin(request))) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const { error } = await deleteAffiliatePayoutAdmin(id);
  if (error) return Response.json({ error: affiliateDbError(error) }, { status: 500 });
  return Response.json({ ok: true, error: null });
}
