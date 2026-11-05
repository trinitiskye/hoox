// SERVER-ONLY password hashing for HOOX.
//
// New passwords are hashed with bcrypt (cost 10) inside Postgres using the
// pgcrypto extension, via two SECURITY DEFINER functions that only the
// service role can call (supabase/migration_2026_11_secure_passwords.sql):
//   hoox_hash_password(p_password)          → '$2a$10$…'
//   hoox_check_password(p_password, p_hash) → boolean
// Doing the work in the database keeps it off the Cloudflare worker's CPU
// budget, and bcrypt is a real, slow, salted password hash.
//
// Older accounts may still have the original reversible 'h_…' format (or,
// for a few very early demo rows, plain text). Those still verify, and are
// upgraded to bcrypt the next time the person signs in. The migration also
// converts every old hash in one go, so nothing reversible is left stored.
//
// If the migration hasn't been run yet, hashing falls back to the old format
// so sign-up keeps working; the migration converts those rows too.

import { supabaseAdminFetch } from './supabaseAdmin';
import { hashPassword as legacyHash, verifyPassword as legacyVerify } from './passwordHash';

export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 72; // bcrypt only uses the first 72 bytes

export const isBcrypt = (h: string | null | undefined) => !!h && /^\$2[aby]\$/.test(h);

/** Returns an error message, or null when the password is acceptable */
export function passwordProblem(pw: string): string | null {
  if (typeof pw !== 'string' || pw.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters.`;
  if (new TextEncoder().encode(pw).length > MAX_PASSWORD) return `Password must be ${MAX_PASSWORD} characters or fewer.`;
  return null;
}

async function rpc<T>(fn: string, args: Record<string, unknown>) {
  return supabaseAdminFetch<T>(`rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) });
}

const missingFunction = (error: string | null) => !!error && /hoox_(hash|check)_password|could not find the function|PGRST202|does not exist/i.test(error);

/** Hash a new password (bcrypt). Falls back to the legacy format only if the DB functions aren't installed yet. */
export async function hashPasswordServer(password: string): Promise<string> {
  const { data, error } = await rpc<string>('hoox_hash_password', { p_password: password });
  if (!error && typeof data === 'string' && isBcrypt(data)) return data;
  if (missingFunction(error)) {
    console.warn('hoox_hash_password not installed yet: run supabase/migration_2026_11_secure_passwords.sql');
    return legacyHash(password);
  }
  throw new Error('Could not secure the password. Please try again.');
}

/**
 * Check a password against what's stored.
 * `upgrade` is a fresh bcrypt hash to save when the stored hash is an old format.
 */
export async function checkPasswordServer(password: string, stored: string | null | undefined): Promise<{ ok: boolean; upgrade: string | null }> {
  if (!stored || !password) return { ok: false, upgrade: null };
  if (isBcrypt(stored)) {
    const { data, error } = await rpc<boolean>('hoox_check_password', { p_password: password, p_hash: stored });
    if (error) throw new Error('Could not check the password. Please try again.');
    return { ok: data === true, upgrade: null };
  }
  // Old formats: check the old way, then upgrade to bcrypt if we can
  if (!legacyVerify(password, stored)) return { ok: false, upgrade: null };
  const next = await hashPasswordServer(password).catch(() => null);
  return { ok: true, upgrade: next && isBcrypt(next) ? next : null };
}
