// Sponsor Programs: brands that pay HOOX for promotion (client + server safe).
//
// Two kinds of package, both editable in Admin → Marketing → Sponsor Programs → Packages:
//   tier      — HOOX sponsor tiers (Presenting / Gold / Silver / Bronze), sold by month, season or year
//   placement — à-la-carte brand placements (tournament title sponsor, app splash, newsletter …)
//
// Data lives in public.sponsor_accounts (the brands) and public.sponsor_promotions
// (each sold or proposed promotion). Packages are stored in site_settings under 'sponsor_packages'.

import { formatMoney, featuredUntil } from './clubFeature';
import { todayIso } from './featured';
export { formatMoney, todayIso };

export const SPONSOR_KINDS = ['tier', 'placement'] as const;
export type SponsorKind = (typeof SPONSOR_KINDS)[number];
export const KIND_META: Record<SponsorKind, { label: string; short: string; color: string }> = {
  // Validated chart pair (same as Marketing Promotions): CVD-safe, ≥ 3:1 on white
  tier: { label: 'Sponsor tiers', short: 'Tier', color: '#009B94' },
  placement: { label: 'Brand placements', short: 'Placement', color: '#C4560E' },
};

/** One way to buy a package. months: 1 / 3 / 12, or 0 for a one-time placement (per event, per send …) */
export interface PriceOption { id: string; label: string; price: number; months: number }
export interface SponsorPackage {
  id: string;
  kind: SponsorKind;
  name: string;
  blurb: string;
  perks: string[];
  options: PriceOption[];
  /** Max brands at once (e.g. 1 Presenting sponsor). 0 = no limit */
  slots: number;
  enabled: boolean;
}

const opt = (id: string, label: string, price: number, months: number): PriceOption => ({ id, label, price, months });
const tier = (id: string, name: string, m: number, s: number, a: number, slots: number, blurb: string, perks: string[]): SponsorPackage => ({
  id, kind: 'tier', name, blurb, perks, slots, enabled: true,
  options: [opt('monthly', 'Monthly', m, 1), opt('season', 'Season (3 months)', s, 3), opt('annual', 'Annual', a, 12)],
});
const place = (id: string, name: string, blurb: string, perks: string[], options: PriceOption[], slots = 0): SponsorPackage => ({ id, kind: 'placement', name, blurb, perks, options, slots, enabled: true });

export const DEFAULT_SPONSOR_PACKAGES: SponsorPackage[] = [
  tier('presenting', 'Presenting Sponsor', 1299, 3499, 11999, 1, 'One exclusive brand: “HOOX, presented by …”', [
    '“Presented by” logo on the app splash screen and site header',
    'Logo on every tournament leaderboard and results page',
    'Homepage logo wall (first position) and monthly newsletter feature',
    'Four social media spotlights a month',
  ]),
  tier('gold', 'Gold Sponsor', 599, 1599, 5499, 4, 'Premium visibility across HOOX', [
    'Logo on the homepage sponsor wall and Tournaments page',
    'Logo on leaderboards for tournaments you choose (up to 6 a year)',
    'Newsletter mention every month and two social spotlights a month',
  ]),
  tier('silver', 'Silver Sponsor', 299, 799, 2799, 8, 'Steady brand presence for growing brands', [
    'Logo on the homepage sponsor wall',
    'Newsletter mention every other month',
    'One social spotlight a month',
  ]),
  tier('bronze', 'Bronze Sponsor', 119, 329, 1099, 0, 'Entry-level support for local shops and guides', [
    'Logo and link on the HOOX Sponsors page',
    'One social spotlight a quarter',
  ]),
  place('tournament_title', 'Tournament title sponsor', '“Delta Bass Open, presented by …” on one tournament', [
    'Brand in the tournament name on its page, leaderboard and results', 'Logo on the registration confirmation email',
  ], [opt('per_event', 'Per tournament', 499, 0)]),
  place('series_title', 'Series title sponsor', 'Your brand on every stop of a series', [
    'Brand in the series name and on every stop’s leaderboard', 'Logo on series standings',
  ], [opt('season', 'Per season', 1499, 3), opt('annual', 'Full year', 3999, 12)]),
  place('leaderboard', 'Leaderboard sponsor', 'Logo bar on a live leaderboard', [
    '“Leaderboard sponsored by …” on one tournament’s live leaderboard',
  ], [opt('per_event', 'Per tournament', 249, 0)]),
  place('big_fish', 'Big Fish award sponsor', 'Name the Big Fish (or another) award', [
    'Award named for your brand on the leaderboard and results', 'Shout-out in the winner announcement',
  ], [opt('per_event', 'Per tournament', 199, 0)]),
  place('app_splash', 'App splash screen', 'Full-screen brand moment when the app opens', [
    'Your artwork on the HOOX app splash screen',
  ], [opt('monthly', 'Monthly', 799, 1), opt('season', 'Season (3 months)', 1999, 3)], 1),
  place('newsletter', 'Newsletter feature', 'A dedicated block in the HOOX newsletter', [
    'Image, 60 words and a link in one newsletter send',
  ], [opt('per_send', 'Per send', 299, 0)]),
  place('social', 'Social media spotlight', 'A post about your brand on HOOX social channels', [
    'One sponsored post on Instagram and Facebook',
  ], [opt('per_post', 'Per post', 149, 0)]),
];

