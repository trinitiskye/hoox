// SERVER-ONLY helpers for Sponsor Programs: packages (site_settings) and
// request-body validation for accounts and promotions.

import { getSettingAdmin, upsertSettingAdmin } from './supabaseAdmin';
import {
  DEFAULT_SPONSOR_PACKAGES, parseSponsorPackages, endDateFor, ACCOUNT_STATUSES, PROMO_STATUSES,
  type SponsorPackage, type DbSponsorAccount, type DbSponsorPromotion, type AccountStatus, type PromoStatus,
} from './sponsors';

export const PACKAGES_KEY = 'sponsor_packages';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function loadSponsorPackages(): Promise<{ packages: SponsorPackage[]; saved: boolean; updatedAt: string | null }> {
  const { data, error } = await getSettingAdmin(PACKAGES_KEY).catch(() => ({ data: null, error: 'unavailable' }));
  const row = !error ? data?.[0] : null;
  if (row) {
    const { value } = parseSponsorPackages(row.value);
    if (value) return { packages: value, saved: true, updatedAt: row.updated_at };
  }
  return { packages: DEFAULT_SPONSOR_PACKAGES, saved: false, updatedAt: null };
}

export const saveSponsorPackages = (packages: SponsorPackage[], userId: string) => upsertSettingAdmin(PACKAGES_KEY, packages, userId);

/** Friendly message for a Supabase error (missing tables → run the migration) */
export function sponsorDbError(error: string) {
  return /sponsor_(accounts|promotions)|relation|does not exist|schema cache/i.test(error)
    ? 'Run supabase/migration_2026_11_sponsor_programs.sql in Supabase to turn on Sponsor Programs.'
    : /violates foreign key/i.test(error)
      ? 'This brand still has promotions. Delete or move those first, or mark the brand Inactive.'
      : 'Something went wrong saving to the database.';
}

type Body = Record<string, unknown>;
const str = (b: Body, k: string, max: number) => (typeof b[k] === 'string' ? (b[k] as string).trim().slice(0, max) : '');
const has = (b: Body, k: string) => k in b;

/** Validate account fields. `partial` = PATCH (only fields present are checked). */
export function accountFromBody(b: Body, partial: boolean): { value: Partial<DbSponsorAccount> | null; error: string | null } {
  const v: Partial<DbSponsorAccount> = {};
  if (!partial || has(b, 'brandName')) {
    const n = str(b, 'brandName', 120);
    if (!n) return { value: null, error: 'Enter the brand name.' };
    v.brand_name = n;
  }
  if (has(b, 'website')) {
    let w = str(b, 'website', 300);
    if (w && !/^https?:\/\//i.test(w)) w = `https://${w}`;
    if (w) { try { new URL(w); } catch { return { value: null, error: 'Enter a valid website.' }; } }
    v.website = w || null;
  }
  if (has(b, 'logoUrl')) {
    const l = str(b, 'logoUrl', 600);
    if (l && !/^https:\/\//i.test(l)) return { value: null, error: 'Logo URL must start with https://' };
    v.logo_url = l || null;
  }
  if (has(b, 'category')) v.category = str(b, 'category', 60) || null;
  if (has(b, 'contactName')) v.contact_name = str(b, 'contactName', 120) || null;
  if (has(b, 'contactEmail')) {
    const e = str(b, 'contactEmail', 254).toLowerCase();
    if (e && !EMAIL_RE.test(e)) return { value: null, error: 'Enter a valid contact email.' };
    v.contact_email = e || null;
  }
  if (has(b, 'contactPhone')) v.contact_phone = str(b, 'contactPhone', 40) || null;
  if (!partial || has(b, 'status')) {
    const st = (str(b, 'status', 20) || 'prospect') as AccountStatus;
    if (!ACCOUNT_STATUSES.includes(st)) return { value: null, error: 'Unknown status.' };
    v.status = st;
  }
  if (has(b, 'notes')) {
    const n = str(b, 'notes', 4001);
    if (n.length > 4000) return { value: null, error: 'Notes must be 4,000 characters or fewer.' };
    v.notes = n || null;
  }
  return { value: v, error: null };
}

/**
 * Validate a promotion. For a new one: accountId, packageId, optionId, startDate
 * (price defaults to the package price). For a PATCH: any of status, price, startDate,
 * endDate, target, notes, payment.
 */
export function promotionFromBody(b: Body, packages: SponsorPackage[], prev?: DbSponsorPromotion): { value: Partial<DbSponsorPromotion> | null; error: string | null } {
  const fail = (error: string) => ({ value: null, error });
  const v: Partial<DbSponsorPromotion> = {};

  if (!prev) {
    const accountId = str(b, 'accountId', 60);
    if (!accountId) return fail('Choose the sponsor.');
    const pkg = packages.find((p) => p.id === str(b, 'packageId', 60));
    if (!pkg) return fail('Choose a package.');
    const option = pkg.options.find((o) => o.id === str(b, 'optionId', 40)) ?? (pkg.options.length === 1 ? pkg.options[0] : undefined);
    if (!option) return fail('Choose a price option.');
    const start = str(b, 'startDate', 10);
    if (!DATE_RE.test(start)) return fail('Choose a start date.');
    Object.assign(v, {
      account_id: accountId, kind: pkg.kind, package_id: pkg.id, package_name: pkg.name,
      option_label: option.label, term_months: option.months, price: option.price,
      start_date: start, end_date: endDateFor(option.months, start), status: 'proposal' as PromoStatus,
    });
  }

  if (has(b, 'price') && b.price !== '' && b.price !== null) {
    const p = Number(b.price);
    if (!Number.isFinite(p) || p < 0 || p > 1_000_000) return fail('Enter a valid price.');
    v.price = Math.round(p * 100) / 100;
  }
  if (prev && has(b, 'startDate')) {
    const d = str(b, 'startDate', 10);
    if (!DATE_RE.test(d)) return fail('Choose a valid start date.');
    v.start_date = d;
  }
  if (has(b, 'endDate') && b.endDate) {
    const d = str(b, 'endDate', 10);
    if (!DATE_RE.test(d)) return fail('Choose a valid end date.');
    v.end_date = d;
  }
  const start = v.start_date ?? prev?.start_date;
  const end = v.end_date ?? prev?.end_date;
  if (start && end && end < start) return fail('End date can’t be before the start date.');

  if (has(b, 'target')) v.target = str(b, 'target', 160) || null;
  if (has(b, 'notes')) {
    const n = str(b, 'notes', 4001);
    if (n.length > 4000) return fail('Notes must be 4,000 characters or fewer.');
    v.notes = n || null;
  }
  if (has(b, 'status')) {
    const st = str(b, 'status', 20) as PromoStatus;
    if (!PROMO_STATUSES.includes(st)) return fail('Unknown status.');
    v.status = st;
    if (st === 'booked' && prev?.status !== 'booked') v.booked_at = new Date().toISOString();
    if (st !== 'booked') v.booked_at = null;
  }
  if (has(b, 'payment')) {
    if (b.payment === null) { v.amount_paid = null; v.paid_at = null; }
    else {
      const p = (b.payment || {}) as { amount?: unknown; paidAt?: unknown };
      const amount = Number(p.amount);
      if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) return fail('Enter a valid amount paid.');
      const paidAt = typeof p.paidAt === 'string' && DATE_RE.test(p.paidAt) ? `${p.paidAt}T12:00:00Z` : new Date().toISOString();
      v.amount_paid = Math.round(amount * 100) / 100;
      v.paid_at = amount > 0 ? paidAt : null;
    }
  }
  return { value: v, error: null };
}
