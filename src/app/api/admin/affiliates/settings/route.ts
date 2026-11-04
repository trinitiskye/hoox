// Admin-only: save affiliate program settings (default rate, window, minimum payout …).

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { parseAffiliateSettings } from '@/lib/affiliates';
import { saveAffiliateSettings } from '@/lib/affiliateServer';

export async function PUT(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  let b: unknown;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const { value, error } = parseAffiliateSettings(b);
  if (!value) return Response.json({ error }, { status: 400 });
  const { error: dbErr } = await saveAffiliateSettings(value, admin.id);
  if (dbErr) return Response.json({ error: 'Couldn’t save settings.' }, { status: 500 });
  return Response.json({ settings: value, error: null });
}
