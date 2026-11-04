// Admin-only: review one featured placement.
//   PATCH { status?, adminNotes?, payment?: { amount, paidAt } | null, listingId?, listingName? }
// Approving sets the placement's dates and turns it on; moving an approved
// placement to any other status turns it off.

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { getFeaturedRequestAdmin, updateFeaturedRequestAdmin } from '@/lib/supabaseAdmin';
import { activatePlacement, deactivatePlacement } from '@/lib/featuredServer';
import { SUBMISSION_STATUSES, type DbFeaturedRequest, type SubmissionStatus } from '@/lib/featured';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }

  const { data: before } = await getFeaturedRequestAdmin(id);
  const prev = before?.[0];
  if (!prev) return Response.json({ error: 'Request not found.' }, { status: 404 });

  const patch: Partial<DbFeaturedRequest> = {};
  if ('status' in b) {
    if (!SUBMISSION_STATUSES.includes(b.status as SubmissionStatus)) return Response.json({ error: 'Unknown status.' }, { status: 400 });
    patch.status = b.status as SubmissionStatus;
    patch.reviewed_at = patch.status === 'new' ? null : new Date().toISOString();
  }
  if ('adminNotes' in b) {
    const n = typeof b.adminNotes === 'string' ? b.adminNotes.trim() : '';
    if (n.length > 4000) return Response.json({ error: 'Notes must be 4,000 characters or fewer.' }, { status: 400 });
    patch.admin_notes = n || null;
  }
  if ('payment' in b) {
    if (b.payment === null) { patch.amount_paid = null; patch.paid_at = null; }
    else {
      const p = b.payment as { amount?: unknown; paidAt?: unknown };
      const amount = Number(p?.amount);
      if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) return Response.json({ error: 'Enter a valid amount.' }, { status: 400 });
      const d = typeof p?.paidAt === 'string' && DATE_RE.test(p.paidAt) ? `${p.paidAt}T12:00:00Z` : new Date().toISOString();
      patch.amount_paid = Math.round(amount * 100) / 100; patch.paid_at = d;
    }
  }
  if ('listingId' in b || 'listingName' in b) {
    const lid = typeof b.listingId === 'string' ? b.listingId.trim().slice(0, 80) : '';
    const name = typeof b.listingName === 'string' ? b.listingName.trim().slice(0, 160) : '';
    patch.listing_id = lid || null;
    if (name) patch.club_name = name;
  }
  if (!Object.keys(patch).length) return Response.json({ error: 'Nothing to update.' }, { status: 400 });

  const { data, error } = await updateFeaturedRequestAdmin(id, patch);
  if (error || !data?.[0]) return Response.json({ error: 'Couldn’t save.' }, { status: 500 });
  let row = data[0];
  let warning: string | null = null;

  const nowApproved = row.status === 'approved';
  const relinked = 'listingId' in b && prev.listing_id !== row.listing_id;
  if (nowApproved && (prev.status !== 'approved' || relinked)) {
    if (relinked && prev.status === 'approved') await deactivatePlacement(prev);
    const act = await activatePlacement(row);
    row = act.row; warning = act.warning;
  } else if (!nowApproved && prev.status === 'approved') {
    await deactivatePlacement(prev);
  }
  return Response.json({ request: row, warning, error: null });
}
