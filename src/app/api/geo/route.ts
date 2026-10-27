// src/app/api/geo/route.ts
// Approximate visitor location from their IP, for "Near me" on /search.
// Cloudflare already knows this for every request (request.cf), so no
// third-party lookup is needed in production. Returns 404 when unknown
// (e.g. local dev) and the browser falls back to a public IP lookup.

export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';

type CfGeo = { latitude?: string; longitude?: string; city?: string; region?: string; regionCode?: string; postalCode?: string; country?: string };

export async function GET(request: Request) {
  let cf: CfGeo | undefined;
  try {
    cf = getRequestContext().cf as CfGeo;
  } catch {
    cf = (request as unknown as { cf?: CfGeo }).cf;
  }

  // Also accept Cloudflare's "visitor location" headers if that transform is on
  const h = request.headers;
  const lat = Number(cf?.latitude ?? h.get('cf-iplatitude'));
  const lng = Number(cf?.longitude ?? h.get('cf-iplongitude'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
    return Response.json({ error: 'Location unavailable' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  return Response.json(
    {
      lat,
      lng,
      city: cf?.city ?? h.get('cf-ipcity') ?? undefined,
      region: cf?.regionCode ?? h.get('cf-region-code') ?? undefined,
      postal: cf?.postalCode ?? h.get('cf-postal-code') ?? undefined,
      country: cf?.country ?? h.get('cf-ipcountry') ?? undefined,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
