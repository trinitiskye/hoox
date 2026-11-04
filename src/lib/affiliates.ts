// Affiliate program (client + server safe).
//
// An affiliate refers tournament directors to HOOX with their link
// (hoox.app/register/director?ref=CODE). For each director they refer, the
// affiliate earns a percentage of HOOX's cut of every angler registration on
// that director's tournaments, for a set window (12 months by default) from
// the day the director signed up.
//
// Tables: public.affiliates, public.affiliate_referrals, public.affiliate_payouts.
// Program settings: site_settings 'affiliate_program'. Commissions are
// calculated from public.registrations (never stored), so they always match
// the registrations.

import { formatMoney, featuredUntil } from './clubFeature';
import { todayIso } from './featured';
export { formatMoney, todayIso };

export const REF_COOKIE = 'hoox_ref';
export const REF_PARAM = 'ref';

/* ------------------------------- settings ------------------------------- */

export interface AffiliateSettings {
  /** % of HOOX's cut paid to the affiliate, for new affiliates */
  defaultRate: number;
  /** Months a referred director earns commission, for new referrals */
  windowMonths: number;
  /** HOOX's cut per registration when a registration doesn't record one */
  fallbackFee: number;
  /** Smallest balance worth paying out */
  minPayout: number;
  /** How long a referral link is remembered in the visitor's browser */
  cookieDays: number;
  /** Accept applications on the public page */
  acceptingApplications: boolean;
}
export const DEFAULT_AFFILIATE_SETTINGS: AffiliateSettings = {
  defaultRate: 20, windowMonths: 12, fallbackFee: 6.5, minPayout: 25, cookieDays: 60, acceptingApplications: true,
};

export function parseAffiliateSettings(input: unknown): { value: AffiliateSettings | null; error: string | null } {
  if (!input || typeof input !== 'object') return { value: null, error: 'Invalid settings.' };
  const r = input as Record<string, unknown>;
  const num = (k: keyof AffiliateSettings, min: number, max: number, label: string) => {
    const v = r[k] === undefined ? DEFAULT_AFFILIATE_SETTINGS[k] : Number(r[k]);
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new Error(`${label} must be between ${min} and ${max}.`);
    return Math.round(v * 100) / 100;
  };
  try {
    return {
      value: {
        defaultRate: num('defaultRate', 0, 100, 'Commission rate'),
        windowMonths: Math.round(num('windowMonths', 1, 120, 'Earning window')),
        fallbackFee: num('fallbackFee', 0, 1000, 'HOOX fee per registration'),
        minPayout: num('minPayout', 0, 10000, 'Minimum payout'),
        cookieDays: Math.round(num('cookieDays', 1, 365, 'Link memory')),
        acceptingApplications: r.acceptingApplications !== false,
      },
      error: null,
    };
  } catch (e) { return { value: null, error: (e as Error).message }; }
}

/* --------------------------------- rows --------------------------------- */

export const AFFILIATE_STATUSES = ['pending', 'active', 'paused', 'declined'] as const;
export type AffiliateStatus = (typeof AFFILIATE_STATUSES)[number];
export const AFFILIATE_STATUS_META: Record<AffiliateStatus, { label: string; cls: string }> = {
  pending: { label: 'Applied', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  active: { label: 'Active', cls: 'bg-green-50 text-green-700 border-green-200' },
  paused: { label: 'Paused', cls: 'bg-[#F1F4F8] text-[#5F6F86] border-[#DDE4EC]' },
  declined: { label: 'Declined', cls: 'bg-red-50 text-red-700 border-red-200' },
};
export const PAYOUT_METHODS = ['paypal', 'venmo', 'zelle', 'check', 'bank'] as const;
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];
export const PAYOUT_METHOD_LABEL: Record<PayoutMethod, string> = { paypal: 'PayPal', venmo: 'Venmo', zelle: 'Zelle', check: 'Check', bank: 'Bank transfer' };

