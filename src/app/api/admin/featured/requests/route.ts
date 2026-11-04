// Admin-only featured placements for all listing types.
//   GET  ?type=tournament|series|club|event   → requests (newest first)
//   POST { type, placement, plan, listingId?, listingName, customerName, customerEmail,
//          phone?, startDate?, price?, notes?, approve?, paidAmount?, paidAt? }
//        → add a placement by hand (deals made by phone or email)

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { listFeaturedRequestsAdmin, createFeaturedRequestAdmin, updateFeaturedRequestAdmin } from '@/lib/supabaseAdmin';
import { loadTypePricing } from '@/lib/featurePricing';
import { activatePlacement } from '@/lib/featuredServer';
import { LISTING_TYPES, PLACEMENTS, planIn, type ListingType, type Placement } from '@/lib/featured';
import { isEmail } from '@/lib/clubSubmission';

const fail = (error: string, status = 400) => Response.json({ error }, { status });
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return fail('Forbidden', 403);
  const t = new URL(request.url).searchParams.get('type') || undefined;
  if (t && !(LISTING_TYPES as readonly string[]).includes(t)) return fail('Unknown listing type.');
  const { data, error } = await listFeaturedRequestsAdmin(t);
  if (error) {
    const msg = /listing_type|placement|column/i.test(error)
      ? 'Run supabase/migration_2026_11_featured_placements.sql in Supabase to turn on featured placements for every listing type.'
      : /club_feature_requests|relation/i.test(error) ? 'Run supabase/migration_2026_11_club_feature_requests.sql in Supabase first.' : 'Couldn’t load requests.';
    return Response.json({ requests: [], error: msg }, { status: 500 });
  }
  return Response.json({ requests: data || [], error: null });
}

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return fail('Forbidden', 403);
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return fail('Invalid request.'); }
  const str = (k: string, max: number) => (typeof b[k] === 'string' ? (b[k] as string).trim().slice(0, max) : '');

  const type = str('type', 20) as ListingType;
  const placement = str('placement', 10) as Placement;
  if (!(LISTING_TYPES as readonly string[]).includes(type)) return fail('Choose a listing type.');
  if (!(PLACEMENTS as readonly string[]).includes(placement)) return fail('Choose a placement.');
  const plan = planIn((await loadTypePricing(type)).pricing[placement], str('plan', 20));
  if (!plan) return fail('Choose a plan.');
  const listingName = str('listingName', 160);
  if (!listingName) return fail('Choose or enter the listing.');
  const customerName = str('customerName', 120);
  const customerEmail = str('customerEmail', 254).toLowerCase();
  if (!customerName) return fail('Enter the customer’s name.');
  if (!isEmail(customerEmail)) return fail('Enter the customer’s email.');
  const startDate = str('startDate', 10);
  if (startDate && !DATE_RE.test(startDate)) return fail('Start date must be a valid date.');
  const priceRaw = b.price === '' || b.price === undefined || b.price === null ? plan.price : Number(b.price);
  if (!Number.isFinite(priceRaw) || priceRaw < 0 || priceRaw > 1_000_000) return fail('Enter a valid price.');
  const paidAmount = b.paidAmount === '' || b.paidAmount === undefined || b.paidAmount === null ? null : Number(b.paidAmount);
  if (paidAmount !== null && (!Number.isFinite(paidAmount) || paidAmount < 0)) return fail('Enter a valid paid amount.');
  const paidAt = str('paidAt', 10);

  const { data, error } = await createFeaturedRequestAdmin({
    listing_type: type, listing_id: str('listingId', 80) || null, placement, source: 'admin',
    requested_by: admin.id, requester_name: customerName, requester_email: customerEmail, requester_role: 'customer',
    contact_phone: str('phone', 40) || null, club_submission_id: type === 'club' && /^[0-9a-f-]{36}$/.test(str('listingId', 80)) ? str('listingId', 80) : null,
    club_name: listingName, plan: plan.id, plan_name: plan.name, price_quoted: Math.round(priceRaw * 100) / 100, term_months: plan.months,
    start_date: startDate || null, notes: str('notes', 2000) || null,
    amount_paid: paidAmount, paid_at: paidAmount !== null ? (paidAt && DATE_RE.test(paidAt) ? `${paidAt}T12:00:00Z` : new Date().toISOString()) : null,
  });
  if (error || !data?.[0]) return fail(/column|listing_type|placement/i.test(error || '') ? 'Run supabase/migration_2026_11_featured_placements.sql in Supabase first.' : 'Couldn’t add the placement.', 500);

  let row = data[0];
  let warning: string | null = null;
  if (b.approve === true) {
    const { data: upd } = await updateFeaturedRequestAdmin(row.id, { status: 'approved', reviewed_at: new Date().toISOString() });
    row = upd?.[0] ?? { ...row, status: 'approved' };
    const act = await activatePlacement(row);
    row = act.row; warning = act.warning;
  }
  return Response.json({ request: row, warning, error: null });
}
