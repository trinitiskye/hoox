// src/lib/supabaseAdmin.ts
// SERVER-ONLY Supabase client using the service role key.
// This bypasses Row Level Security entirely, so it must never be imported
// from a 'use client' component or anything that ships to the browser.
// Only import this from src/app/api/** route handlers.

import type { DbUser, DbUserInsert, DbHeroSlide, DbHeroSlideInsert, DbHomeBanner, DbHomeBannerInsert } from './supabase';
import type { DbEventSubmission, DbEventSubmissionInsert } from './eventSubmission';
import type { DbClubSubmission, DbClubSubmissionInsert } from './clubSubmission';
import type { DbClubFeatureRequest, DbClubFeatureRequestInsert } from './clubFeature';
import type { DbFishSpecies } from './species';
import type { DbFeaturedRequest } from './featured';
import type { DbSponsorAccount, DbSponsorPromotion } from './sponsors';
import type { DbAffiliate, DbAffiliateReferral, DbAffiliatePayout, AffTournament, AffRegistration, AffDirector } from './affiliates';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function assertConfigured() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing Supabase admin environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server-only, do not prefix with NEXT_PUBLIC_).'
    );
  }
}

export async function supabaseAdminFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  assertConfigured();
  const url = `${SUPABASE_URL}/rest/v1/${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {}),
    },
  });

  if (res.status === 204) return { data: null, error: null };

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    let message: string | undefined;
    if (json && typeof json === 'object' && 'message' in json) {
      const m = (json as { message?: unknown }).message;
      if (typeof m === 'string') message = m;
    }
    return { data: null, error: message || text || `Supabase admin request failed (${res.status})` };
  }

  return { data: json as T, error: null };
}

// ============================================================
// USERS (service-role — bypasses RLS)
// ============================================================

export async function getUserByEmailAdmin(email: string) {
  return supabaseAdminFetch<DbUser[]>(`users?email=eq.${encodeURIComponent(email)}&select=*`);
}

export async function getUserByIdAdmin(id: string) {
  return supabaseAdminFetch<DbUser[]>(`users?id=eq.${encodeURIComponent(id)}&select=*`);
}

export async function createUserAdmin(u: Omit<DbUserInsert, 'id' | 'created_at'>) {
  return supabaseAdminFetch<DbUser[]>('users', {
    method: 'POST',
    body: JSON.stringify(u),
  });
}

export async function updateUserAdmin(id: string, updates: Partial<DbUserInsert>) {
  return supabaseAdminFetch<DbUser[]>(`users?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteUserAdmin(id: string) {
  return supabaseAdminFetch<null>(`users?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ============================================================
// HERO SLIDES (service-role — bypasses RLS)
// ============================================================


export const HERO_BUCKET = 'hero-images';

export async function listHeroSlidesAdmin() {
  return supabaseAdminFetch<DbHeroSlide[]>('hero_slides?select=*&order=sort_order.asc,created_at.asc');
}

export async function createHeroSlideAdmin(s: DbHeroSlideInsert) {
  return supabaseAdminFetch<DbHeroSlide[]>('hero_slides', {
    method: 'POST',
    body: JSON.stringify(s),
  });
}

export async function updateHeroSlideAdmin(id: string, updates: Partial<DbHeroSlideInsert>) {
  return supabaseAdminFetch<DbHeroSlide[]>(`hero_slides?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteHeroSlideAdmin(id: string) {
  return supabaseAdminFetch<DbHeroSlide[]>(`hero_slides?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ------------------------------------------------------------
// Public image storage (shared by hero slides and home banners)
// ------------------------------------------------------------

/** Public URL prefix for objects in a public storage bucket. */
export function publicUrlPrefix(bucket: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/`;
}

/** Upload one image to a public Supabase Storage bucket; returns its public URL. */
export async function uploadPublicImageAdmin(
  bucket: string,
  path: string,
  body: ArrayBuffer,
  contentType: string
): Promise<{ url: string | null; error: string | null }> {
  assertConfigured();
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': contentType,
      'Cache-Control': '31536000',
      'x-upsert': 'false',
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const j = JSON.parse(text);
      message = j.message || j.error || text;
    } catch {
      /* keep text */
    }
    return { url: null, error: message || `Upload failed (${res.status})` };
  }
  return { url: publicUrlPrefix(bucket) + path, error: null };
}

/** Best-effort delete of an uploaded image (ignores URLs outside the bucket). */
export async function deletePublicImageAdmin(bucket: string, publicUrl: string) {
  const prefix = publicUrlPrefix(bucket);
  if (!publicUrl.startsWith(prefix)) return;
  assertConfigured();
  const path = publicUrl.slice(prefix.length);
  await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: 'DELETE',
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  }).catch(() => undefined);
}

