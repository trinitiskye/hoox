// PATCH /api/tournaments/:id — edit (the director who created it, or an admin)
// DELETE /api/tournaments/:id — delete, with its registrations and submissions

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { dbTournamentToApp, type DbTournament } from '@/lib/supabase';
import { getTournamentSrv, ownsEvent, tournamentFromBody, patchRow, deleteRow, registrationsFor } from '@/lib/tournamentServer';

type Ctx = { params: Promise<{ id: string }> };

async function load(request: Request, params: Ctx['params']) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { res: Response.json({ error: 'Please sign in.' }, { status: 401 }) };
  const { id } = await params;
  const t = await getTournamentSrv(id);
  if (!t) return { res: Response.json({ error: 'Tournament not found.' }, { status: 404 }) };
  if (!ownsEvent(user, t)) return { res: Response.json({ error: 'You can only change your own tournaments.' }, { status: 403 }) };
  return { t };
}

export async function PATCH(request: Request, { params }: Ctx) {
  const { t, res } = await load(request, params);
  if (!t) return res;
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const { value, error } = tournamentFromBody(b, t);
  if (!value) return Response.json({ error }, { status: 400 });
  // Switching individual ↔ team would orphan existing entries
  if (value.entry_type && value.entry_type !== (t.entry_type || 'individual') && (await registrationsFor(t.id)).length > 0) {
    return Response.json({ error: 'Anglers have already registered, so the entry type can’t change. Cancel those entries first.' }, { status: 409 });
  }
  const { data, error: dbErr } = await patchRow<DbTournament>('tournaments', t.id, value);
  if (dbErr || !data?.[0]) return Response.json({ error: 'Couldn’t save the tournament.' }, { status: 500 });
  return Response.json({ tournament: dbTournamentToApp(data[0]), error: null });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const { t, res } = await load(request, params);
  if (!t) return res;
  const { error } = await deleteRow('tournaments', t.id); // registrations & submissions cascade
  if (error) return Response.json({ error: 'Couldn’t delete the tournament.' }, { status: 500 });
  return Response.json({ ok: true, error: null });
}