export interface DbAffiliate {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  website: string | null;
  audience: string | null;          // how they'll promote HOOX
  rate_percent: number;
  window_months: number;
  status: AffiliateStatus;
  source: 'web' | 'admin';
  payout_method: PayoutMethod | null;
  payout_details: string | null;    // PayPal email, Venmo handle, mailing address …
  notes: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAffiliateReferral {
  id: string;
  affiliate_id: string;
  director_id: string;
  director_name: string;
  director_email: string | null;
  referred_at: string;              // YYYY-MM-DD the director signed up / was credited
  rate_percent: number;             // locked in when the referral was made
  window_months: number;
  source: 'link' | 'admin';
  status: 'active' | 'removed';
  created_at: string;
}

export interface DbAffiliatePayout {
  id: string;
  affiliate_id: string;
  amount: number;
  method: PayoutMethod | null;
  reference: string | null;         // transaction id / check number
  paid_at: string;                  // YYYY-MM-DD
  notes: string | null;
  created_at: string;
}

/** Just what commission math needs from tournaments & registrations */
export interface AffTournament { id: string; name: string; created_by: string; start_date: string }
export interface AffRegistration { id: string; tournament_id: string; fee: number | null; app_owner_cut: number | null; registered_at: string }
export interface AffDirector { id: string; name: string; email: string; organization: string | null; created_at: string }

export interface AffiliateData {
  affiliates: DbAffiliate[];
  referrals: DbAffiliateReferral[];
  payouts: DbAffiliatePayout[];
  tournaments: AffTournament[];
  registrations: AffRegistration[];
  directors: AffDirector[];
  settings: AffiliateSettings;
  settingsSaved: boolean;
}

/* ------------------------------- helpers -------------------------------- */

/** Last day a referral earns (inclusive) */
export const referralEnds = (r: Pick<DbAffiliateReferral, 'referred_at' | 'window_months'>) => featuredUntil(r.window_months, r.referred_at);
export const referralIsEarning = (r: DbAffiliateReferral, today = todayIso()) => r.status === 'active' && r.referred_at <= today && referralEnds(r) >= today;

export const referralLink = (code: string, origin = 'https://hoox.app') => `${origin}/register/director?${REF_PARAM}=${encodeURIComponent(code)}`;

/** Readable, unambiguous code from a name: e.g. "Delta Bass Club" → DELTABASS + 3 random chars */
export function makeAffiliateCode(name: string) {
  const base = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9) || 'HOOX';
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const rnd = Array.from(crypto.getRandomValues(new Uint8Array(3)), (b) => alphabet[b % alphabet.length]).join('');
  return `${base}${rnd}`;
}
export const CODE_RE = /^[A-Z0-9]{3,20}$/;

/* ------------------------------ commissions ----------------------------- */

export interface CommissionLine {
  registration: AffRegistration;
  referral: DbAffiliateReferral;
  tournament: AffTournament;
  hooxCut: number;
  commission: number;
}

/** Every registration that earns an affiliate commission */
export function commissionLines(d: Pick<AffiliateData, 'referrals' | 'tournaments' | 'registrations' | 'settings'>): CommissionLine[] {
  const byDirector = new Map(d.referrals.filter((r) => r.status === 'active').map((r) => [r.director_id, r]));
  const tById = new Map(d.tournaments.map((t) => [t.id, t]));
  const out: CommissionLine[] = [];
  for (const reg of d.registrations) {
    const t = tById.get(reg.tournament_id);
    if (!t) continue;
    const ref = byDirector.get(t.created_by);
    if (!ref) continue;
    const day = reg.registered_at.slice(0, 10);
    if (day < ref.referred_at || day > referralEnds(ref)) continue;
    const hooxCut = reg.app_owner_cut != null ? Number(reg.app_owner_cut) : d.settings.fallbackFee;
    out.push({ registration: reg, referral: ref, tournament: t, hooxCut, commission: Math.round(hooxCut * ref.rate_percent) / 100 });
  }
  return out.sort((a, b) => b.registration.registered_at.localeCompare(a.registration.registered_at));
}

