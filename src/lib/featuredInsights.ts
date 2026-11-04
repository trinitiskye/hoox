// Revenue & activity insights for featured placements (pure functions).
//   booked    = price of approved placements (counted in the month approved)
//   collected = payments recorded (counted in the month paid)
//   outstanding = booked − collected, for approved placements
//   pipeline  = price of requests still New / Invoice sent
import {
  LISTING_TYPES, PLACEMENTS, isActivePlacement, priceOf, todayIso,
  type DbFeaturedRequest, type ListingType, type Placement,
} from './featured';

export interface MonthPoint { key: string; label: string; booked: Record<Placement, number>; collected: number }
export interface Insights {
  booked: number; collected: number; outstanding: number; pipeline: number;
  bookedThisMonth: number; bookedLastMonth: number; bookedYtd: number;
  approvedCount: number; pendingCount: number; declinedCount: number; winRate: number | null;
  active: Record<Placement, number>;
  expiring: DbFeaturedRequest[];
  unpaid: DbFeaturedRequest[];
  months: MonthPoint[];
  byType: { type: ListingType; booked: number; collected: number; active: number; pending: number }[];
  byPlacement: Record<Placement, { booked: number; count: number }>;
  byPlan: { plan: string; count: number; booked: number }[];
  topListings: { name: string; type: ListingType; booked: number; placements: number }[];
}

const monthKey = (iso: string) => iso.slice(0, 7);
const approvedAt = (r: DbFeaturedRequest) => r.reviewed_at || r.updated_at || r.created_at;

export function computeInsights(rows: DbFeaturedRequest[], monthsBack = 12): Insights {
  const today = todayIso();
  const thisMonth = today.slice(0, 7);
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - 1);
  const lastMonth = d.toISOString().slice(0, 7);
  const year = today.slice(0, 4);

  const approved = rows.filter((r) => r.status === 'approved');
  const pending = rows.filter((r) => r.status === 'new' || r.status === 'in_review');
  const declined = rows.filter((r) => r.status === 'declined');
  const sum = (list: DbFeaturedRequest[], f: (r: DbFeaturedRequest) => number) => Math.round(list.reduce((n, r) => n + f(r), 0) * 100) / 100;

  const booked = sum(approved, priceOf);
  const collected = sum(rows, (r) => Number(r.amount_paid ?? 0));
  const outstanding = Math.max(0, sum(approved, (r) => Math.max(0, priceOf(r) - Number(r.amount_paid ?? 0))));

  // Last N months, oldest first
  const months: MonthPoint[] = [];
  const cur = new Date(`${thisMonth}-15T12:00:00Z`);
  cur.setUTCMonth(cur.getUTCMonth() - (monthsBack - 1));
  for (let i = 0; i < monthsBack; i++) {
    const key = cur.toISOString().slice(0, 7);
    months.push({ key, label: cur.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }) + (key.endsWith('-01') ? ` ’${key.slice(2, 4)}` : ''), booked: { badge: 0, hero: 0 }, collected: 0 });
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  const at = (k: string) => months.find((m) => m.key === k);
  approved.forEach((r) => { const m = at(monthKey(approvedAt(r))); if (m) m.booked[r.placement] += priceOf(r); });
  rows.forEach((r) => { if (r.paid_at && r.amount_paid) { const m = at(monthKey(r.paid_at)); if (m) m.collected += Number(r.amount_paid); } });

  const plans = new Map<string, { plan: string; count: number; booked: number }>();
  approved.forEach((r) => {
    const k = r.plan_name || r.plan;
    const p = plans.get(k) ?? { plan: k, count: 0, booked: 0 };
    p.count++; p.booked += priceOf(r); plans.set(k, p);
  });

  const listings = new Map<string, { name: string; type: ListingType; booked: number; placements: number }>();
  approved.forEach((r) => {
    const k = `${r.listing_type}:${r.listing_id || r.club_name}`;
    const l = listings.get(k) ?? { name: r.club_name, type: r.listing_type, booked: 0, placements: 0 };
    l.booked += priceOf(r); l.placements++; listings.set(k, l);
  });

  const in14 = new Date(`${today}T12:00:00Z`); in14.setUTCDate(in14.getUTCDate() + 14);
  const soon = in14.toISOString().slice(0, 10);
  const decided = approved.length + declined.length;

  return {
    booked, collected, outstanding, pipeline: sum(pending, priceOf),
    bookedThisMonth: sum(approved.filter((r) => monthKey(approvedAt(r)) === thisMonth), priceOf),
    bookedLastMonth: sum(approved.filter((r) => monthKey(approvedAt(r)) === lastMonth), priceOf),
    bookedYtd: sum(approved.filter((r) => approvedAt(r).startsWith(year)), priceOf),
    approvedCount: approved.length, pendingCount: pending.length, declinedCount: declined.length,
    winRate: decided ? Math.round((approved.length / decided) * 100) : null,
    active: { badge: rows.filter((r) => r.placement === 'badge' && isActivePlacement(r, today)).length, hero: rows.filter((r) => r.placement === 'hero' && isActivePlacement(r, today)).length },
    expiring: rows.filter((r) => isActivePlacement(r, today) && r.featured_until! <= soon).sort((a, b) => a.featured_until!.localeCompare(b.featured_until!)),
    unpaid: approved.filter((r) => Number(r.amount_paid ?? 0) < priceOf(r)).sort((a, b) => approvedAt(a).localeCompare(approvedAt(b))),
    months: months.map((m) => ({ ...m, booked: { badge: Math.round(m.booked.badge * 100) / 100, hero: Math.round(m.booked.hero * 100) / 100 }, collected: Math.round(m.collected * 100) / 100 })),
    byType: LISTING_TYPES.map((t) => {
      const of = rows.filter((r) => r.listing_type === t);
      return {
        type: t,
        booked: sum(of.filter((r) => r.status === 'approved'), priceOf),
        collected: sum(of, (r) => Number(r.amount_paid ?? 0)),
        active: of.filter((r) => isActivePlacement(r, today)).length,
        pending: of.filter((r) => r.status === 'new' || r.status === 'in_review').length,
      };
    }),
    byPlacement: Object.fromEntries(PLACEMENTS.map((p) => [p, { booked: sum(approved.filter((r) => r.placement === p), priceOf), count: approved.filter((r) => r.placement === p).length }])) as Insights['byPlacement'],
    byPlan: [...plans.values()].sort((a, b) => b.booked - a.booked),
    topListings: [...listings.values()].sort((a, b) => b.booked - a.booked).slice(0, 8),
  };
}
