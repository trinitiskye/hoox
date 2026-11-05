// PATCH /api/team-members/:id — answer an invite: { action: 'accept' | 'decline' }
//   The invited angler (signed in with the invited email), before the tournament starts.
// DELETE /api/team-members/:id — remove a teammate or cancel an invite (captain or director),
//   or leave the team (the member). The captain can't leave; they cancel the entry instead.

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { getTournamentSrv, ownsEvent, patchRow, anglerName } from '@/lib/tournamentServer';
import { supabaseAdminFetch } from '@/lib/supabaseAdmin';
import { formatFromRow } from '@/lib/tournamentFormat';
import { getMember, getTeam, membersOf, startedOrOver, syncTeamFee, type DbTeamMember } from '@/lib/teamServer';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getAuthenticatedUser(request);
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  const { id } = await params;
  const m = await getMember(id);
  if (!m || m.status !== 'invited') return Response.json({ error: 'This invite is no longer open.' }, { status: 404 });
  if (m.email !== user.email.toLowerCase()) return Response.json({ error: 'This invite was sent to a different email.' }, { status: 403 });
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const t = await getTournamentSrv(m.tournament_id);
  if (!t) return Response.json({ error: 'Tournament not found.' }, { status: 404 });
  const now = new Date().toISOString();

  if (b.action === 'decline') {
    await patchRow('team_members', m.id, { status: 'declined', responded_at: now, user_id: user.id, name: anglerName(user) });
    return Response.json({ status: 'declined', error: null });
  }
  if (b.action !== 'accept') return Response.json({ error: 'Choose accept or decline.' }, { status: 400 });
  if (user.role !== 'angler') return Response.json({ error: 'Only angler accounts can join a team.' }, { status: 403 });
  if (startedOrOver(t)) return Response.json({ error: 'This tournament has started. Ask the director to add you to the team.' }, { status: 409 });
  const { data: other } = await supabaseAdminFetch<DbTeamMember[]>(`team_members?tournament_id=eq.${t.id}&user_id=eq.${encodeURIComponent(user.id)}&status=eq.accepted&select=id`);
  if (other?.length) return Response.json({ error: 'You’re already on a team in this tournament. Leave it first.' }, { status: 409 });
  const { data: solo } = await supabaseAdminFetch(`registrations?tournament_id=eq.${t.id}&angler_id=eq.${encodeURIComponent(user.id)}&team_id=is.null&select=id`);
  if (Array.isArray(solo) && solo.length) return Response.json({ error: 'You’re already registered on your own in this tournament.' }, { status: 409 });
  const accepted = (await membersOf(m.team_id)).filter((x) => x.status === 'accepted').length;
  if (accepted >= formatFromRow(t).teamMax) return Response.json({ error: 'This team is already full.' }, { status: 409 });

  const { error } = await patchRow('team_members', m.id, { status: 'accepted', responded_at: now, user_id: user.id, name: anglerName(user) });
  if (error) return Response.json({ error: /one_team|duplicate/i.test(error) ? 'You’re already on a team in this tournament.' : 'Couldn’t join the team.' }, { status: 500 });
  await syncTeamFee(t, m.team_id);
  const team = await getTeam(m.team_id);
  return Response.json({ status: 'accepted', team: team ? { id: team.id, name: team.name } : null, error: null });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const user = await getAuthenticatedUser(request);
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  const { id } = await params;
  const m = await getMember(id);
  if (!m || m.status === 'removed') return Response.json({ error: 'Teammate not found.' }, { status: 404 });
  const team = await getTeam(m.team_id);
  const t = await getTournamentSrv(m.tournament_id);
  if (!team || !t) return Response.json({ error: 'Team not found.' }, { status: 404 });
  const director = ownsEvent(user, t);
  const captain = team.captain_id === user.id;
  const self = m.user_id === user.id;
  if (m.role === 'captain') return Response.json({ error: 'The captain can’t be removed. Cancel the team entry instead.' }, { status: 400 });
  if (!director && !captain && !self) return Response.json({ error: 'You can’t change this team.' }, { status: 403 });
  if (!director && startedOrOver(t) && m.status === 'accepted') return Response.json({ error: 'Rosters are locked once the tournament starts. Contact the director.' }, { status: 409 });
  await patchRow('team_members', m.id, { status: 'removed', responded_at: new Date().toISOString() });
  await syncTeamFee(t, team.id);
  return Response.json({ ok: true, error: null });
}
