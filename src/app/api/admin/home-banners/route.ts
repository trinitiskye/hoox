// src/app/api/admin/home-banners/route.ts
// Admin-only list/create for the home page "We recommend" banners.
// Session verified server-side (signed httpOnly cookie + fresh DB lookup);
// writes use the service-role client.

export const runtime = 'edge';

import { listHomeBannersAdmin, createHomeBannerAdmin } from '@/lib/supabaseAdmin';
import { dbHomeBannerToApp } from '@/lib/supabase';
import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { parseHomeBannerInput } from '@/lib/homeBannerValidation';
import type { DbHomeBannerInsert } from '@/lib/supabase';

// GET — all banners, including inactive ones
export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await listHomeBannersAdmin();
  if (error) return Response.json({ banners: [], error }, { status: 500 });
  return Response.json({ banners: (data || []).map(dbHomeBannerToApp), error: null });
}

// POST — create a banner; it's added to the end
export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { value, error: invalid } = parseHomeBannerInput(body, false);
  if (invalid) return Response.json({ error: invalid }, { status: 400 });

  if (value.sort_order === undefined) {
    const { data: existing } = await listHomeBannersAdmin();
    const max = (existing || []).reduce((m, b) => Math.max(m, b.sort_order), -1);
    value.sort_order = max + 1;
  }

  const { data, error } = await createHomeBannerAdmin(value as DbHomeBannerInsert);
  if (error || !data?.[0]) return Response.json({ error: error || 'Create failed.' }, { status: 500 });
  return Response.json({ banner: dbHomeBannerToApp(data[0]), error: null });
}
