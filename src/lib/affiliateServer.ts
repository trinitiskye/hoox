// SERVER-ONLY helpers for the affiliate program: settings, data loading,
// request validation, and crediting a new director to the affiliate whose
// referral link they used.

import {
  getSettingAdmin, upsertSettingAdmin, listAffiliatesAdmin, listAffiliateReferralsAdmin, listAffiliatePayoutsAdmin,
  listDirectorsAdmin, listTournamentsByDirectorsAdmin, listRegistrationsForTournamentsAdmin,
  getAffiliateByCodeAdmin, getActiveReferralForDirectorAdmin, createAffiliateReferralAdmin, getUserByIdAdmin,
} from './supabaseAdmin';
import {
  DEFAULT_AFFILIATE_SETTINGS, parseAffiliateSettings, AFFILIATE_STATUSES, PAYOUT_METHODS, REF_COOKIE, CODE_RE, todayIso,
  type AffiliateSettings, type AffiliateData, type DbAffiliate, type AffiliateStatus, type PayoutMethod,
} from './affiliates';

export const SETTINGS_KEY = 'affiliate_program';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function loadAffiliateSettings(): Promise<{ settings: AffiliateSettings; saved: boolean }> {
  const { data, error } = await getSettingAdmin(SETTINGS_KEY).catch(() => ({ data: null, error: 'unavailable' }));
  const row = !error ? data?.[0] : null;
  if (row) {
    const { value } = parseAffiliateSettings(row.value);
    if (value) return { settings: value, saved: true };
  }
  return { settings: DEFAULT_AFFILIATE_SETTINGS, saved: false };
}
export const saveAffiliateSettings = (s: AffiliateSettings, userId: string) => upsertSettingAdmin(SETTINGS_KEY, s, userId);

export function affiliateDbError(error: string) {
  return /affiliate|relation|does not exist|schema cache/i.test(error) && !/duplicate|unique/i.test(error)
    ? 'Run supabase/migration_2026_11_affiliate_program.sql in Supabase to turn on the affiliate program.'
    : /affiliates_email_idx|duplicate key.*email/i.test(error)
      ? 'An affiliate with this email already exists.'
      : /affiliates_code|duplicate key.*code/i.test(error)
        ? 'That referral code is already taken.'
        : /affiliate_referrals_director_idx/i.test(error)
          ? 'That director is already credited to an affiliate.'
          : /violates foreign key/i.test(error)
            ? 'This affiliate has referrals or payouts. Pause them instead of deleting.'
            : 'Something went wrong saving to the database.';
}

/** Everything the admin pages need */
export async function loadAffiliateData(): Promise<{ data: AffiliateData; error: string | null }> {
  const [aff, refs, pays, dirs, st] = await Promise.all([listAffiliatesAdmin(), listAffiliateReferralsAdmin(), listAffiliatePayoutsAdmin(), listDirectorsAdmin(), loadAffiliateSettings()]);
  const err = aff.error || refs.error || pays.error;
  const referrals = refs.data || [];
  const directorIds = [...new Set(referrals.filter((r) => r.status === 'active').map((r) => r.director_id))];
  const t = await listTournamentsByDirectorsAdmin(directorIds);
  const regs = await listRegistrationsForTournamentsAdmin((t.data || []).map((x) => x.id));
  return {
    data: {
      affiliates: aff.data || [], referrals, payouts: pays.data || [],
      tournaments: t.data || [], registrations: regs.data || [], directors: dirs.data || [],
      settings: st.settings, settingsSaved: st.saved,
    },
    error: err ? affiliateDbError(err) : t.error || regs.error ? 'Couldn’t load tournament registrations.' : null,
  };
}

type Body = Record<string, unknown>;
const str = (b: Body, k: string, max: number) => (typeof b[k] === 'string' ? (b[k] as string).trim().slice(0, max) : '');
const has = (b: Body, k: string) => k in b;

