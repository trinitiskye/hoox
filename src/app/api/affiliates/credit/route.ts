// Public: called right after a tournament director signs up. If their browser
// has a referral link cookie (hoox_ref), credit them to that affiliate.
//   POST { directorId }
// Only brand-new director accounts (created in the last day) with no existing
// referral can be credited, so this can't move an existing director.

export const runtime = 'edge';

import { creditReferral, clearRefCookie } from '@/lib/affiliateServer';

export async function POST(request: Request) {
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ credited: false }, { status: 400 }); }
  const directorId = typeof b.directorId === 'string' ? b.directorId : '';
  if (!directorId) return Response.json({ credited: false }, { status: 400 });
  const result = await creditReferral(request, directorId).catch(() => ({ credited: false }));
  const res = Response.json({ credited: result.credited });
  if (result.credited) res.headers.append('Set-Cookie', clearRefCookie);
  return res;
}
