// Featured placements for every listing type (client + server safe).
//
// Each listing type sells two products:
//   badge — "Featured listing": Featured badge + top of the grid, list and map
//   hero  — "Featured page hero": the big banner at the top of that type's page
//
// Pricing for each type & product is edited in Admin → Marketing →
// Featured Marketing → <type> → Pricing, stored in site_settings under
// 'featured_pricing_<type>'. The defaults below are the starting point.

import {
  DEFAULT_FEATURE_PRICING, parseFeaturePricing, perMonth, featuredUntil,
  type FeaturePricing, type FeaturePlanId, type SubmissionStatus,
} from './clubFeature';
export { perMonth, savingsPercent, formatMoney, featuredUntil, enabledPlans, planIn, SUBMISSION_STATUSES } from './clubFeature';
export type { FeaturePricing, FeaturePlan, FeaturePlanId, SubmissionStatus } from './clubFeature';

export const LISTING_TYPES = ['tournament', 'series', 'club', 'event'] as const;
export type ListingType = (typeof LISTING_TYPES)[number];
export const PLACEMENTS = ['badge', 'hero'] as const;
export type Placement = (typeof PLACEMENTS)[number];

export const TYPE_META: Record<ListingType, { label: string; plural: string; slug: string; publicPage: string; color: string }> = {
  tournament: { label: 'Tournament', plural: 'Tournaments', slug: 'tournaments', publicPage: '/tournaments', color: '#0E7C7B' },
  series: { label: 'Series', plural: 'Series', slug: 'series', publicPage: '/series', color: '#1048A5' },
  club: { label: 'Club', plural: 'Clubs', slug: 'clubs', publicPage: '/clubs', color: '#6B3FA0' },
  event: { label: 'Tradeshow / Expo', plural: 'Tradeshows & Expos', slug: 'expos', publicPage: '/events', color: '#C2571A' },
};
export const typeFromSlug = (slug: string) => LISTING_TYPES.find((t) => TYPE_META[t].slug === slug);

export const PLACEMENT_META: Record<Placement, { label: string; short: string; blurb: string }> = {
  badge: { label: 'Featured listing', short: 'Listing', blurb: 'Featured badge and top placement in the grid, list and map views.' },
  hero: { label: 'Featured page hero', short: 'Hero', blurb: 'The large banner at the top of the page.' },
};

/** Pricing for one listing type: one plan set per product */
export type TypePricing = Record<Placement, FeaturePricing>;

const plans = (m: number, s: number, a: number, extras: [string[], string[], string[]]) => [
  { id: 'monthly' as const, name: 'Monthly', price: m, term: 'month', months: 1, badge: '', extras: extras[0], enabled: true, highlight: false },
  { id: 'season' as const, name: 'Season', price: s, term: '3 months', months: 3, badge: `Save ${Math.round((1 - s / 3 / m) * 100)}%`, extras: extras[1], enabled: true, highlight: false },
  { id: 'annual' as const, name: 'Annual', price: a, term: 'year', months: 12, badge: `Best value · Save ${Math.round((1 - a / 12 / m) * 100)}%`, extras: extras[2], enabled: true, highlight: true },
];

