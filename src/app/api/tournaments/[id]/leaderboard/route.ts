// GET /api/tournaments/:id/leaderboard — public standings, place prizes and side pots.
// Computed on the server from approved catches (src/lib/scoring.ts) so team
// rosters (which hold invite emails) never leave the server; only names do.

export const runtime = 'edge';

import { supabaseAdminFetch } from '@/lib/supabaseAdmin';
import { getTournamentSrv, registrationsFor } from '@/lib/tournamentServer';
import { formatFromRow } from '@/lib/tournamentFormat';
import { computeScoreboard, type ScoreSubmission } from '@/lib/scoring';
import { teamsForTournament, membersForTournament } from '@/lib/teamServer';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTournamentSrv(id);
  if (!t) return Response.json({ error: 'Tournament not found.' }, { status: 404 });
  const f = formatFromRow(t);
  const [regs, subs, teams, members] = await Promise.all([
    registrationsFor(t.id),
    supabaseAdminFetch<ScoreSubmission[]>(`submissions?tournament_id=eq.${encodeURIComponent(t.id)}&status=eq.approved&select=*&limit=50000`),
    f.entryType === 'team' ? teamsForTournament(t.id) : Promise.resolve([]),
    f.entryType === 'team' ? membersForTournament(t.id) : Promise.resolve([]),
  ]);
  const board = computeScoreboard(f, regs, subs.data ?? [], teams, members);
  return Response.json({
    tournament: { id: t.id, name: t.name },
    format: {
      entryType: f.entryType, teamMin: f.teamMin, teamMax: f.teamMax, feeBasis: f.feeBasis,
      scoring: f.scoring, primaryMeasure: f.primaryMeasure, fishLimit: f.fishLimit, speciesLimits: f.speciesLimits, placePrizes: f.placePrizes,
      sidePots: f.sidePots.map((p) => ({ ...p, winnerId: undefined })),
    },
    ...board,
    pots: board.pots.map((p) => ({ ...p, pot: { ...p.pot, winnerId: undefined } })),
    error: null,
  }, { headers: { 'Cache-Control': 'public, max-age=30' } });
}
