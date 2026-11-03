// Admin-only review of a "Feature your Club" request.
// Approving a request linked to a listed club turns featuring on for the
// plan's length (from the requested start date, or today). Moving an
// approved request to any other status turns it back off.

export const runtime = 'edge';

import {
  getClubFeatureRequestAdmin,
  updateClubFeatureRequestAdmin,
  setClubFeaturedAdmin,
} from '@/lib/supabaseAdmin';
import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { SUBMISSION_STATUSES, featuredUntil, planIn, type SubmissionStatus, type DbClubFeatureRequest } from '@/lib/clubFeature';
import { loadFeaturePricing } from '@/lib/featurePricing';

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

  const { data: before } = await getClubFeatureRequestAdmin(id);
  const prev = before?.[0];
  if (!prev) return Response.json({ error: 'Request not found.' }, { status: 404 });

  const updates: Partial<Pick<DbClubFeatureRequest, 'status' | 'admin_notes' | 'reviewed_at'>> = {};
  if ('status' in body) {
    if (!SUBMISSION_STATUSES.includes(body.status as SubmissionStatus)) return Response.json({ error: 'Unknown status.' }, { status: 400 });
    updates.status = body.status as SubmissionStatus;
    updates.reviewed_at = updates.status === 'new' ? null : new Date().toISOString();
  }
  if ('adminNotes' in body) {
    const notes = typeof body.adminNotes === 'string' ? body.adminNotes.trim() : '';
    if (notes.length > 4000) return Response.json({ error: 'Notes must be 4,000 characters or fewer.' }, { status: 400 });
    updates.admin_notes = notes || null;
  }
  if (Object.keys(updates).length === 0) return Response.json({ error: 'Nothing to update.' }, { status: 400 });

  const { data, error } = await updateClubFeatureRequestAdmin(id, updates);
  if (error || !data?.[0]) return Response.json({ error: error || 'Request not found.' }, { status: 500 });
  const next = data[0];

  let warning: string | null = null;
  let featuredThrough: string | null = null;
  if (updates.status && next.club_submission_id) {
    if (next.status === 'approved') {
      // Use the length quoted when they asked; fall back to current pricing.
      const months = next.term_months || planIn((await loadFeaturePricing()).pricing, next.plan)?.months || 1;
      featuredThrough = featuredUntil(months, next.start_date);
      const r = await setClubFeaturedAdmin(next.club_submission_id, true, featuredThrough);
      if (r.error) warning = /featured/i.test(r.error)
        ? 'Approved, but the club couldn’t be featured. Run supabase/migration_2026_11_club_feature_requests.sql in Supabase.'
        : 'Approved, but the club couldn’t be featured. Please try again.';
    } else if (prev.status === 'approved') {
      await setClubFeaturedAdmin(next.club_submission_id, false, null);
    }
  } else if (updates.status === 'approved' && !next.club_submission_id) {
    warning = 'Approved. This club isn’t listed on HOOX yet, so nothing was featured. Ask them to submit the club first.';
  }

  return Response.json({ request: next, featuredThrough, warning, error: null });
}
