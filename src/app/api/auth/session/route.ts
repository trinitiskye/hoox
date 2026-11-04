// GET /api/auth/session — is the signed server session (hoox_auth) still valid?
//   200 { user }  → valid; the cookie is re-issued so active users stay signed in
//   401 { user: null } → expired or missing; the browser should sign in again
//
// The page's own copy of the user (localStorage) never expires on its own, so
// without this check the site can say "Welcome, Cher" while every admin API
// call is refused.

export const runtime = 'edge';

import { getAuthenticatedUser, createSessionToken, sessionCookieOptions, AUTH_COOKIE_NAME } from '@/lib/serverSession';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return Response.json({ user: null }, { status: 401, headers: { 'Cache-Control': 'no-store' } });

  const token = await createSessionToken(user.id);
  const opts = sessionCookieOptions();
  const response = Response.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
  response.headers.append(
    'Set-Cookie',
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=${opts.path}; Max-Age=${opts.maxAge}; HttpOnly; Secure; SameSite=Lax`
  );
  return response;
}
