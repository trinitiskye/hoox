// GET /api/tournaments/:id/entries — the director's view of every entry:
// anglers or teams with their rosters (emails included), open invites,
// side pots and fees. The owning director or an admin.

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { getTournamentSrv, ownsEvent, registrationsFor } from '@/lib/tournamentServer';
import { formatFromRow, buyInPots } from '@/lib/tournamentFormat';
import { teamsForTournament, membersForTournament, type DbReg } from '@/lib/teamServer';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  const { id } = await params;
  const t = await getTournamentSrv(id);
  if (!t) return Response.json({ error: 'Tournament not found.' }, { status: 404 });
  if (!ownsEvent(user, t)) return Response.json({ error: 'Only the tournament director can see entries.' }, { status: 403 });
  const f = formatFromRow(t);
  const [regs, teams, members] = await Promise.all([registrationsFor(t.id) as Promise<DbReg[]>, teamsForTournament(t.id), membersForTournament(t.id)]);
  const teamById = new Map(teams.map((x) => [x.id, x]));
  const entries = regs.map((r) => ({
    registrationId: r.id, name: r.angler, anglerId: r.angler_id, registeredAt: r.registered_at,
    fee: Number(r.fee ?? 0), sidePots: r.side_pots ?? [], sidePotFees: Number(r.side_pot_fees ?? 0),
    team: r.team_id && teamById.get(r.team_id) ? {
      id: r.team_id, name: teamById.get(r.team_id)!.name,
      members: members.filter((m) => m.team_id === r.team_id && m.status !== 'removed').map((m) => ({ id: m.id, name: m.name, email: m.email, role: m.role, status: m.status })),
      // Fewer accepted anglers than the tournament's minimum team size
      belowMinimum: members.filter((m) => m.team_id === r.team_id && m.status === 'accepted').length < f.teamMin,
    } : null,
  }));
  const pots = buyInPots(f).map((p) => ({ id: p.id, name: p.name, fee: p.fee, entrants: entries.filter((e) => e.sidePots.includes(p.id)).length }));
  return Response.json({
    format: { entryType: f.entryType, teamMin: f.teamMin, teamMax: f.teamMax, feeBasis: f.feeBasis },
    entries, pots,
    incompleteTeams: entries.filter((e) => e.team?.belowMinimum).length,
    totals: { entries: entries.length, anglers: f.entryType === 'team' ? members.filter((m) => m.status === 'accepted').length : entries.length, fees: entries.reduce((n, e) => n + e.fee, 0), sidePotFees: entries.reduce((n, e) => n + e.sidePotFees, 0) },
    error: null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
