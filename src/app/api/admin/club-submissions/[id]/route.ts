// src/app/api/admin/club-submissions/[id]/route.ts
// Admin-only review update: change status and/or internal notes.

export const runtime = 'edge';

import { updateClubSubmissionAdmin } from '@/lib/supabaseAdmin';
import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { SUBMISSION_STATUSES, type SubmissionStatus, type DbClubSubmission } from '@/lib/clubSubmission';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const updates: Partial<Pick<DbClubSubmission, 'status' | 'admin_notes' | 'reviewed_at'>> = {};
  if ('status' in body) {
    if (!SUBMISSION_STATUSES.includes(body.status as SubmissionStatus)) {
      return Response.json({ error: 'Unknown status.' }, { status: 400 });
    }
    updates.status = body.status as SubmissionStatus;
    updates.reviewed_at = updates.status === 'new' ? null : new Date().toISOString();
  }
  if ('adminNotes' in body) {
    const notes = typeof body.adminNotes === 'string' ? body.adminNotes.trim() : '';
    if (notes.length > 4000) return Response.json({ error: 'Notes must be 4,000 characters or fewer.' }, { status: 400 });
    updates.admin_notes = notes || null;
  }
  if (Object.keys(updates).length === 0) return Response.json({ error: 'Nothing to update.' }, { status: 400 });

  const { data, error } = await updateClubSubmissionAdmin(id, updates);
  if (error || !data?.[0]) return Response.json({ error: error || 'Submission not found.' }, { status: error ? 500 : 404 });
  return Response.json({ submission: data[0], error: null });
}
