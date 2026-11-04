// Admin-only: the affiliate program.
//   GET  → { affiliates, referrals, payouts, tournaments, registrations, directors, settings, settingsSaved, error }
//   POST { name, email, … } → add an affiliate (active right away)

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { createAffiliateAdmin } from '@/lib/supabaseAdmin';
import { loadAffiliateData, loadAffiliateSettings, affiliateFromBody, affiliateDbError } from '@/lib/affiliateServer';
import { makeAffiliateCode } from '@/lib/affiliates';

const forbidden = () => Response.json({ error: 'Forbidden' }, { status: 403 });

export async function GET(request: Request) {
  if (!(await getAuthenticatedAdmin(request))) return forbidden();
  const { data, error } = await loadAffiliateData();
  return Response.json({ ...data, error }, { status: error ? 500 : 200, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  if (!(await getAuthenticatedAdmin(request))) return forbidden();
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const { value, error } = affiliateFromBody(b, false, true);
  if (!value) return Response.json({ error }, { status: 400 });
  const { settings } = await loadAffiliateSettings();
  const row = {
    rate_percent: settings.defaultRate, window_months: settings.windowMonths, status: 'active' as const,
    ...value, code: value.code || makeAffiliateCode(value.organization || value.name || ''), source: 'admin' as const,
  };
  if (row.status === 'active') Object.assign(row, { approved_at: new Date().toISOString() });
  const { data, error: dbErr } = await createAffiliateAdmin(row);
  if (dbErr || !data?.[0]) return Response.json({ error: affiliateDbError(dbErr || '') }, { status: 500 });
  return Response.json({ affiliate: data[0], error: null });
}
