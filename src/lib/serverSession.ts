// src/lib/serverSession.ts
// SERVER-ONLY signed session cookie for API route authorization.
//
// This is intentionally separate from the legacy `hoox_session` cookie in
// src/lib/auth.ts. That cookie is plain, readable, and writable by any
// client-side JS (it exists only so the UI can show "Welcome, X" and do
// instant client-side redirects) — it must never be trusted for anything
// privileged, since a visitor can edit it directly in devtools.
//
// This cookie ('hoox_auth') is httpOnly (invisible to page JS) and
// cryptographically signed with SESSION_SECRET, a server-only env var. Only
// route handlers under src/app/api/** should read or set it. Every check
// here re-reads the user's CURRENT role/status from the database — it never
// trusts a role/status claim baked into the token — so a ban or role change
// takes effect immediately even if a stale signed cookie is still around.
//
// Uses Web Crypto (crypto.subtle) exclusively so this works on the
// Cloudflare Pages edge runtime this app deploys to (Node's `crypto` module
// is not available there).

import { getUserByIdAdmin } from './supabaseAdmin';
import { dbUserToApp } from './supabase';
import type { User } from '@/types';

export const AUTH_COOKIE_NAME = 'hoox_auth';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24h, matches the legacy cookie's lifetime

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('Missing SESSION_SECRET environment variable (server-only, do not prefix with NEXT_PUBLIC_).');
  }
  return secret;
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = '';
  for (const byte of arr) str += String.fromCharCode(byte);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const str = atob(padded);
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i);
  return arr;
}

async function hmacKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

interface SessionPayload {
  uid: string;
  iat: number; // seconds since epoch
}

export async function createSessionToken(userId: string): Promise<string> {
  const payload: SessionPayload = { uid: userId, iat: Math.floor(Date.now() / 1000) };
  const encoder = new TextEncoder();
  const payloadB64 = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64));
  const sigB64 = toBase64Url(signature);
  return `${payloadB64}.${sigB64}`;
}

async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  try {
    const key = await hmacKey();
    const encoder = new TextEncoder();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(sigB64) as BufferSource,
      encoder.encode(payloadB64) as BufferSource
    );
    if (!valid) return null;

    const decoder = new TextDecoder();
    const payload = JSON.parse(decoder.decode(fromBase64Url(payloadB64))) as SessionPayload;
    if (typeof payload.uid !== 'string' || typeof payload.iat !== 'number') return null;

    const ageSeconds = Math.floor(Date.now() / 1000) - payload.iat;
    if (ageSeconds < 0 || ageSeconds > SESSION_MAX_AGE_SECONDS) return null;

    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true as const,
    secure: true as const,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/**
 * Reads the signed session cookie from an incoming request, verifies its
 * signature and age, then looks up that user's CURRENT record in the
 * database (never trusting anything baked into the token itself).
 * Returns null if there is no valid session, or the account no longer
 * exists / is banned / inactive.
 */
export async function getAuthenticatedUser(request: Request): Promise<User | null> {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`));
  if (!match) return null;

  const payload = await verifySessionToken(decodeURIComponent(match[1]));
  if (!payload) return null;

  const { data, error } = await getUserByIdAdmin(payload.uid);
  if (error || !data || data.length === 0) return null;

  const dbUser = data[0];
  if (dbUser.status === 'banned' || dbUser.status === 'inactive') return null;

  return dbUserToApp(dbUser);
}

/** Same as getAuthenticatedUser, but also requires role === 'admin'. */
export async function getAuthenticatedAdmin(request: Request): Promise<User | null> {
  const user = await getAuthenticatedUser(request);
  if (!user || user.role !== 'admin') return null;
  return user;
}
