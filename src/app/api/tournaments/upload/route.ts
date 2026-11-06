// src/app/api/tournaments/upload/route.ts
// Image upload for the tournament form (directors and admins): banner,
// sponsor logo, sponsor product/background image. Multipart fields:
// "file" and "kind". Checks type, size and pixel dimensions (see
// src/lib/tournamentImages.ts) and returns the public URL.

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { uploadPublicImageAdmin } from '@/lib/supabaseAdmin';
import { readImageSize } from '@/lib/eventSubmission';
import { IMAGE_SPECS, TOURNAMENT_IMAGE_BUCKET, isImageKind, mb } from '@/lib/tournamentImages';


export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user || (user.role !== 'admin' && user.role !== 'director')) return Response.json({ url: null, error: 'Please sign in as a tournament director.' }, { status: 401 });

  let form: FormData;
  try { form = await request.formData(); } catch { return Response.json({ url: null, error: 'Invalid upload.' }, { status: 400 }); }
  const kind = form.get('kind');
  if (!isImageKind(kind)) return Response.json({ url: null, error: 'Unknown image type.' }, { status: 400 });
  const spec = IMAGE_SPECS[kind];
  const file = form.get('file');
  if (!file || typeof file === 'string' || file.size === 0) return Response.json({ url: null, error: 'No file received.' }, { status: 400 });

  const ext = spec.types[file.type];
  if (!ext) return Response.json({ url: null, error: `${spec.label} must be ${Object.values(spec.types).map((x) => x.toUpperCase()).join(' or ')}.` }, { status: 400 });
  if (file.size > spec.maxBytes) return Response.json({ url: null, error: `${spec.label} must be ${mb(spec.maxBytes)} or smaller (this one is ${(file.size / 1024 / 1024).toFixed(1)} MB).` }, { status: 400 });

  const buf = await file.arrayBuffer();
  const size = readImageSize(buf);
  if (!size) return Response.json({ url: null, error: `${spec.label} couldn’t be read. Try exporting it again.` }, { status: 400 });
  if (size.width < spec.minWidth || size.height < spec.minHeight) {
    return Response.json({ url: null, error: `${spec.label} is ${size.width} × ${size.height} px. It needs to be at least ${spec.minWidth} × ${spec.minHeight} px so it stays sharp.` }, { status: 400 });
  }
  if (spec.landscape && size.width <= size.height) return Response.json({ url: null, error: `${spec.label} must be landscape (wider than it is tall).` }, { status: 400 });

  const path = `${kind}/${user.id}/${crypto.randomUUID()}.${ext}`;
  const { url, error } = await uploadPublicImageAdmin(TOURNAMENT_IMAGE_BUCKET, path, buf, file.type);
  if (error || !url) return Response.json({ url: null, error: /bucket/i.test(error || '') ? 'Image storage isn’t set up yet (run the tournament images migration).' : 'Upload failed. Please try again.' }, { status: 500 });
  return Response.json({ url, width: size.width, height: size.height, error: null });
}
