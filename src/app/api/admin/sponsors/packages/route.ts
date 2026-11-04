// Admin-only: save the sponsor packages & prices.
//   PUT { packages: SponsorPackage[] }   DELETE → back to the recommended defaults

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { parseSponsorPackages, DEFAULT_SPONSOR_PACKAGES } from '@/lib/sponsors';
import { saveSponsorPackages } from '@/lib/sponsorServer';

export async function PUT(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const { value, error } = parseSponsorPackages(b.packages);
  if (!value) return Response.json({ error }, { status: 400 });
  if (value.length === 0) return Response.json({ error: 'Keep at least one package.' }, { status: 400 });
  const { error: dbErr } = await saveSponsorPackages(value, admin.id);
  if (dbErr) return Response.json({ error: /site_settings/i.test(dbErr) ? 'Run supabase/migration_2026_11_feature_pricing.sql in Supabase first.' : 'Couldn’t save packages.' }, { status: 500 });
  return Response.json({ packages: value, error: null });
}

export async function DELETE(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { error } = await saveSponsorPackages(DEFAULT_SPONSOR_PACKAGES, admin.id);
  if (error) return Response.json({ error: 'Couldn’t reset packages.' }, { status: 500 });
  return Response.json({ packages: DEFAULT_SPONSOR_PACKAGES, error: null });
}