/** Validate affiliate fields from the admin or the public application. `partial` = PATCH. */
export function affiliateFromBody(b: Body, partial: boolean, admin: boolean): { value: Partial<DbAffiliate> | null; error: string | null } {
  const v: Partial<DbAffiliate> = {};
  const fail = (error: string) => ({ value: null, error });
  if (!partial || has(b, 'name')) { const n = str(b, 'name', 120); if (!n) return fail('Enter a name.'); v.name = n; }
  if (!partial || has(b, 'email')) { const e = str(b, 'email', 254).toLowerCase(); if (!EMAIL_RE.test(e)) return fail('Enter a valid email.'); v.email = e; }
  if (has(b, 'phone')) v.phone = str(b, 'phone', 40) || null;
  if (has(b, 'organization')) v.organization = str(b, 'organization', 160) || null;
  if (has(b, 'website')) {
    let w = str(b, 'website', 300);
    if (w && !/^https?:\/\//i.test(w)) w = `https://${w}`;
    if (w) { try { new URL(w); } catch { return fail('Enter a valid website.'); } }
    v.website = w || null;
  }
  if (has(b, 'audience')) { const a = str(b, 'audience', 2001); if (a.length > 2000) return fail('Keep “how you’ll promote HOOX” under 2,000 characters.'); v.audience = a || null; }
  if (has(b, 'payoutMethod')) {
    const m = str(b, 'payoutMethod', 20) as PayoutMethod;
    if (m && !PAYOUT_METHODS.includes(m)) return fail('Choose a payout method.');
    v.payout_method = m || null;
  }
  if (has(b, 'payoutDetails')) v.payout_details = str(b, 'payoutDetails', 300) || null;
  if (!admin) return { value: v, error: null };

  if (has(b, 'code')) {
    const c = str(b, 'code', 20).toUpperCase();
    if (!CODE_RE.test(c)) return fail('Referral code: 3–20 letters or numbers.');
    v.code = c;
  }
  if (has(b, 'ratePercent')) { const r = Number(b.ratePercent); if (!Number.isFinite(r) || r < 0 || r > 100) return fail('Commission rate must be 0–100%.'); v.rate_percent = Math.round(r * 100) / 100; }
  if (has(b, 'windowMonths')) { const w = Number(b.windowMonths); if (!Number.isInteger(w) || w < 1 || w > 120) return fail('Earning window must be 1–120 months.'); v.window_months = w; }
  if (has(b, 'status')) {
    const s = str(b, 'status', 20) as AffiliateStatus;
    if (!AFFILIATE_STATUSES.includes(s)) return fail('Unknown status.');
    v.status = s;
  }
  if (has(b, 'notes')) { const n = str(b, 'notes', 4001); if (n.length > 4000) return fail('Notes must be 4,000 characters or fewer.'); v.notes = n || null; }
  return { value: v, error: null };
}

const readCookie = (request: Request, name: string) => {
  const m = (request.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
};

/**
 * Credit a newly created director to the affiliate in their referral cookie.
 * Safe to call more than once: only directors created in the last day, with no
 * existing referral, and an active affiliate code are credited.
 */
export async function creditReferral(request: Request, directorId: string): Promise<{ credited: boolean; reason?: string }> {
  const code = (readCookie(request, REF_COOKIE) || '').toUpperCase();
  if (!CODE_RE.test(code)) return { credited: false, reason: 'no_code' };
  const [{ data: users }, { data: affs }, { data: existing }] = await Promise.all([
    getUserByIdAdmin(directorId), getAffiliateByCodeAdmin(code), getActiveReferralForDirectorAdmin(directorId),
  ]);
  const user = users?.[0];
  const aff = affs?.[0];
  if (!user || user.role !== 'director') return { credited: false, reason: 'not_director' };
  if (Date.now() - new Date(user.created_at).getTime() > 24 * 3600 * 1000) return { credited: false, reason: 'not_new' };
  if (!aff || aff.status !== 'active') return { credited: false, reason: 'inactive_affiliate' };
  if (existing && existing.length) return { credited: false, reason: 'already_credited' };
  if (aff.email.toLowerCase() === String(user.email).toLowerCase()) return { credited: false, reason: 'self_referral' };
  const { error } = await createAffiliateReferralAdmin({
    affiliate_id: aff.id, director_id: user.id, director_name: user.name, director_email: user.email,
    referred_at: todayIso(), rate_percent: aff.rate_percent, window_months: aff.window_months, source: 'link', status: 'active',
  });
  return error ? { credited: false, reason: 'db_error' } : { credited: true };
}

/** Clear the referral cookie once it has been used */
export const clearRefCookie = `${REF_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
