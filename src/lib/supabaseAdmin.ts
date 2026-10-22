// src/lib/supabaseAdmin.ts
// SERVER-ONLY Supabase client using the service role key.
// This bypasses Row Level Security entirely, so it must never be imported
// from a 'use client' component or anything that ships to the browser.
// Only import this from src/app/api/** route handlers.

import type { DbUser, DbUserInsert, DbHeroSlide, DbHeroSlideInsert } from './supabase';

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

/** Public URL prefix for objects in the hero bucket. */
export function heroPublicUrlPrefix() {
  return `${SUPABASE_URL}/storage/v1/object/public/${HERO_BUCKET}/`;
}

/** Upload one image to Supabase Storage; returns its public URL. */
export async function uploadHeroImageAdmin(
  path: string,
  body: ArrayBuffer,
  contentType: string
): Promise<{ url: string | null; error: string | null }> {
  assertConfigured();
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${HERO_BUCKET}/${path}`, {
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
  return { url: heroPublicUrlPrefix() + path, error: null };
}

/** Best-effort delete of an uploaded hero image (ignores URLs outside our bucket). */
export async function deleteHeroImageAdmin(publicUrl: string) {
  const prefix = heroPublicUrlPrefix();
  if (!publicUrl.startsWith(prefix)) return;
  assertConfigured();
  const path = publicUrl.slice(prefix.length);
  await fetch(`${SUPABASE_URL}/storage/v1/object/${HERO_BUCKET}/${path}`, {
    method: 'DELETE',
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  }).catch(() => undefined);
}
