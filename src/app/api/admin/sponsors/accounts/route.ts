// Admin-only: add a sponsor brand (customer account).
//   POST { brandName, website?, logoUrl?, category?, contactName?, contactEmail?, contactPhone?, status?, notes? }

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { createSponsorAccountAdmin } from '@/lib/supabaseAdmin';
import { accountFromBody, sponsorDbError } from '@/lib/sponsorServer';

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const { value, error } = accountFromBody(b, false);
  if (!value) return Response.json({ error }, { status: 400 });
  const { data, error: dbErr } = await createSponsorAccountAdmin(value);
  if (dbErr || !data?.[0]) return Response.json({ error: sponsorDbError(dbErr || '') }, { status: 500 });
  return Response.json({ account: data[0], error: null });
}
