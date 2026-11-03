// Shared definitions for "Feature your Club" (/clubs/feature): plans and
// pricing shown on the marketing page, the request row shape, and helpers.
// To change prices or perks, edit FEATURE_PLANS. The page reads from here.

import type { SubmissionStatus } from './eventSubmission';
export type { SubmissionStatus } from './eventSubmission';
export { SUBMISSION_STATUSES } from './eventSubmission';

export type FeaturePlanId = 'monthly' | 'season' | 'annual';

export interface FeaturePlan {
  id: FeaturePlanId;
  name: string;
  price: number;          // USD, billed once per term
  term: string;           // "month", "3 months", "year"
  months: number;
  perMonth: number;       // shown as "about $X / month"
  badge?: string;
  extras: string[];       // perks on top of FEATURE_PERKS
}

/** Included with every plan */
export const FEATURE_PERKS = [
  'Featured badge on your club card',
  'Top of the Clubs directory and search results',
  'Hero banner on the Clubs page (rotates daily)',
  'Spot in the home page Featured Clubs row',
];

export const FEATURE_PLANS: FeaturePlan[] = [
  { id: 'monthly', name: 'Monthly', price: 29, term: 'month', months: 1, perMonth: 29, extras: ['Cancel anytime'] },
  { id: 'season', name: 'Season', price: 75, term: '3 months', months: 3, perMonth: 25, badge: 'Save 14%', extras: ['Great for a tournament season or membership drive'] },
  { id: 'annual', name: 'Annual', price: 249, term: 'year', months: 12, perMonth: 20.75, badge: 'Best value · Save 28%', extras: ['Locked-in rate when you renew'] },
];

export const planById = (id: string) => FEATURE_PLANS.find((p) => p.id === id);

/** Last featured day for a plan that starts on `start` (YYYY-MM-DD, defaults to today). */
export function featuredUntil(planId: FeaturePlanId, start?: string | null): string {
  const plan = planById(planId)!;
  const d = start ? new Date(`${start}T00:00:00Z`) : new Date();
  d.setUTCMonth(d.getUTCMonth() + plan.months);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
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
