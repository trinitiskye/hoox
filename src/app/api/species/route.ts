// PUBLIC: active fish species (names + category) for the Species filters.
export const runtime = 'edge';

import { listSpeciesAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const { data, error } = await listSpeciesAdmin(true).catch(() => ({ data: null, error: 'unavailable' }));
  if (error || !data) return Response.json({ species: [], error: 'unavailable' }, { status: 503 });
  return Response.json(
    { species: data.map((s) => ({ name: s.name, category: s.category })), error: null },
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' } },
  );
}
