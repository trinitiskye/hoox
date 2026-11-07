// Reset a password with the link from /api/auth/forgot-password.
//   GET  ?token=…            → { valid, email? } (for the reset page)
//   POST { token, password } → sets the password, uses up the link, signs in

export const runtime = 'edge';

import { supabaseAdminFetch, updateUserAdmin, getUserByIdAdmin } from '@/lib/supabaseAdmin';
import { hashPasswordServer, passwordProblem } from '@/lib/passwordServer';
import { createSessionToken, sessionCookieOptions, AUTH_COOKIE_NAME } from '@/lib/serverSession';
import { dbUserToApp } from '@/lib/supabase';
import { sha256 } from '@/lib/supportServer';

interface Reset { id: string; user_id: string; expires_at: string; used_at: string | null }

async function find(token: unknown): Promise<Reset | null> {
  if (typeof token !== 'string' || token.length < 32 || token.length > 128) return null;
  const { data } = await supabaseAdminFetch<Reset[]>(`password_resets?token_hash=eq.${encodeURIComponent(await sha256(token))}&select=*`);
  const r = data?.[0];
  return r && !r.used_at && Date.parse(r.expires_at) > Date.now() ? r : null;
}

const mask = (e: string) => { const [u, d] = e.split('@'); return `${u.slice(0, 2)}•••@${d}`; };

export async function GET(request: Request) {
  const r = await find(new URL(request.url).searchParams.get('token'));
  if (!r) return Response.json({ valid: false });
  const u = (await getUserByIdAdmin(r.user_id)).data?.[0];
  return Response.json({ valid: !!u, email: u ? mask(u.email) : null }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ ok: false, error: 'Invalid request.' }, { status: 400 }); }
  const r = await find(b.token);
  if (!r) return Response.json({ ok: false, error: 'This reset link has expired or was already used. Request a new one.' }, { status: 400 });
  const password = typeof b.password === 'string' ? b.password : '';
  const problem = passwordProblem(password);
  if (problem) return Response.json({ ok: false, error: problem }, { status: 400 });

  const { data, error } = await updateUserAdmin(r.user_id, { password_hash: await hashPasswordServer(password) });
  if (error || !data?.[0]) return Response.json({ ok: false, error: 'Couldn’t update your password. Please try again.' }, { status: 500 });
  // Use up this link and any others for the account
  await supabaseAdminFetch(`password_resets?user_id=eq.${encodeURIComponent(r.user_id)}&used_at=is.null`, { method: 'PATCH', body: JSON.stringify({ used_at: new Date().toISOString() }) });

  const user = dbUserToApp(data[0]);
  const res = Response.json({ ok: true, user: data[0].status === 'active' ? user : null, error: null });
  if (data[0].status === 'active') {
    const opts = sessionCookieOptions();
    res.headers.append('Set-Cookie', `${AUTH_COOKIE_NAME}=${encodeURIComponent(await createSessionToken(user.id))}; Path=${opts.path}; Max-Age=${opts.maxAge}; HttpOnly; Secure; SameSite=Lax`);
  }
  return res;
}
