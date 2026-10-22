// src/app/api/admin/hero-slides/upload/route.ts
// Admin-only image upload for hero slides. Accepts multipart/form-data with
// a single "file" field and stores it in the public "hero-images" bucket.

export const runtime = 'edge';

import { uploadHeroImageAdmin } from '@/lib/supabaseAdmin';
import { getAuthenticatedAdmin } from '@/lib/serverSession';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — matches the bucket limit
const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'Invalid upload.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!file || typeof file === 'string') return Response.json({ error: 'No file received.' }, { status: 400 });

  const ext = TYPES[file.type];
  if (!ext) return Response.json({ error: 'Use a JPG, PNG, WebP, or AVIF image.' }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: 'Image must be 5 MB or smaller.' }, { status: 400 });

  const path = `slides/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const { url, error } = await uploadHeroImageAdmin(path, await file.arrayBuffer(), file.type);
  if (error || !url) return Response.json({ error: error || 'Upload failed.' }, { status: 500 });

  return Response.json({ url, error: null });
}
