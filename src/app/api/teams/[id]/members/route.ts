// POST /api/teams/:id/members — invite a teammate by email.
//   { email }                 the captain, before the tournament starts
//   { email, direct: true }   the owning director/admin adds an existing angler straight onto the roster

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { getTournamentSrv, ownsEvent } from '@/lib/tournamentServer';
import { getTeam, inviteToTeam, startedOrOver } from '@/lib/teamServer';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  const { id } = await params;
  const team = await getTeam(id);
  if (!team) return Response.json({ error: 'Team not found.' }, { status: 404 });
  const t = await getTournamentSrv(team.tournament_id);
  if (!t) return Response.json({ error: 'Tournament not found.' }, { status: 404 });
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const director = ownsEvent(user, t);
  const captain = team.captain_id === user.id;
  if (!director && !captain) return Response.json({ error: 'Only the team captain can invite teammates.' }, { status: 403 });
  if (!director && startedOrOver(t)) return Response.json({ error: 'Invites close when the tournament starts. Ask the director to add a teammate.' }, { status: 409 });
  const { member, error } = await inviteToTeam(t, team, String(b.email ?? ''), user, director && b.direct === true);
  if (!member) return Response.json({ error }, { status: 400 });
  return Response.json({ member: { id: member.id, email: member.email, name: member.name, status: member.status }, error: null });
}