export interface AffiliateTotals {
  affiliate: DbAffiliate;
  referrals: number; earningReferrals: number;
  tournaments: number; registrations: number;
  entryFees: number; hooxRevenue: number;
  earned: number; paid: number; owed: number;
  lastPaid: string | null;
}
export interface AffMonth { key: string; label: string; revenue: number; commission: number; paid: number }
export interface AffiliateInsights {
  totals: AffiliateTotals[];
  lines: CommissionLine[];
  months: AffMonth[];
  counts: Record<AffiliateStatus, number>;
  referrals: number; earningReferrals: number; registrations: number;
  entryFees: number; hooxRevenue: number; earned: number; paid: number; owed: number;
  earnedThisMonth: number; earnedLastMonth: number; earnedYtd: number;
  readyToPay: AffiliateTotals[];
  endingSoon: DbAffiliateReferral[];
  netRevenue: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function computeAffiliateInsights(d: AffiliateData, monthsBack = 12): AffiliateInsights {
  const today = todayIso();
  const thisMonth = today.slice(0, 7);
  const lm = new Date(`${today}T12:00:00Z`); lm.setUTCDate(1); lm.setUTCMonth(lm.getUTCMonth() - 1);
  const lastMonth = lm.toISOString().slice(0, 7);
  const lines = commissionLines(d);

  const totals: AffiliateTotals[] = d.affiliates.map((a) => {
    const refs = d.referrals.filter((r) => r.affiliate_id === a.id && r.status === 'active');
    const my = lines.filter((l) => l.referral.affiliate_id === a.id);
    const pays = d.payouts.filter((p) => p.affiliate_id === a.id);
    const earned = r2(my.reduce((n, l) => n + l.commission, 0));
    const paid = r2(pays.reduce((n, p) => n + Number(p.amount), 0));
    return {
      affiliate: a,
      referrals: refs.length,
      earningReferrals: refs.filter((r) => referralIsEarning(r, today)).length,
      tournaments: new Set(my.map((l) => l.tournament.id)).size,
      registrations: my.length,
      entryFees: r2(my.reduce((n, l) => n + Number(l.registration.fee ?? 0), 0)),
      hooxRevenue: r2(my.reduce((n, l) => n + l.hooxCut, 0)),
      earned, paid, owed: r2(Math.max(0, earned - paid)),
      lastPaid: pays.map((p) => p.paid_at).sort().pop() || null,
    };
  }).sort((a, b) => b.earned - a.earned || a.affiliate.name.localeCompare(b.affiliate.name));

  const months: AffMonth[] = [];
  const cur = new Date(`${thisMonth}-15T12:00:00Z`);
  cur.setUTCMonth(cur.getUTCMonth() - (monthsBack - 1));
  for (let i = 0; i < monthsBack; i++) {
    const key = cur.toISOString().slice(0, 7);
    months.push({ key, label: cur.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }) + (key.endsWith('-01') ? ` ’${key.slice(2, 4)}` : ''), revenue: 0, commission: 0, paid: 0 });
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  const at = (k: string) => months.find((m) => m.key === k);
  lines.forEach((l) => { const m = at(l.registration.registered_at.slice(0, 7)); if (m) { m.revenue += l.hooxCut; m.commission += l.commission; } });
  d.payouts.forEach((p) => { const m = at(p.paid_at.slice(0, 7)); if (m) m.paid += Number(p.amount); });

  const sumL = (f: (l: CommissionLine) => number, list = lines) => r2(list.reduce((n, l) => n + f(l), 0));
  const in30 = new Date(`${today}T12:00:00Z`); in30.setUTCDate(in30.getUTCDate() + 30);
  const soon = in30.toISOString().slice(0, 10);
  const earned = sumL((l) => l.commission);
  const hooxRevenue = sumL((l) => l.hooxCut);
  const paid = r2(d.payouts.reduce((n, p) => n + Number(p.amount), 0));

  return {
    totals, lines,
    months: months.map((m) => ({ ...m, revenue: r2(m.revenue), commission: r2(m.commission), paid: r2(m.paid) })),
    counts: Object.fromEntries(AFFILIATE_STATUSES.map((s) => [s, d.affiliates.filter((a) => a.status === s).length])) as Record<AffiliateStatus, number>,
    referrals: d.referrals.filter((r) => r.status === 'active').length,
    earningReferrals: d.referrals.filter((r) => referralIsEarning(r, today)).length,
    registrations: lines.length,
    entryFees: sumL((l) => Number(l.registration.fee ?? 0)),
    hooxRevenue, earned, paid,
    owed: r2(totals.reduce((n, t) => n + t.owed, 0)),
    earnedThisMonth: sumL((l) => l.commission, lines.filter((l) => l.registration.registered_at.startsWith(thisMonth))),
    earnedLastMonth: sumL((l) => l.commission, lines.filter((l) => l.registration.registered_at.startsWith(lastMonth))),
    earnedYtd: sumL((l) => l.commission, lines.filter((l) => l.registration.registered_at.startsWith(today.slice(0, 4)))),
    readyToPay: totals.filter((t) => t.owed > 0 && t.owed >= d.settings.minPayout).sort((a, b) => b.owed - a.owed),
    endingSoon: d.referrals.filter((r) => referralIsEarning(r, today) && referralEnds(r) <= soon).sort((a, b) => referralEnds(a).localeCompare(referralEnds(b))),
    netRevenue: r2(hooxRevenue - earned),
  };
}
