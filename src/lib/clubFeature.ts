// Shared definitions for "Feature your Club" (/clubs/feature): plan
// pricing, the request row shape, and helpers.
//
// Pricing is edited in Admin → Clubs → Feature your Club pricing and stored
// in public.site_settings (key "club_feature_pricing"). DEFAULT_FEATURE_PRICING
// below is only the starting point / fallback until something is saved.

import type { SubmissionStatus } from './eventSubmission';
export type { SubmissionStatus } from './eventSubmission';
export { SUBMISSION_STATUSES } from './eventSubmission';

/** Plan slots are fixed (the DB checks these ids); names, prices and lengths are editable. */
export const FEATURE_PLAN_IDS = ['monthly', 'season', 'annual'] as const;
export type FeaturePlanId = (typeof FEATURE_PLAN_IDS)[number];

export interface FeaturePlan {
  id: FeaturePlanId;
  name: string;
  price: number;          // USD, billed once per term
  term: string;           // label after the price: "month", "3 months", "year"
  months: number;         // how long featuring lasts
  badge: string;          // small tag above the card ("" for none)
  extras: string[];       // perks on top of the shared perks
  enabled: boolean;       // shown on the page and requestable
  highlight: boolean;     // the emphasized "best value" card (max one)
}

export interface FeaturePricing {
  perks: string[];        // included with every plan
  plans: FeaturePlan[];
}

export const DEFAULT_FEATURE_PRICING: FeaturePricing = {
  perks: [
    'Featured badge on your club card',
    'Top of the Clubs directory and search results',
    'Hero banner on the Clubs page (rotates daily)',
    'Spot in the home page Featured Clubs row',
  ],
  plans: [
    { id: 'monthly', name: 'Monthly', price: 29, term: 'month', months: 1, badge: '', extras: ['Cancel anytime'], enabled: true, highlight: false },
    { id: 'season', name: 'Season', price: 75, term: '3 months', months: 3, badge: 'Save 14%', extras: ['Great for a tournament season or membership drive'], enabled: true, highlight: false },
    { id: 'annual', name: 'Annual', price: 249, term: 'year', months: 12, badge: 'Best value · Save 28%', extras: ['Locked-in rate when you renew'], enabled: true, highlight: true },
  ],
};

export const perMonth = (p: Pick<FeaturePlan, 'price' | 'months'>) => Math.round((p.price / p.months) * 100) / 100;

/** Percent saved per month vs. the shortest enabled plan (0 if none). */
export function savingsPercent(plan: FeaturePlan, pricing: FeaturePricing) {
  const base = pricing.plans.filter((p) => p.enabled).sort((a, b) => a.months - b.months)[0];
  if (!base || base.id === plan.id || plan.months <= base.months) return 0;
  const pct = Math.round((1 - perMonth(plan) / perMonth(base)) * 100);
  return pct > 0 ? pct : 0;
}

export const planIn = (pricing: FeaturePricing, id: string) => pricing.plans.find((p) => p.id === id);
export const enabledPlans = (pricing: FeaturePricing) => pricing.plans.filter((p) => p.enabled);
export const formatMoney = (n: number) =>
  `$${n.toLocaleString('en-US', Number.isInteger(n) ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Last featured day for a term of `months` that starts on `start` (YYYY-MM-DD, defaults to today). */
export function featuredUntil(months: number, start?: string | null): string {
  const d = start ? new Date(`${start}T00:00:00Z`) : new Date();
  d.setUTCMonth(d.getUTCMonth() + months);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Validate pricing from the admin editor (or the DB). Returns cleaned
 * pricing, or an error message. Missing plan slots are filled from defaults.
 */
export function parseFeaturePricing(input: unknown): { value: FeaturePricing | null; error: string | null } {
  const fail = (error: string) => ({ value: null, error });
  if (!input || typeof input !== 'object') return fail('Invalid pricing.');
  const raw = input as { perks?: unknown; plans?: unknown };

  const lines = (v: unknown, label: string, maxItems: number, maxLen: number) => {
    if (!Array.isArray(v)) throw new Error(`${label} must be a list.`);
    const out = v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
    if (out.length > maxItems) throw new Error(`${label}: up to ${maxItems} lines.`);
    if (out.some((x) => x.length > maxLen)) throw new Error(`${label}: keep each line under ${maxLen} characters.`);
    return out;
  };

  try {
    const perks = lines(raw.perks, 'Included perks', 10, 90);
    if (perks.length === 0) return fail('Add at least one included perk.');

    const given = Array.isArray(raw.plans) ? (raw.plans as Record<string, unknown>[]) : [];
    const plans: FeaturePlan[] = FEATURE_PLAN_IDS.map((id) => {
      const d = DEFAULT_FEATURE_PRICING.plans.find((p) => p.id === id)!;
      const g = given.find((p) => p && p.id === id);
      if (!g) return { ...d };
      const name = typeof g.name === 'string' ? g.name.trim() : '';
      const term = typeof g.term === 'string' ? g.term.trim() : '';
      const badge = typeof g.badge === 'string' ? g.badge.trim() : '';
      const price = Number(g.price);
      const months = Number(g.months);
      if (!name || name.length > 40) throw new Error(`Plan name is required (40 characters max).`);
      if (!Number.isFinite(price) || price < 0 || price > 100000) throw new Error(`${name}: enter a price between $0 and $100,000.`);
      if (Math.round(price * 100) !== price * 100) throw new Error(`${name}: price can have at most 2 decimal places.`);
      if (!Number.isInteger(months) || months < 1 || months > 36) throw new Error(`${name}: length must be 1 to 36 months.`);
      if (!term || term.length > 30) throw new Error(`${name}: price label is required (30 characters max).`);
      if (badge.length > 40) throw new Error(`${name}: badge must be 40 characters or fewer.`);
      return {
        id, name, price, term, months, badge,
        extras: lines(g.extras ?? [], `${name} extras`, 5, 90),
        enabled: g.enabled !== false,
        highlight: g.highlight === true,
      };
    });
    if (!plans.some((p) => p.enabled)) return fail('Keep at least one plan turned on.');
    if (plans.filter((p) => p.highlight).length > 1) return fail('Only one plan can be highlighted.');
    plans.forEach((p) => { if (!p.enabled) p.highlight = false; });
    return { value: { perks, plans }, error: null };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Invalid pricing.');
  }
}

/** Featured now? (flag on, and not past its end date) */
export function isFeaturedNow(featured?: boolean | null, until?: string | null) {
  if (!featured) return false;
  if (!until) return true;
  return until >= new Date().toISOString().slice(0, 10);
}

export interface DbClubFeatureRequest {
  id: string;
  status: SubmissionStatus;
  requested_by: string;
  requester_name: string;
  requester_email: string;
  requester_role: string;
  contact_phone: string | null;
  club_submission_id: string | null;
  club_name: string;
  plan: FeaturePlanId;
  /** Price and length at the time of the request (migration_2026_11_feature_pricing.sql) */
  price_quoted?: number | null;
  term_months?: number | null;
  plan_name?: string | null;
  start_date: string | null;
  promo_code: string | null;
  notes: string | null;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type DbClubFeatureRequestInsert = Omit<
  DbClubFeatureRequest,
  'id' | 'status' | 'admin_notes' | 'reviewed_at' | 'created_at' | 'updated_at'
>;

/** A signed-in user's own club, for the "Which club?" picker */
export interface MyClub {
  id: string;
  name: string;
  city: string;
  state: string;
  status: SubmissionStatus;
  featured: boolean;
  featuredUntil: string | null;
}
