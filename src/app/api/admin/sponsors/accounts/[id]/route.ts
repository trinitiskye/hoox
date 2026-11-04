// Admin-only: edit or delete one sponsor brand.
//   PATCH { any account field }   DELETE (only when the brand has no promotions)

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { updateSponsorAccountAdmin, deleteSponsorAccountAdmin } from '@/lib/supabaseAdmin';
import { accountFromBody, sponsorDbError } from '@/lib/sponsorServer';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const { value, error } = accountFromBody(b, true);
  if (!value) return Response.json({ error }, { status: 400 });
  const { data, error: dbErr } = await updateSponsorAccountAdmin(id, value);
  if (dbErr) return Response.json({ error: sponsorDbError(dbErr) }, { status: 500 });
  if (!data?.[0]) return Response.json({ error: 'Sponsor not found.' }, { status: 404 });
  return Response.json({ account: data[0], error: null });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const { error } = await deleteSponsorAccountAdmin(id);
  if (error) return Response.json({ error: sponsorDbError(error) }, { status: 409 });
  return Response.json({ ok: true, error: null });
}
