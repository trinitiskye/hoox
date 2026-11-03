// src/app/api/event-submissions/route.ts
// PUBLIC endpoint behind /events/submit. Accepts one multipart request with
// the form fields plus an optional logo and 16:9 hero image, validates
// everything server-side, uploads the images, and stores the request for
// admin review. Nothing is published until an admin approves it.

export const runtime = 'edge';

import {
  createEventSubmissionAdmin,
  uploadPublicImageAdmin,
  deletePublicImageAdmin,
  EVENT_SUBMISSION_BUCKET,
} from '@/lib/supabaseAdmin';
import {
  parseEventSubmission,
  readImageSize,
  IMAGE_TYPES,
  LOGO_MAX_BYTES,
  HERO_MAX_BYTES,
  HERO_MIN_WIDTH,
  HERO_MIN_HEIGHT,
} from '@/lib/eventSubmission';

const MAX_REQUEST_BYTES = 8 * 1024 * 1024;

type Checked = { buf: ArrayBuffer; type: string; ext: string } | null;

async function checkImage(
  form: FormData,
  field: string,
  label: string,
  maxBytes: number,
  minSize?: { width: number; height: number; ratio?: number }
): Promise<{ file: Checked; error: string | null }> {
  const f = form.get(field);
  if (!f || typeof f === 'string' || f.size === 0) return { file: null, error: null };

  const ext = IMAGE_TYPES[f.type];
  if (!ext) return { file: null, error: `${label} must be a JPG, PNG, or WebP image.` };
  if (f.size > maxBytes) return { file: null, error: `${label} must be ${Math.round(maxBytes / 1024 / 1024)} MB or smaller.` };

  const buf = await f.arrayBuffer();
  const size = readImageSize(buf);
  if (!size) return { file: null, error: `${label} couldn’t be read. Try exporting it again as JPG or PNG.` };

  if (minSize) {
    if (size.width < minSize.width || size.height < minSize.height) {
      return { file: null, error: `${label} must be at least ${minSize.width} × ${minSize.height} pixels (yours is ${size.width} × ${size.height}).` };
    }
    if (minSize.ratio) {
      const ratio = size.width / size.height;
      if (Math.abs(ratio - minSize.ratio) / minSize.ratio > 0.02) {
        return { file: null, error: `${label} must be 16:9 (for example 1920 × 1080). Yours is ${size.width} × ${size.height}.` };
      }
    }
  }
  return { file: { buf, type: f.type, ext }, error: null };
}

export async function POST(request: Request) {
  try {
    return await handle(request);
  } catch {
    return Response.json({ error: 'Something went wrong on our end. Please try again in a moment.' }, { status: 500 });
  }
}

async function handle(request: Request) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_REQUEST_BYTES) return Response.json({ error: 'Upload is too large. Keep images under 5 MB.' }, { status: 413 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'Invalid submission.' }, { status: 400 });
  }

  // Honeypot: real visitors never see or fill this field.
  const trap = form.get('website_url');
  if (typeof trap === 'string' && trap.trim()) return Response.json({ ok: true, error: null });

  const get = (k: string) => {
    const v = form.get(k);
    return typeof v === 'string' ? v : '';
  };
  const getAll = (k: string) => form.getAll(k).filter((v): v is string => typeof v === 'string');

  const { value, error } = parseEventSubmission(get, getAll);
  if (error || !value) return Response.json({ error: error || 'Invalid submission.' }, { status: 400 });

  const logo = await checkImage(form, 'logo', 'Logo', LOGO_MAX_BYTES);
  if (logo.error) return Response.json({ error: logo.error }, { status: 400 });
  const hero = await checkImage(form, 'heroImage', 'Hero image', HERO_MAX_BYTES, {
    width: HERO_MIN_WIDTH,
    height: HERO_MIN_HEIGHT,
    ratio: 16 / 9,
  });
  if (hero.error) return Response.json({ error: hero.error }, { status: 400 });
  if (hero.file && !value.hero_alt_text) {
    return Response.json({ error: 'Please describe your hero image (used as alt text for accessibility).' }, { status: 400 });
  }

  const folder = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}`;
  const uploaded: string[] = [];
  const cleanup = () => Promise.all(uploaded.map((u) => deletePublicImageAdmin(EVENT_SUBMISSION_BUCKET, u)));

  for (const [key, img] of [['logo', logo.file], ['hero', hero.file]] as const) {
    if (!img) continue;
    const { url, error: upErr } = await uploadPublicImageAdmin(EVENT_SUBMISSION_BUCKET, `${folder}/${key}.${img.ext}`, img.buf, img.type);
    if (upErr || !url) {
      await cleanup();
      return Response.json({ error: 'We couldn’t upload your images. Please try again.' }, { status: 500 });
    }
    uploaded.push(url);
    if (key === 'logo') value.logo_url = url;
    else value.hero_image_url = url;
  }

  const { error: dbErr } = await createEventSubmissionAdmin(value);
  if (dbErr) {
    await cleanup();
    return Response.json({ error: 'We couldn’t save your submission. Please try again in a moment.' }, { status: 500 });
  }

  return Response.json({ ok: true, error: null });
}
