// GET /api/me/team-invites — open team invites for the signed-in angler's email.
// Invites sent before someone had an account show up here as soon as they sign up with that email.

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { supabaseAdminFetch } from '@/lib/supabaseAdmin';
import { invitesForEmail, type DbTeam } from '@/lib/teamServer';
import type { DbTournament } from '@/lib/supabase';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return Response.json({ invites: [], error: 'Please sign in.' }, { status: 401 });
  const invites = await invitesForEmail(user.email);
  if (invites.length === 0) return Response.json({ invites: [], error: null });
  const list = (ids: string[]) => ids.map((i) => `"${i}"`).join(',');
  const [teams, tournaments, captains] = await Promise.all([
    supabaseAdminFetch<DbTeam[]>(`teams?id=in.(${list([...new Set(invites.map((i) => i.team_id))])})&select=*`),
    supabaseAdminFetch<DbTournament[]>(`tournaments?id=in.(${list([...new Set(invites.map((i) => i.tournament_id))])})&select=id,name,start_date,end_date,city,state`),
    supabaseAdminFetch<{ id: string; name: string }[]>(`users?id=in.(${list([...new Set(invites.map((i) => i.invited_by || ''))].filter(Boolean))})&select=id,name`),
  ]);
  const team = new Map((teams.data ?? []).map((x) => [x.id, x]));
  const tour = new Map((tournaments.data ?? []).map((x) => [x.id, x]));
  const cap = new Map((captains.data ?? []).map((x) => [x.id, x.name]));
  return Response.json({
    invites: invites.map((i) => ({
      id: i.id, invitedAt: i.invited_at,
      team: team.get(i.team_id)?.name ?? 'Team', invitedBy: (i.invited_by && cap.get(i.invited_by)) || 'Your captain',
      tournament: tour.get(i.tournament_id) ? { id: i.tournament_id, name: tour.get(i.tournament_id)!.name, startDate: tour.get(i.tournament_id)!.start_date, endDate: tour.get(i.tournament_id)!.end_date } : null,
    })),
    error: null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