export const SPONSOR_CATEGORIES = ['Tackle & lures', 'Rods & reels', 'Boats & motors', 'Electronics', 'Apparel', 'Outdoor & sporting goods', 'Food & beverage', 'Automotive', 'Marinas & guides', 'Local business', 'Other'] as const;

export const ACCOUNT_STATUSES = ['prospect', 'active', 'inactive'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
export const ACCOUNT_STATUS_META: Record<AccountStatus, { label: string; cls: string }> = {
  prospect: { label: 'Prospect', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  active: { label: 'Active', cls: 'bg-green-50 text-green-700 border-green-200' },
  inactive: { label: 'Inactive', cls: 'bg-[#F1F4F8] text-[#5F6F86] border-[#DDE4EC]' },
};

export const PROMO_STATUSES = ['proposal', 'booked', 'cancelled'] as const;
export type PromoStatus = (typeof PROMO_STATUSES)[number];

export interface DbSponsorAccount {
  id: string;
  brand_name: string;
  website: string | null;
  logo_url: string | null;
  category: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: AccountStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSponsorPromotion {
  id: string;
  account_id: string;
  kind: SponsorKind;
  package_id: string;
  package_name: string;
  option_label: string | null;
  term_months: number;
  target: string | null;          // which tournament / series / newsletter, if any
  price: number;
  start_date: string;
  end_date: string;
  status: PromoStatus;
  booked_at: string | null;
  amount_paid: number | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Where a promotion stands today (derived from status + dates) */
export type PromoPhase = 'proposal' | 'upcoming' | 'live' | 'ended' | 'cancelled';
export const PHASE_META: Record<PromoPhase, { label: string; cls: string }> = {
  proposal: { label: 'Proposal', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  upcoming: { label: 'Upcoming', cls: 'bg-[#EEF3FB] text-[#1048A5] border-[#D3E0F5]' },
  live: { label: 'Live', cls: 'bg-green-50 text-green-700 border-green-200' },
  ended: { label: 'Ended', cls: 'bg-[#F1F4F8] text-[#5F6F86] border-[#DDE4EC]' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-700 border-red-200' },
};
export function phaseOf(p: Pick<DbSponsorPromotion, 'status' | 'start_date' | 'end_date'>, today = todayIso()): PromoPhase {
  if (p.status === 'cancelled') return 'cancelled';
  if (p.status === 'proposal') return 'proposal';
  if (p.start_date > today) return 'upcoming';
  if (p.end_date < today) return 'ended';
  return 'live';
}

export const paidOf = (p: Pick<DbSponsorPromotion, 'amount_paid'>) => Number(p.amount_paid ?? 0);
export const owedOf = (p: Pick<DbSponsorPromotion, 'price' | 'amount_paid' | 'status'>) => (p.status === 'booked' ? Math.max(0, Number(p.price) - paidOf(p)) : 0);

/** End date for an option starting on `start`: months > 0 → that many months; one-time → same day */
export const endDateFor = (months: number, start: string) => (months > 0 ? featuredUntil(months, start) : start);

/* ---------------------------- package validation ---------------------------- */

const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const slug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);

export function parseSponsorPackages(input: unknown): { value: SponsorPackage[] | null; error: string | null } {
  if (!Array.isArray(input)) return { value: null, error: 'Invalid packages.' };
  if (input.length > 40) return { value: null, error: 'Up to 40 packages.' };
  const seen = new Set<string>();
  const out: SponsorPackage[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') return { value: null, error: 'Invalid package.' };
    const r = raw as Record<string, unknown>;
    const name = s(r.name, 80);
    if (!name) return { value: null, error: 'Every package needs a name.' };
    const kind = r.kind === 'placement' ? 'placement' : 'tier';
    let id = slug(s(r.id, 40) || name) || `pkg_${out.length + 1}`;
    while (seen.has(id)) id = `${id}_2`;
    seen.add(id);
    const opts = Array.isArray(r.options) ? r.options : [];
    if (opts.length === 0) return { value: null, error: `${name}: add at least one price.` };
    const options: PriceOption[] = [];
    const optIds = new Set<string>();
    for (const o of opts.slice(0, 6)) {
      const oo = (o || {}) as Record<string, unknown>;
      const label = s(oo.label, 40);
      const price = Number(oo.price);
      const months = Number(oo.months);
      if (!label) return { value: null, error: `${name}: every price needs a label.` };
      if (!Number.isFinite(price) || price < 0 || price > 1_000_000) return { value: null, error: `${name}: enter a valid price for “${label}”.` };
      if (![0, 1, 3, 6, 12].includes(months)) return { value: null, error: `${name}: choose a term for “${label}”.` };
      let oid = slug(s(oo.id, 30) || label) || `opt${options.length + 1}`;
      while (optIds.has(oid)) oid = `${oid}_2`;
      optIds.add(oid);
      options.push({ id: oid, label, price: Math.round(price * 100) / 100, months });
    }
    const perks = (Array.isArray(r.perks) ? r.perks : []).map((p) => s(p, 160)).filter(Boolean).slice(0, 12);
    const slots = Math.max(0, Math.min(99, Math.floor(Number(r.slots) || 0)));
    out.push({ id, kind, name, blurb: s(r.blurb, 160), perks, options, slots, enabled: r.enabled !== false });
  }
  return { value: out, error: null };
}

/* -------------------------------- insights -------------------------------- */

export interface SponsorMonth { key: string; label: string; booked: Record<SponsorKind, number>; collected: number }
export interface SponsorInsights {
  booked: number; collected: number; outstanding: number; pipeline: number;
  bookedThisMonth: number; bookedLastMonth: number; bookedYtd: number;
  bookedCount: number; proposalCount: number; cancelledCount: number; winRate: number | null;
  live: DbSponsorPromotion[]; upcoming: DbSponsorPromotion[];
  liveSponsors: number;
  accounts: Record<AccountStatus, number>;
  expiring: DbSponsorPromotion[];
  unpaid: DbSponsorPromotion[];
  months: SponsorMonth[];
  byKind: Record<SponsorKind, { booked: number; count: number }>;
  byPackage: { id: string; name: string; kind: SponsorKind; booked: number; count: number; live: number }[];
  byCategory: { category: string; booked: number; sponsors: number }[];
  topSponsors: { account: DbSponsorAccount; booked: number; paid: number; promotions: number; live: number }[];
}

const bookedAt = (p: DbSponsorPromotion) => p.booked_at || p.created_at;
const round = (n: number) => Math.round(n * 100) / 100;

export function computeSponsorInsights(accounts: DbSponsorAccount[], promos: DbSponsorPromotion[], monthsBack = 12): SponsorInsights {
  const today = todayIso();
  const thisMonth = today.slice(0, 7);
  const lm = new Date(`${today}T12:00:00Z`); lm.setUTCDate(1); lm.setUTCMonth(lm.getUTCMonth() - 1);
  const lastMonth = lm.toISOString().slice(0, 7);
  const year = today.slice(0, 4);
  const sum = (list: DbSponsorPromotion[], f: (p: DbSponsorPromotion) => number) => round(list.reduce((n, p) => n + f(p), 0));
  const price = (p: DbSponsorPromotion) => Number(p.price);

  const booked = promos.filter((p) => p.status === 'booked');
  const proposals = promos.filter((p) => p.status === 'proposal');
  const cancelled = promos.filter((p) => p.status === 'cancelled');
  const live = booked.filter((p) => phaseOf(p, today) === 'live');

  const months: SponsorMonth[] = [];
  const cur = new Date(`${thisMonth}-15T12:00:00Z`);
  cur.setUTCMonth(cur.getUTCMonth() - (monthsBack - 1));
  for (let i = 0; i < monthsBack; i++) {
    const key = cur.toISOString().slice(0, 7);
    months.push({ key, label: cur.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }) + (key.endsWith('-01') ? ` ’${key.slice(2, 4)}` : ''), booked: { tier: 0, placement: 0 }, collected: 0 });
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  const at = (k: string) => months.find((m) => m.key === k);
  booked.forEach((p) => { const m = at(bookedAt(p).slice(0, 7)); if (m) m.booked[p.kind] += price(p); });
  promos.forEach((p) => { if (p.paid_at && p.amount_paid) { const m = at(p.paid_at.slice(0, 7)); if (m) m.collected += Number(p.amount_paid); } });

  const byId = new Map(accounts.map((a) => [a.id, a]));
  const pk = new Map<string, SponsorInsights['byPackage'][number]>();
  booked.forEach((p) => {
    const e = pk.get(p.package_id) ?? { id: p.package_id, name: p.package_name, kind: p.kind, booked: 0, count: 0, live: 0 };
    e.booked += price(p); e.count++; if (phaseOf(p, today) === 'live') e.live++;
    pk.set(p.package_id, e);
  });
  const cat = new Map<string, { category: string; booked: number; ids: Set<string> }>();
  booked.forEach((p) => {
    const c = byId.get(p.account_id)?.category || 'Uncategorized';
    const e = cat.get(c) ?? { category: c, booked: 0, ids: new Set() };
    e.booked += price(p); e.ids.add(p.account_id); cat.set(c, e);
  });
  const top = new Map<string, SponsorInsights['topSponsors'][number]>();
  promos.forEach((p) => {
    const a = byId.get(p.account_id); if (!a) return;
    const e = top.get(a.id) ?? { account: a, booked: 0, paid: 0, promotions: 0, live: 0 };
    if (p.status === 'booked') { e.booked += price(p); e.promotions++; }
    e.paid += paidOf(p);
    if (p.status === 'booked' && phaseOf(p, today) === 'live') e.live++;
    top.set(a.id, e);
  });

  const in30 = new Date(`${today}T12:00:00Z`); in30.setUTCDate(in30.getUTCDate() + 30);
  const soon = in30.toISOString().slice(0, 10);
  const decided = booked.length + cancelled.length;

  return {
    booked: sum(booked, price),
    collected: sum(promos, paidOf),
    outstanding: sum(booked, owedOf),
    pipeline: sum(proposals, price),
    bookedThisMonth: sum(booked.filter((p) => bookedAt(p).startsWith(thisMonth)), price),
    bookedLastMonth: sum(booked.filter((p) => bookedAt(p).startsWith(lastMonth)), price),
    bookedYtd: sum(booked.filter((p) => bookedAt(p).startsWith(year)), price),
    bookedCount: booked.length, proposalCount: proposals.length, cancelledCount: cancelled.length,
    winRate: decided ? Math.round((booked.length / decided) * 100) : null,
    live,
    upcoming: booked.filter((p) => phaseOf(p, today) === 'upcoming').sort((a, b) => a.start_date.localeCompare(b.start_date)),
    liveSponsors: new Set(live.map((p) => p.account_id)).size,
    accounts: { prospect: accounts.filter((a) => a.status === 'prospect').length, active: accounts.filter((a) => a.status === 'active').length, inactive: accounts.filter((a) => a.status === 'inactive').length },
    expiring: live.filter((p) => p.term_months > 0 && p.end_date <= soon).sort((a, b) => a.end_date.localeCompare(b.end_date)),
    unpaid: booked.filter((p) => owedOf(p) > 0).sort((a, b) => bookedAt(a).localeCompare(bookedAt(b))),
    months: months.map((m) => ({ ...m, booked: { tier: round(m.booked.tier), placement: round(m.booked.placement) }, collected: round(m.collected) })),
    byKind: { tier: { booked: sum(booked.filter((p) => p.kind === 'tier'), price), count: booked.filter((p) => p.kind === 'tier').length }, placement: { booked: sum(booked.filter((p) => p.kind === 'placement'), price), count: booked.filter((p) => p.kind === 'placement').length } },
    byPackage: [...pk.values()].map((e) => ({ ...e, booked: round(e.booked) })).sort((a, b) => b.booked - a.booked),
    byCategory: [...cat.values()].map((e) => ({ category: e.category, booked: round(e.booked), sponsors: e.ids.size })).sort((a, b) => b.booked - a.booked),
    topSponsors: [...top.values()].filter((e) => e.booked > 0).map((e) => ({ ...e, booked: round(e.booked), paid: round(e.paid) })).sort((a, b) => b.booked - a.booked).slice(0, 10),
  };
}
