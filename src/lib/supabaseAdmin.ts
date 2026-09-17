// src/lib/supabaseAdmin.ts
// SERVER-ONLY Supabase client using the service role key.
// This bypasses Row Level Security entirely, so it must never be imported
// from a 'use client' component or anything that ships to the browser.
// Only import this from src/app/api/** route handlers.

import type { DbUser, DbUserInsert } from './supabase';

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
