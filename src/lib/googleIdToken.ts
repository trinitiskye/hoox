// src/lib/googleIdToken.ts
// Server-side verification of a Google ID token (from "Sign in with Google").
// Checks the RS256 signature against Google's published keys, plus issuer,
// audience (our OAuth client ID), expiry and verified email. Runs on the
// edge runtime (Web Crypto only, no Node APIs).

const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

export interface GoogleIdentity {
  sub: string; // Google account ID
  email: string;
  name: string;
  picture?: string;
}

type Jwk = JsonWebKey & { kid: string };
let cachedKeys: { keys: Jwk[]; expires: number } | null = null;

async function googleKeys(): Promise<Jwk[]> {
  if (cachedKeys && Date.now() < cachedKeys.expires) return cachedKeys.keys;
  const res = await fetch(JWKS_URL);
  if (!res.ok) throw new Error('Could not load Google signing keys');
  const { keys } = (await res.json()) as { keys: Jwk[] };
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1] ?? 3600);
  cachedKeys = { keys, expires: Date.now() + maxAge * 1000 };
  return keys;
}

function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const b64urlJson = (s: string) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

/** Returns the verified identity, or throws with a short reason. */
export async function verifyGoogleIdToken(token: string, clientId: string): Promise<GoogleIdentity> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [h, p, sig] = parts;
  const header = b64urlJson(h) as { alg?: string; kid?: string };
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Unsupported token');

  let jwk = (await googleKeys()).find((k) => k.kid === header.kid);
  if (!jwk) {
    cachedKeys = null; // keys may have rotated
    jwk = (await googleKeys()).find((k) => k.kid === header.kid);
  }
  if (!jwk) throw new Error('Unknown signing key');

  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(sig), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) throw new Error('Bad signature');

  const c = b64urlJson(p) as {
    iss?: string; aud?: string; exp?: number; sub?: string; email?: string; email_verified?: boolean | string; name?: string; picture?: string;
  };
  const now = Math.floor(Date.now() / 1000);
  if (!c.iss || !ISSUERS.has(c.iss)) throw new Error('Wrong issuer');
  if (c.aud !== clientId) throw new Error('Wrong audience');
  if (!c.exp || c.exp < now - 60) throw new Error('Token expired');
  if (!c.sub || !c.email) throw new Error('Missing account details');
  if (!(c.email_verified === true || c.email_verified === 'true')) throw new Error('Email not verified');

  return { sub: c.sub, email: c.email.toLowerCase(), name: c.name || c.email.split('@')[0], picture: c.picture };
}
