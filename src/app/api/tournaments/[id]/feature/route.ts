// Featuring a tournament (Featured listing and/or Featured page hero).
//
// GET  /api/tournaments/:id/feature → this tournament's feature requests / placements
// POST /api/tournaments/:id/feature → { placement: 'badge' | 'hero', plan, startDate?, phone?, notes?, approve? }
//   The tournament's director sends a request: HOOX reviews it and emails an invoice
//   (same queue as Admin → Marketing → Marketing Promotions → Tournaments).
//   An admin can add it already approved (approve: true), which puts it live.
// Owning director or admin.

export const runtime = 'edge';

import { notifyAdmins, appLink } from '@/lib/email';
import { adminAlertEmail } from '@/lib/emailTemplates';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { supabaseAdminFetch, createFeaturedRequestAdmin, updateFeaturedRequestAdmin, getUserByIdAdmin } from '@/lib/supabaseAdmin';
import { loadTypePricing } from '@/lib/featurePricing';
import { activatePlacement } from '@/lib/featuredServer';
import { planIn, PLACEMENTS, type DbFeaturedRequest, type Placement } from '@/lib/featured';
import { getTournamentSrv, ownsEvent, isAdmin } from '@/lib/tournamentServer';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
type Ctx = { params: Promise<{ id: string }> };

async function load(request: Request, params: Ctx['params']) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { res: Response.json({ error: 'Please sign in.' }, { status: 401 }) };
  const { id } = await params;
  const t = await getTournamentSrv(id);
  if (!t) return { res: Response.json({ error: 'Tournament not found.' }, { status: 404 }) };
  if (!ownsEvent(user, t)) return { res: Response.json({ error: 'Only the tournament’s director can feature it.' }, { status: 403 }) };
  return { user, t };
}

export async function GET(request: Request, { params }: Ctx) {
  const { t, res } = await load(request, params);
  if (!t) return res;
  const { data } = await supabaseAdminFetch<DbFeaturedRequest[]>(`club_feature_requests?listing_type=eq.tournament&listing_id=eq.${encodeURIComponent(t.id)}&select=id,placement,plan_name,price_quoted,status,featured_from,featured_until,created_at&order=created_at.desc`);
  return Response.json({ requests: data ?? [], error: null }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request, { params }: Ctx) {
  const { user, t, res } = await load(request, params);
  if (!t || !user) return res;
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const placement = String(b.placement) as Placement;
  if (!(PLACEMENTS as readonly string[]).includes(placement)) return Response.json({ error: 'Choose Featured listing or Featured page hero.' }, { status: 400 });
  const { pricing } = await loadTypePricing('tournament');
  const plan = planIn(pricing[placement], String(b.plan ?? ''));
  if (!plan) return Response.json({ error: 'Choose a plan.' }, { status: 400 });
  const startDate = typeof b.startDate === 'string' && DATE_RE.test(b.startDate) ? b.startDate : null;
  const s = (k: string, max: number) => (typeof b[k] === 'string' ? (b[k] as string).trim().slice(0, max) : '');

  // The customer is the tournament's director (even when an admin files it)
  const { data: dirRows } = await getUserByIdAdmin(t.created_by);
  const director = dirRows?.[0];
  const customer = director ?? { name: user.name, email: user.email, role: user.role, phone: null as string | null };

  const { data, error } = await createFeaturedRequestAdmin({
    listing_type: 'tournament', listing_id: t.id, placement, source: isAdmin(user) ? 'admin' : 'web',
    requested_by: user.id, requester_name: customer.name, requester_email: customer.email, requester_role: customer.role,
    contact_phone: s('phone', 40) || customer.phone || null, club_submission_id: null, club_name: t.name,
    plan: plan.id, plan_name: plan.name, price_quoted: plan.price, term_months: plan.months,
    start_date: startDate, notes: s('notes', 2000) || null,
  });
  if (error || !data?.[0]) return Response.json({ error: /listing_type|placement|column/i.test(error || '') ? 'Run supabase/migration_2026_11_featured_placements.sql in Supabase first.' : 'Couldn’t send the request.' }, { status: 500 });

  let row = data[0];
  if (!isAdmin(user)) {
    await notifyAdmins({ kind: 'admin_alert', relatedId: t.id, replyTo: customer.email, ...adminAlertEmail({ subject: `Feature request: ${t.name}`, heading: 'New featured tournament request', lines: [`${customer.name} (${customer.email}) asked to feature ${t.name}: ${plan.name} ${placement === 'hero' ? 'page hero' : 'featured listing'}, $${plan.price}.`, 'Send the invoice and approve it in Marketing → Marketing Promotions → Tournaments.'], link: appLink('/admin/marketing/featured/tournaments') }) });
  }
  if (isAdmin(user) && b.approve === true) {
    const { data: upd } = await updateFeaturedRequestAdmin(row.id, { status: 'approved', reviewed_at: new Date().toISOString() });
    row = (await activatePlacement(upd?.[0] ?? { ...row, status: 'approved' })).row;
  }
  return Response.json({ request: { id: row.id, placement: row.placement, plan_name: row.plan_name, price_quoted: row.price_quoted, status: row.status, featured_from: row.featured_from, featured_until: row.featured_until }, error: null });
}
