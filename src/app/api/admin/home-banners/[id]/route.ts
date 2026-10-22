// src/app/api/admin/home-banners/[id]/route.ts
// Admin-only update/delete for a single "We recommend" banner.

export const runtime = 'edge';

import { updateHomeBannerAdmin, deleteHomeBannerAdmin, deletePublicImageAdmin, BANNER_BUCKET } from '@/lib/supabaseAdmin';
import { dbHomeBannerToApp } from '@/lib/supabase';
import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { parseHomeBannerInput } from '@/lib/homeBannerValidation';

// PATCH — edit fields, toggle active, or change sort order
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { value, error: invalid } = parseHomeBannerInput(body, true);
  if (invalid) return Response.json({ error: invalid }, { status: 400 });
  if (Object.keys(value).length === 0) return Response.json({ error: 'Nothing to update.' }, { status: 400 });

  const { data, error } = await updateHomeBannerAdmin(id, value);
  if (error || !data?.[0]) return Response.json({ error: error || 'Update failed.' }, { status: 500 });
  return Response.json({ banner: dbHomeBannerToApp(data[0]), error: null });
}

// DELETE — remove the banner and its uploaded image (if it lives in our bucket)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { data, error } = await deleteHomeBannerAdmin(id);
  if (error) return Response.json({ error }, { status: 500 });

  const removed = data?.[0];
  if (removed?.image_url) await deletePublicImageAdmin(BANNER_BUCKET, removed.image_url);

  return Response.json({ ok: true, error: null });
}
