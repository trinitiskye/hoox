// src/app/api/admin/hero-slides/route.ts
// Admin-only list/create for home page hero carousel slides.
// Session is verified server-side (signed httpOnly cookie + fresh DB lookup);
// writes use the service-role client, so the anon key never needs write access.

export const runtime = 'edge';

import { listHeroSlidesAdmin, createHeroSlideAdmin } from '@/lib/supabaseAdmin';
import { dbHeroSlideToApp } from '@/lib/supabase';
import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { parseHeroSlideInput } from '@/lib/heroSlideValidation';
import type { DbHeroSlideInsert } from '@/lib/supabase';

// GET — all slides, including inactive ones
export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await listHeroSlidesAdmin();
  if (error) return Response.json({ slides: [], error }, { status: 500 });
  return Response.json({ slides: (data || []).map(dbHeroSlideToApp), error: null });
}

// POST — create a slide; it's added to the end of the carousel
export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { value, error: invalid } = parseHeroSlideInput(body, false);
  if (invalid) return Response.json({ error: invalid }, { status: 400 });

  if (value.sort_order === undefined) {
    const { data: existing } = await listHeroSlidesAdmin();
    const max = (existing || []).reduce((m, s) => Math.max(m, s.sort_order), -1);
    value.sort_order = max + 1;
  }

  const { data, error } = await createHeroSlideAdmin(value as DbHeroSlideInsert);
  if (error || !data?.[0]) return Response.json({ error: error || 'Create failed.' }, { status: 500 });
  return Response.json({ slide: dbHeroSlideToApp(data[0]), error: null });
}
