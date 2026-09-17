// src/lib/passwordHash.ts
// Pure, isomorphic password hashing helpers — safe to import from both
// client components and server-only route handlers (no window/DOM access).
//
// NOTE: this is a simple, non-cryptographic, reversible scheme kept from an
// earlier demo build (see the comment in hashPassword). It is NOT a
// substitute for a real password hashing algorithm (bcrypt/scrypt/argon2).
// Moving password verification server-side (src/app/api/auth/login) stops
// every hash from being publicly readable via the anon Supabase key, but
// the hashes themselves should still be migrated to a real KDF eventually.

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
