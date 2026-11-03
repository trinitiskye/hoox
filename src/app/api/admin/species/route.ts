// Admin-only: list all fish species (including hidden) and add new ones.
export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { listSpeciesAdmin, createSpeciesAdmin } from '@/lib/supabaseAdmin';
import { cleanSpeciesName, SPECIES_CATEGORIES, type SpeciesCategory } from '@/lib/species';

const missingTable = (e: string) => /fish_species|relation|does not exist/i.test(e);
const MIGRATION_MSG = 'Run supabase/migration_2026_11_fish_species.sql in Supabase to set up the species list.';

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { data, error } = await listSpeciesAdmin();
  if (error) return Response.json({ species: [], error: missingTable(error) ? MIGRATION_MSG : error }, { status: 500 });
  return Response.json({ species: data || [], error: null });
}

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }

  const { name, error: bad } = cleanSpeciesName(body.name);
  if (bad || !name) return Response.json({ error: bad }, { status: 400 });
  const category = (SPECIES_CATEGORIES as readonly string[]).includes(body.category as string) ? (body.category as SpeciesCategory) : 'freshwater';

  const { data, error } = await createSpeciesAdmin({ name, category, is_active: true });
  if (error || !data?.[0]) {
    if (error && /duplicate|unique/i.test(error)) return Response.json({ error: `“${name}” is already on the list.` }, { status: 409 });
    return Response.json({ error: error && missingTable(error) ? MIGRATION_MSG : 'Couldn’t add that species.' }, { status: 500 });
  }
  return Response.json({ species: data[0], error: null });
}
