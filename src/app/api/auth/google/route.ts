// src/app/api/auth/google/route.ts
// "Sign in with Google" for anglers and tournament directors.
// The browser sends Google's ID token; we verify it server-side, then:
//   • existing account with that email → sign in (same checks as /api/auth/login)
//   • no account + a role (sign-up page) → create an angler/director account
//   • no account + no role (login page)  → ask them to create an account first
// On success this sets the same signed, httpOnly session cookie as password login.

export const runtime = 'edge';

import { verifyGoogleIdToken } from '@/lib/googleIdToken';
import { getUserByEmailAdmin, createUserAdmin } from '@/lib/supabaseAdmin';
import { dbUserToApp } from '@/lib/supabase';
import { hashPassword } from '@/lib/passwordHash';
import { createSessionToken, sessionCookieOptions, AUTH_COOKIE_NAME } from '@/lib/serverSession';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
const SIGNUP_ROLES = new Set(['angler', 'director']);

function fail(error: string, code: string, status = 200) {
  return Response.json({ user: null, error, code }, { status });
}

export async function POST(request: Request) {
  if (!CLIENT_ID) return fail('Google sign-in isn’t set up yet.', 'not_configured', 503);

  let body: { credential?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return fail('Invalid request.', 'unknown', 400);
  }
  if (!body.credential) return fail('Missing Google sign-in.', 'unknown', 400);

  let g;
  try {
    g = await verifyGoogleIdToken(body.credential, CLIENT_ID);
  } catch {
    return fail('We couldn’t verify your Google sign-in. Please try again.', 'invalid_token', 401);
  }

  const { data, error } = await getUserByEmailAdmin(g.email);
  if (error) return fail('Connection error. Please try again.', 'connection_error', 502);

  let dbUser = data?.[0];
  let created = false;

  if (!dbUser) {
    const role = body.role && SIGNUP_ROLES.has(body.role) ? body.role : null;
    if (!role) return fail('No HOOX account uses this Google email yet. Create an angler or director account first.', 'not_found');

    // Google accounts get a random password hash that nobody knows, so the
    // account can only be used with Google until they set a password.
    const random = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
    const res = await createUserAdmin({
      name: g.name,
      email: g.email,
      password_hash: hashPassword(random),
      role,
      status: 'active',
      organization: null,
      address: null,
      city: null,
      state: null,
      zip: null,
      phone: null,
      website: null,
      avatar: g.picture || null,
      message: null,
      banner_image: null,
      banner_start_date: null,
      banner_end_date: null,
      country: null,
    });
    if (res.error || !res.data?.[0]) return fail('We couldn’t create your account. Please try again.', 'unknown', 502);
    dbUser = res.data[0];
    created = true;
  }

  if (dbUser.status === 'paused') return fail('paused', 'account_paused');
  if (dbUser.status === 'banned' || dbUser.status === 'inactive') return fail('banned', 'account_banned');
  if (dbUser.status === 'pending') {
    return fail('Your account is pending approval. You will receive an email when approved.', 'account_pending');
  }

  const user = dbUserToApp(dbUser);
  const token = await createSessionToken(user.id);
  const opts = sessionCookieOptions();
  const response = Response.json({ user, created, error: null });
  response.headers.append(
    'Set-Cookie',
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=${opts.path}; Max-Age=${opts.maxAge}; HttpOnly; Secure; SameSite=Lax`,
  );
  return response;
}
