// Public: apply to become a HOOX affiliate.
//   POST { name, email, phone?, organization?, website?, audience, payoutMethod?, payoutDetails?, agree: true, company? (honeypot) }

export const runtime = 'edge';

import { createAffiliateAdmin, getAffiliateByEmailAdmin } from '@/lib/supabaseAdmin';
import { affiliateFromBody, affiliateDbError, loadAffiliateSettings } from '@/lib/affiliateServer';
import { makeAffiliateCode } from '@/lib/affiliates';

export async function POST(request: Request) {
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  if (typeof b.company === 'string' && b.company) return Response.json({ ok: true, error: null }); // bot
  const { settings } = await loadAffiliateSettings();
  if (!settings.acceptingApplications) return Response.json({ error: 'We’re not taking new affiliate applications right now.' }, { status: 403 });
  if (b.agree !== true) return Response.json({ error: 'Please agree to the program terms.' }, { status: 400 });
  const { value, error } = affiliateFromBody(b, false, false);
  if (!value) return Response.json({ error }, { status: 400 });
  if (!value.audience) return Response.json({ error: 'Tell us how you’ll introduce tournament directors to HOOX.' }, { status: 400 });
  const { data: existing, error: lookupErr } = await getAffiliateByEmailAdmin(value.email!);
  if (lookupErr) return Response.json({ error: affiliateDbError(lookupErr) }, { status: 500 });
  if (existing?.length) return Response.json({ error: 'You’ve already applied with this email. We’ll be in touch soon.' }, { status: 409 });
  const { error: dbErr } = await createAffiliateAdmin({
    ...value, code: makeAffiliateCode(value.organization || value.name || ''), status: 'pending', source: 'web',
    rate_percent: settings.defaultRate, window_months: settings.windowMonths,
  });
  if (dbErr) return Response.json({ error: affiliateDbError(dbErr) }, { status: 500 });
  return Response.json({ ok: true, error: null });
}
