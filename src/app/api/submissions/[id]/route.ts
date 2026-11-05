// PATCH /api/submissions/:id — review a catch: { status: 'approved' | 'denied' | 'pending', species?, size?, … }
//   The owning director, their approved judges, or an admin.
// DELETE /api/submissions/:id — the angler while it's pending, or the owning director/admin.

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { dbSubmissionToApp, type DbSubmission } from '@/lib/supabase';
import { getSubmissionSrv, getTournamentSrv, canReview, ownsEvent, submissionFromBody, patchRow, deleteRow, SUBMISSION_REVIEW } from '@/lib/tournamentServer';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getAuthenticatedUser(request);
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  const { id } = await params;
  const s = await getSubmissionSrv(id);
  if (!s) return Response.json({ error: 'Catch not found.' }, { status: 404 });
  const t = await getTournamentSrv(s.tournament_id);
  if (!t || !(await canReview(user, t))) return Response.json({ error: 'Only this tournament’s director and judges can review catches.' }, { status: 403 });
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const { value, error } = submissionFromBody(b, t, true);
  if (!value) return Response.json({ error }, { status: 400 });
  if ('status' in b) {
    if (!(SUBMISSION_REVIEW as readonly string[]).includes(String(b.status))) return Response.json({ error: 'Unknown status.' }, { status: 400 });
    value.status = String(b.status);
    value.reviewed_at = value.status === 'pending' ? null : new Date().toISOString();
  }
  const { data, error: dbErr } = await patchRow<DbSubmission>('submissions', s.id, value);
  if (dbErr || !data?.[0]) return Response.json({ error: 'Couldn’t save the review.' }, { status: 500 });
  return Response.json({ submission: dbSubmissionToApp(data[0]), error: null });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const user = await getAuthenticatedUser(request);
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  const { id } = await params;
  const s = await getSubmissionSrv(id);
  if (!s) return Response.json({ error: 'Catch not found.' }, { status: 404 });
  const t = await getTournamentSrv(s.tournament_id);
  const ownPending = s.angler_id === user.id && s.status === 'pending';
  if (!ownPending && !ownsEvent(user, t)) return Response.json({ error: 'You can’t delete this catch.' }, { status: 403 });
  const { error } = await deleteRow('submissions', s.id);
  if (error) return Response.json({ error: 'Couldn’t delete the catch.' }, { status: 500 });
  return Response.json({ ok: true, error: null });
}
