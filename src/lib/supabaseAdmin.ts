// src/lib/supabaseAdmin.ts
// SERVER-ONLY Supabase client using the service role key.
// This bypasses Row Level Security entirely, so it must never be imported
// from a 'use client' component or anything that ships to the browser.
// Only import this from src/app/api/** route handlers.

import type { DbUser, DbUserInsert, DbHeroSlide, DbHeroSlideInsert, DbHomeBanner, DbHomeBannerInsert } from './supabase';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function assertConfigured() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing Supabase admin environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server-only, do not prefix with NEXT_PUBLIC_).'
    );
  }
}

async function supabaseAdminFetch<T>(
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
