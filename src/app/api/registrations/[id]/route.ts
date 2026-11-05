// PATCH /api/registrations/:id — change side pots or the team name.
//   { sidePots?: string[], teamName? }
//   The angler / team captain before the tournament starts, or the owning director/admin anytime.
// DELETE /api/registrations/:id — cancel an entry (a team entry removes the team and its roster).
//   The angler / captain before the tournament starts, or the owning director/admin anytime.

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { dbRegistrationToApp, type DbRegistration } from '@/lib/supabase';
import { formatFromRow, buyInPots, entryCost } from '@/lib/tournamentFormat';
import { getRegistrationSrv, getTournamentSrv, ownsEvent, patchRow, deleteRow } from '@/lib/tournamentServer';
import { startedOrOver, membersOf, type DbReg } from '@/lib/teamServer';

type Ctx = { params: Promise<{ id: string }> };

async function load(request: Request, params: Ctx['params']) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { res: Response.json({ error: 'Please sign in.' }, { status: 401 }) };
  const { id } = await params;
  const r = (await getRegistrationSrv(id)) as DbReg | null;
  if (!r) return { res: Response.json({ error: 'Registration not found.' }, { status: 404 }) };
  const t = await getTournamentSrv(r.tournament_id);
  if (!t) return { res: Response.json({ error: 'Tournament not found.' }, { status: 404 }) };
  const director = ownsEvent(user, t);
  const own = r.angler_id === user.id; // the angler, or the team's captain
  if (!director && !(own && !startedOrOver(t))) {
    return { res: Response.json({ error: own ? 'Entries can’t be changed once the tournament has started. Contact the director.' : 'You can’t change this entry.' }, { status: 403 }) };
  }
  return { r, t };
}

export async function PATCH(request: Request, { params }: Ctx) {
  const { r, t, res } = await load(request, params);
  if (!r || !t) return res;
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const f = formatFromRow(t);
  const patch: Partial<DbReg> = {};
  if ('sidePots' in b) {
    const wanted = Array.isArray(b.sidePots) ? (b.sidePots as unknown[]).map(String) : [];
    const potIds = buyInPots(f).filter((p) => wanted.includes(p.id)).map((p) => p.id);
    if (wanted.length !== potIds.length) return Response.json({ error: 'One of those side pots isn’t offered in this tournament.' }, { status: 400 });
    patch.side_pots = potIds;
    patch.side_pot_fees = entryCost(f, 0, 1, potIds).pots;
  }
  if ('teamName' in b) {
    if (!r.team_id) return Response.json({ error: 'This isn’t a team entry.' }, { status: 400 });
    const name = typeof b.teamName === 'string' ? b.teamName.trim().slice(0, 80) : '';
    if (!name) return Response.json({ error: 'Enter a team name.' }, { status: 400 });
    patch.angler = name;
    await patchRow('teams', r.team_id, { name });
  }
  const { data, error } = await patchRow<DbRegistration>('registrations', r.id, patch);
  if (error || !data?.[0]) return Response.json({ error: 'Couldn’t save the entry.' }, { status: 500 });
  return Response.json({ registration: dbRegistrationToApp(data[0]), sidePots: (data[0] as DbReg).side_pots ?? [], error: null });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const { r, res } = await load(request, params);
  if (!r) return res;
  if (r.team_id) {
    const roster = await membersOf(r.team_id);
    void roster; // teammates will be notified here once email is connected
    const { error } = await deleteRow('teams', r.team_id); // removes the roster and the registration too
    if (error) return Response.json({ error: 'Couldn’t cancel the team entry.' }, { status: 500 });
  } else {
    const { error } = await deleteRow('registrations', r.id);
    if (error) return Response.json({ error: 'Couldn’t cancel the registration.' }, { status: 500 });
  }
  return Response.json({ ok: true, error: null });
}
