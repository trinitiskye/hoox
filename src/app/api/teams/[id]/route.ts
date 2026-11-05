// GET /api/teams/:id — the team roster (captain, accepted teammates, open invites).
//   Team members, the owning director and admins. Emails are shown to the captain and director only.

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { getTournamentSrv, ownsEvent } from '@/lib/tournamentServer';
import { getTeam, membersOf, registrationForTeam } from '@/lib/teamServer';
import { formatFromRow } from '@/lib/tournamentFormat';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  const { id } = await params;
  const team = await getTeam(id);
  if (!team) return Response.json({ error: 'Team not found.' }, { status: 404 });
  const t = await getTournamentSrv(team.tournament_id);
  const members = await membersOf(team.id);
  const director = ownsEvent(user, t);
  const onTeam = members.some((m) => m.user_id === user.id && m.status === 'accepted');
  if (!director && !onTeam) return Response.json({ error: 'You’re not on this team.' }, { status: 403 });
  const showEmail = director || team.captain_id === user.id;
  const reg = await registrationForTeam(team.id);
  const f = t ? formatFromRow(t) : null;
  return Response.json({
    team: { id: team.id, name: team.name, captainId: team.captain_id, tournamentId: team.tournament_id, registrationId: reg?.id ?? null, sidePots: reg?.side_pots ?? [] },
    limits: f ? { min: f.teamMin, max: f.teamMax } : null,
    members: members.filter((m) => m.status !== 'removed').map((m) => ({
      id: m.id, name: m.name, role: m.role, status: m.status, email: showEmail ? m.email : undefined, invitedAt: m.invited_at,
    })),
    error: null,
  });
}
