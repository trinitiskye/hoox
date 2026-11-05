// DELETE /api/registrations/:id — cancel a registration.
//   The angler can cancel their own before the tournament starts; the owning director or an admin anytime.

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { todayIso } from '@/lib/featured';
import { getRegistrationSrv, getTournamentSrv, ownsEvent, deleteRow } from '@/lib/tournamentServer';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  const { id } = await params;
  const r = await getRegistrationSrv(id);
  if (!r) return Response.json({ error: 'Registration not found.' }, { status: 404 });
  const t = await getTournamentSrv(r.tournament_id);
  const own = r.angler_id === user.id;
  if (!ownsEvent(user, t) && !(own && t && t.start_date > todayIso())) {
    return Response.json({ error: own ? 'Registrations can’t be cancelled once the tournament has started. Contact the director.' : 'You can’t cancel this registration.' }, { status: 403 });
  }
  const { error } = await deleteRow('registrations', r.id);
  if (error) return Response.json({ error: 'Couldn’t cancel the registration.' }, { status: 500 });
  return Response.json({ ok: true, error: null });
}
