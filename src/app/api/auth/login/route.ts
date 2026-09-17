// src/app/api/auth/login/route.ts
// Verifies a login server-side so the password hash never has to be sent
// to the browser (previously the client read it directly via the public
// Supabase anon key and compared it in JS — see the login-flow note in
// src/lib/auth.ts). On success this sets the signed, httpOnly session
// cookie that the other /api/admin/** routes rely on for authorization.

export const runtime = 'edge';

import { getUserByEmailAdmin } from '@/lib/supabaseAdmin';
import { verifyPassword } from '@/lib/passwordHash';
import { dbUserToApp } from '@/lib/supabase';
import { createSessionToken, sessionCookieOptions, AUTH_COOKIE_NAME } from '@/lib/serverSession';

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ user: null, error: 'Invalid request.', code: 'unknown' }, { status: 400 });
  }

  const email = (body.email || '').toLowerCase().trim();
  const password = body.password || '';
  if (!email || !password) {
    return Response.json({ user: null, error: 'Email and password are required.', code: 'unknown' }, { status: 400 });
  }

  const { data, error } = await getUserByEmailAdmin(email);
  if (error) {
    return Response.json({ user: null, error: 'Connection error. Please try again.', code: 'connection_error' }, { status: 502 });
  }
  if (!data || data.length === 0) {
    return Response.json({ user: null, error: 'No account found with that email.', code: 'not_found' });
  }

  const dbUser = data[0];

  if (!dbUser.password_hash) {
    return Response.json({ user: null, error: 'Account not set up correctly. Please contact support.', code: 'unknown' });
  }

  if (!verifyPassword(password, dbUser.password_hash)) {
    return Response.json({ user: null, error: 'Incorrect password.', code: 'wrong_password' });
  }

  if (dbUser.status === 'paused') {
    return Response.json({ user: null, error: 'paused', code: 'account_paused' });
  }

  if (dbUser.status === 'banned' || dbUser.status === 'inactive') {
    return Response.json({ user: null, error: 'banned', code: 'account_banned' });
  }

  if (dbUser.status === 'pending') {
    return Response.json({
      user: null,
      error: 'Your account is pending approval. You will receive an email when approved.',
      code: 'account_pending',
    });
  }

  const user = dbUserToApp(dbUser);
  const token = await createSessionToken(user.id);
  const opts = sessionCookieOptions();

  const response = Response.json({ user, error: null });
  response.headers.append(
    'Set-Cookie',
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=${opts.path}; Max-Age=${opts.maxAge}; HttpOnly; Secure; SameSite=Lax`
  );
  return response;
}
