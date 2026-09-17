// src/app/api/auth/logout/route.ts
// Clears the signed httpOnly session cookie. The legacy client-side
// hoox_session cookie/localStorage entry is cleared separately by
// src/lib/auth.ts's clearSession(), which still runs in the browser.

export const runtime = 'edge';

import { AUTH_COOKIE_NAME } from '@/lib/serverSession';

export async function POST() {
  const response = Response.json({ ok: true });
  response.headers.append('Set-Cookie', `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  return response;
}
