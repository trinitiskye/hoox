// POST /api/tournaments/:id/submissions — submit a catch (registered anglers, during the tournament).
//   { species, weight? (lb), length? (in), catchDate, catchTime, location?, photo?, image? }  → status 'pending'
//   Which measurements are required follows the tournament's judging (weight, length or both).
//   Team members' catches count for their team.

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { dbSubmissionToApp, type DbSubmission } from '@/lib/supabase';
import { getTournamentSrv, registrationsFor, submissionFromBody, submissionWindowProblem, anglerName, insertRow } from '@/lib/tournamentServer';
import { entryFor, type DbReg } from '@/lib/teamServer';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return Response.json({ error: 'Please sign in to submit a catch.' }, { status: 401 });
  const { id } = await params;
  const t = await getTournamentSrv(id);
  if (!t) return Response.json({ error: 'Tournament not found.' }, { status: 404 });
  const regs = (await registrationsFor(t.id)) as DbReg[];
  const entry = await entryFor(t, user.id, regs); // own registration, or an accepted spot on a team
  if (!entry) return Response.json({ error: 'Register for this tournament (or join a team) before submitting catches.' }, { status: 403 });
  const closed = submissionWindowProblem(t);
  if (closed) return Response.json({ error: closed }, { status: 409 });
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const { value, error } = submissionFromBody(b, t, false);
  if (!value) return Response.json({ error }, { status: 400 });
  const { data, error: dbErr } = await insertRow<DbSubmission>('submissions', {
    ...value, tournament_id: t.id, angler: anglerName(user), angler_id: user.id, team_id: entry.teamId, status: 'pending', reviewed_at: null,
  });
  if (dbErr || !data?.[0]) return Response.json({ error: 'Couldn’t save the catch.' }, { status: 500 });
  return Response.json({ submission: dbSubmissionToApp(data[0]), error: null });
}
