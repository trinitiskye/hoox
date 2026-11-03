// src/app/api/club-feature-requests/route.ts
// "Feature your Club" request from /clubs/feature. Requires a signed-in
// Angler or Tournament Director (signed session cookie). Nothing is billed
// here; an admin reviews the request and follows up with an invoice.

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { getClubSubmissionAdmin, createClubFeatureRequestAdmin } from '@/lib/supabaseAdmin';
import { CLUB_SUBMIT_ROLES } from '@/lib/clubSubmission';
import { planIn, type FeaturePlanId, type FeaturePlan } from '@/lib/clubFeature';
import { loadFeaturePricing } from '@/lib/featurePricing';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const fail = (error: string, code: string, status = 400) => Response.json({ ok: false, error, code }, { status });

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return fail('Please sign in to request a featured listing.', 'auth_required', 401);
    if (!(CLUB_SUBMIT_ROLES as readonly string[]).includes(user.role)) {
      return fail('Featuring a club needs an Angler or Tournament Director account.', 'role_not_allowed', 403);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return fail('Invalid request.', 'invalid');
    }
    const str = (k: string, max: number) => {
      const v = typeof body[k] === 'string' ? (body[k] as string).trim() : '';
      if (v.length > max) throw new Error(`${k} is too long.`);
      return v;
    };

    let clubName = '';
    let clubId: string | null = null;
    let plan: FeaturePlanId;
    let chosen: FeaturePlan;
    let start: string | null;
    let phone: string, promo: string, notes: string;
    try {
      const planRaw = str('plan', 20);
      const { pricing } = await loadFeaturePricing();
      const found = planIn(pricing, planRaw);
      if (!found || !found.enabled) return fail('That plan isn’t available. Please choose another plan.', 'invalid');
      plan = found.id;
      chosen = found;

      start = str('startDate', 10) || null;
      if (start) {
        if (!DATE_RE.test(start)) return fail('Start date must be a valid date.', 'invalid');
        const today = new Date().toISOString().slice(0, 10);
        if (start < today) return fail('Start date can’t be in the past.', 'invalid');
      }
      phone = str('contactPhone', 40);
      promo = str('promoCode', 40);
      notes = str('notes', 2000);

      const id = str('clubSubmissionId', 64);
      if (id) {
        const { data } = await getClubSubmissionAdmin(id);
        const club = data?.[0];
        // Only your own clubs (admins can request for any club)
        if (!club || (club.submitted_by !== user.id && user.role !== 'admin')) return fail('We couldn’t find that club on your account.', 'invalid');
        if (club.status === 'declined') return fail('That club listing was declined, so it can’t be featured.', 'invalid');
        clubId = club.id;
        clubName = club.club_name;
      } else {
        clubName = str('clubName', 160);
        if (!clubName) return fail('Choose your club or enter its name.', 'invalid');
      }
    } catch (e) {
      return fail(e instanceof Error ? e.message : 'Invalid request.', 'invalid');
    }

    const row = {
      requested_by: user.id,
      requester_name: user.name,
      requester_email: user.email,
      requester_role: user.role,
      contact_phone: phone || null,
      club_submission_id: clubId,
      club_name: clubName,
      plan,
      start_date: start,
      promo_code: promo || null,
      notes: notes || null,
    };
    // Record the price and length quoted right now, so later pricing edits don't change this request.
    let { error } = await createClubFeatureRequestAdmin({ ...row, price_quoted: chosen.price, term_months: chosen.months, plan_name: chosen.name });
    if (error && /price_quoted|term_months|plan_name/i.test(error)) {
      ({ error } = await createClubFeatureRequestAdmin(row)); // pricing migration not run yet
    }
    if (error) return fail('We couldn’t save your request. Please try again in a moment.', 'unknown', 500);
    return Response.json({ ok: true, error: null, code: null });
  } catch {
    return fail('Something went wrong on our end. Please try again in a moment.', 'unknown', 500);
  }
}