export function uploadHeroImageAdmin(path: string, body: ArrayBuffer, contentType: string) {
  return uploadPublicImageAdmin(HERO_BUCKET, path, body, contentType);
}

export function deleteHeroImageAdmin(publicUrl: string) {
  return deletePublicImageAdmin(HERO_BUCKET, publicUrl);
}

// ============================================================
// HOME BANNERS — "We recommend" (service-role — bypasses RLS)
// ============================================================

export const BANNER_BUCKET = 'ad-banners';

export async function listHomeBannersAdmin() {
  return supabaseAdminFetch<DbHomeBanner[]>('home_banners?select=*&order=sort_order.asc,created_at.asc');
}

export async function createHomeBannerAdmin(b: DbHomeBannerInsert) {
  return supabaseAdminFetch<DbHomeBanner[]>('home_banners', {
    method: 'POST',
    body: JSON.stringify(b),
  });
}

export async function updateHomeBannerAdmin(id: string, updates: Partial<DbHomeBannerInsert>) {
  return supabaseAdminFetch<DbHomeBanner[]>(`home_banners?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteHomeBannerAdmin(id: string) {
  return supabaseAdminFetch<DbHomeBanner[]>(`home_banners?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ============================================================
// EVENT SUBMISSIONS — "Submit your Event" (service-role — bypasses RLS)
// ============================================================

export const EVENT_SUBMISSION_BUCKET = 'event-submissions';

export async function createEventSubmissionAdmin(s: DbEventSubmissionInsert) {
  return supabaseAdminFetch<DbEventSubmission[]>('event_submissions', {
    method: 'POST',
    body: JSON.stringify(s),
  });
}

export async function listEventSubmissionsAdmin() {
  return supabaseAdminFetch<DbEventSubmission[]>('event_submissions?select=*&order=created_at.desc&limit=500');
}

export async function updateEventSubmissionAdmin(
  id: string,
  updates: Partial<Pick<DbEventSubmission, 'status' | 'admin_notes' | 'reviewed_at'>>
) {
  return supabaseAdminFetch<DbEventSubmission[]>(`event_submissions?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// ============================================================
// CLUB SUBMISSIONS — "Submit a Club" (service-role — bypasses RLS)
// ============================================================

export const CLUB_SUBMISSION_BUCKET = 'club-submissions';

export async function createClubSubmissionAdmin(s: DbClubSubmissionInsert) {
  return supabaseAdminFetch<DbClubSubmission[]>('club_submissions', {
    method: 'POST',
    body: JSON.stringify(s),
  });
}

export async function listClubSubmissionsAdmin() {
  return supabaseAdminFetch<DbClubSubmission[]>('club_submissions?select=*&order=created_at.desc&limit=500');
}

export async function updateClubSubmissionAdmin(
  id: string,
  updates: Partial<Pick<DbClubSubmission, 'status' | 'admin_notes' | 'reviewed_at' | 'lat' | 'lng'>>
) {
  return supabaseAdminFetch<DbClubSubmission[]>(`club_submissions?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/** Approved clubs, for the public /clubs directory and map. */
export async function listApprovedClubsAdmin() {
  return supabaseAdminFetch<DbClubSubmission[]>('club_submissions?select=*&status=eq.approved&order=created_at.desc&limit=1000');
}

export async function getClubSubmissionAdmin(id: string) {
  return supabaseAdminFetch<DbClubSubmission[]>(`club_submissions?id=eq.${encodeURIComponent(id)}&select=*`);
}

/** Clubs a user submitted (any status), for "Feature your Club". */
export async function listClubSubmissionsByUserAdmin(userId: string) {
  return supabaseAdminFetch<DbClubSubmission[]>(
    `club_submissions?submitted_by=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc&limit=100`
  );
}

export async function setClubFeaturedAdmin(id: string, featured: boolean, until: string | null) {
  return supabaseAdminFetch<DbClubSubmission[]>(`club_submissions?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ featured, featured_until: until }),
  });
}

// ============================================================
// CLUB FEATURE REQUESTS — "Feature your Club" (service-role)
// ============================================================

export async function createClubFeatureRequestAdmin(r: DbClubFeatureRequestInsert) {
  return supabaseAdminFetch<DbClubFeatureRequest[]>('club_feature_requests', {
    method: 'POST',
    body: JSON.stringify(r),
  });
}

export async function listClubFeatureRequestsAdmin() {
  return supabaseAdminFetch<DbClubFeatureRequest[]>('club_feature_requests?select=*&order=created_at.desc&limit=500');
}

export async function updateClubFeatureRequestAdmin(
  id: string,
  updates: Partial<Pick<DbClubFeatureRequest, 'status' | 'admin_notes' | 'reviewed_at'>>
) {
  return supabaseAdminFetch<DbClubFeatureRequest[]>(`club_feature_requests?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function getClubFeatureRequestAdmin(id: string) {
  return supabaseAdminFetch<DbClubFeatureRequest[]>(`club_feature_requests?id=eq.${encodeURIComponent(id)}&select=*`);
}

// ============================================================
// SITE SETTINGS — admin-editable key/value settings (service-role)
// ============================================================

export interface DbSiteSetting {
  key: string;
  value: unknown;
  updated_by: string | null;
  updated_at: string;
}

export async function getSettingAdmin(key: string) {
  return supabaseAdminFetch<DbSiteSetting[]>(`site_settings?key=eq.${encodeURIComponent(key)}&select=*`);
}

export async function upsertSettingAdmin(key: string, value: unknown, userId: string) {
  return supabaseAdminFetch<DbSiteSetting[]>('site_settings?on_conflict=key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ key, value, updated_by: userId, updated_at: new Date().toISOString() }),
  });
}

// ============================================================
// FISH SPECIES — master list for tournament species (service-role)
// ============================================================

export async function listSpeciesAdmin(activeOnly = false) {
  return supabaseAdminFetch<DbFishSpecies[]>(`fish_species?select=*${activeOnly ? '&is_active=eq.true' : ''}&order=name.asc&limit=1000`);
}

export async function createSpeciesAdmin(s: Pick<DbFishSpecies, 'name' | 'category' | 'is_active'>) {
  return supabaseAdminFetch<DbFishSpecies[]>('fish_species', { method: 'POST', body: JSON.stringify(s) });
}

export async function getSpeciesAdmin(id: string) {
  return supabaseAdminFetch<DbFishSpecies[]>(`fish_species?id=eq.${encodeURIComponent(id)}&select=*`);
}

export async function updateSpeciesAdmin(id: string, updates: Partial<Pick<DbFishSpecies, 'name' | 'category' | 'is_active'>>) {
  return supabaseAdminFetch<DbFishSpecies[]>(`fish_species?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteSpeciesAdmin(id: string) {
  return supabaseAdminFetch<DbFishSpecies[]>(`fish_species?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** Tournaments whose fish_types include `name` (exact match). */
export async function listTournamentsWithSpeciesAdmin(name: string) {
  const arr = `{${JSON.stringify(name)}}`; // Postgres array literal, quoted
  return supabaseAdminFetch<{ id: string; fish_types: string[] | null }[]>(
    `tournaments?select=id,fish_types&fish_types=cs.${encodeURIComponent(arr)}&limit=1000`
  );
}

export async function setTournamentFishTypesAdmin(id: string, fishTypes: string[]) {
  return supabaseAdminFetch<unknown[]>(`tournaments?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ fish_types: fishTypes }),
  });
}

// ============================================================
// FEATURED PLACEMENTS — all listing types (rows in club_feature_requests)
// ============================================================

export async function listFeaturedRequestsAdmin(type?: string) {
  const t = type ? `&listing_type=eq.${encodeURIComponent(type)}` : '';
  return supabaseAdminFetch<DbFeaturedRequest[]>(`club_feature_requests?select=*${t}&order=created_at.desc&limit=2000`);
}

/** Approved placements live today for a listing type (public pages) */
export async function listActivePlacementsAdmin(type: string, today: string) {
  return supabaseAdminFetch<Pick<DbFeaturedRequest, 'listing_id' | 'club_name' | 'placement' | 'featured_from' | 'featured_until'>[]>(
    `club_feature_requests?select=listing_id,club_name,placement,featured_from,featured_until&status=eq.approved&listing_type=eq.${encodeURIComponent(type)}&featured_until=gte.${today}&limit=500`
  );
}

export async function createFeaturedRequestAdmin(r: Partial<DbFeaturedRequest>) {
  return supabaseAdminFetch<DbFeaturedRequest[]>('club_feature_requests', { method: 'POST', body: JSON.stringify(r) });
}

export async function getFeaturedRequestAdmin(id: string) {
  return supabaseAdminFetch<DbFeaturedRequest[]>(`club_feature_requests?id=eq.${encodeURIComponent(id)}&select=*`);
}

export async function updateFeaturedRequestAdmin(id: string, patch: Partial<DbFeaturedRequest>) {
  return supabaseAdminFetch<DbFeaturedRequest[]>(`club_feature_requests?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export async function setClubHeroAdmin(id: string, on: boolean, until: string | null) {
  return supabaseAdminFetch<DbClubSubmission[]>(`club_submissions?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ featured_hero: on, featured_hero_until: until }),
  });
}

// ============================================================
// SPONSOR PROGRAMS — sponsor_accounts + sponsor_promotions (service-role)
// ============================================================

const idEq = (id: string) => `id=eq.${encodeURIComponent(id)}`;

export async function listSponsorAccountsAdmin() {
  return supabaseAdminFetch<DbSponsorAccount[]>('sponsor_accounts?select=*&order=brand_name.asc&limit=2000');
}
export async function createSponsorAccountAdmin(a: Partial<DbSponsorAccount>) {
  return supabaseAdminFetch<DbSponsorAccount[]>('sponsor_accounts', { method: 'POST', body: JSON.stringify(a) });
}
export async function updateSponsorAccountAdmin(id: string, patch: Partial<DbSponsorAccount>) {
  return supabaseAdminFetch<DbSponsorAccount[]>(`sponsor_accounts?${idEq(id)}`, { method: 'PATCH', body: JSON.stringify(patch) });
}
export async function deleteSponsorAccountAdmin(id: string) {
  return supabaseAdminFetch<DbSponsorAccount[]>(`sponsor_accounts?${idEq(id)}`, { method: 'DELETE' });
}

export async function listSponsorPromotionsAdmin() {
  return supabaseAdminFetch<DbSponsorPromotion[]>('sponsor_promotions?select=*&order=start_date.desc&limit=5000');
}
export async function getSponsorPromotionAdmin(id: string) {
  return supabaseAdminFetch<DbSponsorPromotion[]>(`sponsor_promotions?${idEq(id)}&select=*`);
}
export async function createSponsorPromotionAdmin(p: Partial<DbSponsorPromotion>) {
  return supabaseAdminFetch<DbSponsorPromotion[]>('sponsor_promotions', { method: 'POST', body: JSON.stringify(p) });
}
export async function updateSponsorPromotionAdmin(id: string, patch: Partial<DbSponsorPromotion>) {
  return supabaseAdminFetch<DbSponsorPromotion[]>(`sponsor_promotions?${idEq(id)}`, { method: 'PATCH', body: JSON.stringify(patch) });
}
export async function deleteSponsorPromotionAdmin(id: string) {
  return supabaseAdminFetch<DbSponsorPromotion[]>(`sponsor_promotions?${idEq(id)}`, { method: 'DELETE' });
}

// ============================================================
// AFFILIATE PROGRAM — affiliates, referrals, payouts (service-role)
// ============================================================

const inList = (ids: string[]) => `in.(${ids.map((i) => `"${i.replace(/"/g, '')}"`).join(',')})`;

export const listAffiliatesAdmin = () => supabaseAdminFetch<DbAffiliate[]>('affiliates?select=*&order=created_at.desc&limit=2000');
export const getAffiliateAdmin = (id: string) => supabaseAdminFetch<DbAffiliate[]>(`affiliates?${idEq(id)}&select=*`);
export const getAffiliateByCodeAdmin = (code: string) => supabaseAdminFetch<DbAffiliate[]>(`affiliates?code=eq.${encodeURIComponent(code)}&select=*`);
export const getAffiliateByEmailAdmin = (email: string) => supabaseAdminFetch<DbAffiliate[]>(`affiliates?email=eq.${encodeURIComponent(email.toLowerCase())}&select=id,status`);
export const createAffiliateAdmin = (a: Partial<DbAffiliate>) => supabaseAdminFetch<DbAffiliate[]>('affiliates', { method: 'POST', body: JSON.stringify(a) });
export const updateAffiliateAdmin = (id: string, patch: Partial<DbAffiliate>) => supabaseAdminFetch<DbAffiliate[]>(`affiliates?${idEq(id)}`, { method: 'PATCH', body: JSON.stringify(patch) });
export const deleteAffiliateAdmin = (id: string) => supabaseAdminFetch<DbAffiliate[]>(`affiliates?${idEq(id)}`, { method: 'DELETE' });

export const listAffiliateReferralsAdmin = () => supabaseAdminFetch<DbAffiliateReferral[]>('affiliate_referrals?select=*&order=referred_at.desc&limit=5000');
export const getActiveReferralForDirectorAdmin = (directorId: string) => supabaseAdminFetch<DbAffiliateReferral[]>(`affiliate_referrals?director_id=eq.${encodeURIComponent(directorId)}&status=eq.active&select=id,affiliate_id`);
export const createAffiliateReferralAdmin = (r: Partial<DbAffiliateReferral>) => supabaseAdminFetch<DbAffiliateReferral[]>('affiliate_referrals', { method: 'POST', body: JSON.stringify(r) });
export const updateAffiliateReferralAdmin = (id: string, patch: Partial<DbAffiliateReferral>) => supabaseAdminFetch<DbAffiliateReferral[]>(`affiliate_referrals?${idEq(id)}`, { method: 'PATCH', body: JSON.stringify(patch) });

export const listAffiliatePayoutsAdmin = () => supabaseAdminFetch<DbAffiliatePayout[]>('affiliate_payouts?select=*&order=paid_at.desc&limit=5000');
export const createAffiliatePayoutAdmin = (p: Partial<DbAffiliatePayout>) => supabaseAdminFetch<DbAffiliatePayout[]>('affiliate_payouts', { method: 'POST', body: JSON.stringify(p) });
export const deleteAffiliatePayoutAdmin = (id: string) => supabaseAdminFetch<DbAffiliatePayout[]>(`affiliate_payouts?${idEq(id)}`, { method: 'DELETE' });

export const listDirectorsAdmin = () => supabaseAdminFetch<AffDirector[]>('users?select=id,name,email,organization,created_at&role=eq.director&order=name.asc&limit=5000');
export async function listTournamentsByDirectorsAdmin(directorIds: string[]) {
  if (directorIds.length === 0) return { data: [] as AffTournament[], error: null };
  return supabaseAdminFetch<AffTournament[]>(`tournaments?select=id,name,created_by,start_date&created_by=${inList(directorIds)}&limit=5000`);
}
export async function listRegistrationsForTournamentsAdmin(tournamentIds: string[]) {
  if (tournamentIds.length === 0) return { data: [] as AffRegistration[], error: null };
  const out: AffRegistration[] = [];
  for (let i = 0; i < tournamentIds.length; i += 100) {
    const { data, error } = await supabaseAdminFetch<AffRegistration[]>(`registrations?select=id,tournament_id,fee,app_owner_cut,registered_at&tournament_id=${inList(tournamentIds.slice(i, i + 100))}&limit=20000`);
    if (error) return { data: null, error };
    out.push(...(data || []));
  }
  return { data: out, error: null };
}
