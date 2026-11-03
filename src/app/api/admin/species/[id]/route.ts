// Admin-only: rename, recategorize, hide/show, or delete one species.
// Renaming also updates tournaments that list the old name, so the
// Species filter keeps matching them. Deleting leaves tournaments as they
// are (their species text stays on their pages).

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import {
  getSpeciesAdmin, updateSpeciesAdmin, deleteSpeciesAdmin,
  listTournamentsWithSpeciesAdmin, setTournamentFishTypesAdmin,
} from '@/lib/supabaseAdmin';
import { cleanSpeciesName, SPECIES_CATEGORIES, type DbFishSpecies, type SpeciesCategory } from '@/lib/species';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }

  const { data: before } = await getSpeciesAdmin(id);
  const prev = before?.[0];
  if (!prev) return Response.json({ error: 'Species not found.' }, { status: 404 });

  const updates: Partial<Pick<DbFishSpecies, 'name' | 'category' | 'is_active'>> = {};
  if ('name' in body) {
    const { name, error } = cleanSpeciesName(body.name);
    if (error || !name) return Response.json({ error }, { status: 400 });
    if (name !== prev.name) updates.name = name;
  }
  if ('category' in body) {
    if (!(SPECIES_CATEGORIES as readonly string[]).includes(body.category as string)) return Response.json({ error: 'Unknown category.' }, { status: 400 });
    updates.category = body.category as SpeciesCategory;
  }
  if ('isActive' in body) updates.is_active = body.isActive === true;
  if (Object.keys(updates).length === 0) return Response.json({ species: prev, renamedTournaments: 0, error: null });

  const { data, error } = await updateSpeciesAdmin(id, updates);
  if (error || !data?.[0]) {
    if (error && /duplicate|unique/i.test(error)) return Response.json({ error: `“${updates.name}” is already on the list.` }, { status: 409 });
    return Response.json({ error: 'Couldn’t save that change.' }, { status: 500 });
  }

  // Carry a rename through to tournaments that use the old name
  let renamedTournaments = 0;
  if (updates.name) {
    const { data: rows } = await listTournamentsWithSpeciesAdmin(prev.name);
    for (const t of rows || []) {
      const next = Array.from(new Set((t.fish_types || []).map((f) => (f === prev.name ? updates.name! : f))));
      const r = await setTournamentFishTypesAdmin(t.id, next);
      if (!r.error) renamedTournaments++;
    }
  }
  return Response.json({ species: data[0], renamedTournaments, error: null });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const { error } = await deleteSpeciesAdmin(id);
  if (error) return Response.json({ error: 'Couldn’t delete that species.' }, { status: 500 });
  return Response.json({ ok: true, error: null });
}
