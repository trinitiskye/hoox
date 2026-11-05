// src/lib/passwordHash.ts
// Pure, isomorphic password hashing helpers — safe to import from both
// client components and server-only route handlers (no window/DOM access).
//
// LEGACY ONLY. This is the original reversible demo scheme. New passwords are
// hashed with bcrypt by src/lib/passwordServer.ts; these helpers are only used
// to recognise old 'h_…' hashes until they're upgraded (on sign-in, or all at
// once by supabase/migration_2026_11_secure_passwords.sql). Don't use them for
// anything new.

export function hashPassword(password: string): string {
  // Simple deterministic hash for demo purposes
  // In production: use Supabase Auth (or bcrypt/argon2) which handles
  // hashing properly server-side.
  let hash = 0;
  const str = password + 'hoox_salt_2026';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + btoa(password).replace(/=/g, '');
}

export function verifyPassword(password: string, hash: string): boolean {
  if (!hash) return false;
  // Check new hash format
  if (hash.startsWith('h_')) {
    return hashPassword(password) === hash;
  }
  // Legacy: plain text comparison (for demo accounts created early)
  return password === hash;
}