export const DEFAULT_TYPE_PRICING: Record<ListingType, TypePricing> = {
  tournament: {
    badge: {
      perks: ['Featured badge on your tournament card', 'Top of the Tournaments grid, list and map', 'Top of Search results'],
      plans: plans(39, 99, 349, [['Cancel anytime'], ['Covers a full registration window'], ['Locked-in rate when you renew']]),
    },
    hero: {
      perks: ['Your tournament in the hero banner at the top of the Tournaments page', 'Also featured above the Search page and Tournament Calendar', 'Large photo, details and a Register button'],
      plans: plans(149, 399, 1299, [['Cancel anytime'], ['Great for the weeks before registration closes'], ['Locked-in rate when you renew']]),
    },
  },
  series: {
    badge: {
      perks: ['Featured badge on your series card', 'Top of the Series grid, list and map', 'Top of Search results'],
      plans: plans(49, 129, 449, [['Cancel anytime'], ['Covers a run of series stops'], ['Your whole season, every stop']]),
    },
    hero: {
      perks: ['Your series in the hero banner at the top of the Series page', 'Large photo, stops, dates and sponsor credit'],
      plans: plans(179, 479, 1599, [['Cancel anytime'], ['Great for a season kickoff'], ['Locked-in rate when you renew']]),
    },
  },
  club: {
    badge: {
      perks: DEFAULT_FEATURE_PRICING.perks.filter((p) => !/hero/i.test(p)),
      plans: DEFAULT_FEATURE_PRICING.plans.map((p) => ({ ...p })),
    },
    hero: {
      perks: ['Your club in the hero banner at the top of the Clubs page (rotates daily among featured clubs)', 'Large cover photo, logo and your story'],
      plans: plans(79, 199, 699, [['Cancel anytime'], ['Great for a membership drive'], ['Locked-in rate when you renew']]),
    },
  },
  event: {
    badge: {
      perks: ['Featured badge on your show card', 'Top of the Tradeshows & Expos grid', 'Highlighted on the Event Calendar'],
      plans: plans(99, 249, 799, [['Cancel anytime'], ['Covers your pre-show promotion'], ['Promote every show you run this year']]),
    },
    hero: {
      perks: ['Your show in the rotating hero at the top of Tradeshows & Expos', 'Also the hero on the Event Calendar', 'Large photo, dates, venue and admission'],
      plans: plans(299, 799, 2499, [['Cancel anytime'], ['The run-up to show day'], ['Locked-in rate when you renew']]),
    },
  },
};

/** Validate a whole type's pricing (both products). Accepts the older single-product shape as the badge product. */
export function parseTypePricing(input: unknown, type: ListingType): { value: TypePricing | null; error: string | null } {
  const def = DEFAULT_TYPE_PRICING[type];
  if (!input || typeof input !== 'object') return { value: null, error: 'Invalid pricing.' };
  const raw = input as Record<string, unknown>;
  // Legacy: { perks, plans } (the original Feature your Club pricing)
  if ('plans' in raw && !('badge' in raw)) {
    const { value, error } = parseFeaturePricing(raw);
    return value ? { value: { badge: value, hero: def.hero }, error: null } : { value: null, error };
  }
  const out: Partial<TypePricing> = {};
  for (const p of PLACEMENTS) {
    if (!raw[p]) { out[p] = def[p]; continue; }
    const { value, error } = parseFeaturePricing(raw[p]);
    if (!value) return { value: null, error: `${PLACEMENT_META[p].label}: ${error}` };
    out[p] = value;
  }
  return { value: out as TypePricing, error: null };
}

/* ------------------------------------------------------------------ */
/* Requests / placements (rows in public.club_feature_requests)        */
/* ------------------------------------------------------------------ */

export interface DbFeaturedRequest {
  id: string;
  status: SubmissionStatus;
  listing_type: ListingType;
  listing_id: string | null;
  placement: Placement;
  source: 'web' | 'admin';
  requested_by: string;
  requester_name: string;
  requester_email: string;
  requester_role: string;
  contact_phone: string | null;
  club_submission_id: string | null;
  club_name: string;            // listing name (column kept from the clubs-only version)
  plan: FeaturePlanId;
  plan_name: string | null;
  price_quoted: number | null;
  term_months: number | null;
  start_date: string | null;
  featured_from: string | null;
  featured_until: string | null;
  amount_paid: number | null;
  paid_at: string | null;
  promo_code: string | null;
  notes: string | null;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Today's date (YYYY-MM-DD) in US Pacific time, so evening approvals don't start "tomorrow" */
export const todayIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

/** Live on the site right now? */
export const isActivePlacement = (r: Pick<DbFeaturedRequest, 'status' | 'featured_from' | 'featured_until'>, today = todayIso()) =>
  r.status === 'approved' && !!r.featured_until && (r.featured_from ?? '0000') <= today && r.featured_until >= today;

/** Dates a placement runs when approved today */
export function placementWindow(months: number, startDate: string | null) {
  const from = startDate && startDate > todayIso() ? startDate : todayIso();
  return { from, until: featuredUntil(months, from) };
}

export const priceOf = (r: Pick<DbFeaturedRequest, 'price_quoted'>) => Number(r.price_quoted ?? 0);
