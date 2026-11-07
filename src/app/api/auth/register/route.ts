// POST /api/auth/register — create a HOOX account on the server.
//
// Replaces the old browser-side sign-up, which wrote straight to the users
// table with the public key and hashed the password in the browser.
//
//   { role: 'angler' | 'director' | 'judge' | 'partner', name, email, password,
//     organization?, address?, city?, state?, zip?, country?, phone?, website?,
//     message? (partner), directorEmail? (judge) }
//
// → { user, error, outcome?, directorName? }
// Accounts that are active right away are signed in (hoox_auth cookie).
// Judges wait for their director when the director exists; partners wait for HOOX.

export const runtime = 'edge';

import { claimJudgeInvites } from '@/lib/judgeServer';
import { getUserByEmailAdmin, createUserAdmin, supabaseAdminFetch } from '@/lib/supabaseAdmin';
import { dbUserToApp, type DbUserInsert } from '@/lib/supabase';
import { createSessionToken, sessionCookieOptions, AUTH_COOKIE_NAME } from '@/lib/serverSession';
import { hashPasswordServer, passwordProblem } from '@/lib/passwordServer';
import { creditReferral, clearRefCookie } from '@/lib/affiliateServer';

const ROLES = { angler: 'angler', director: 'director', judge: 'judge', partner: 'sponsor' } as const;
type SignupRole = keyof typeof ROLES;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const fail = (error: string, status = 400) => Response.json({ user: null, error }, { status });

async function hasJudgeInvite(email: string) {
  const { data } = await supabaseAdminFetch<{ id: string }[]>(`tournament_judges?email=eq.${encodeURIComponent(email)}&status=eq.invited&select=id`);
  return !!data?.length;
}

export async function POST(request: Request) {
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return fail('Invalid request.'); }
  const s = (k: string, max: number) => (typeof b[k] === 'string' ? (b[k] as string).trim().slice(0, max) : '');

  const role = s('role', 20) as SignupRole;
  if (!(role in ROLES)) return fail('Choose an account type.');
  const name = s('name', 120);
  const email = s('email', 254).toLowerCase();
  const password = typeof b.password === 'string' ? b.password : '';
  if (!name) return fail('Enter your name.');
  if (!EMAIL_RE.test(email)) return fail('Enter a valid email address.');
  const pwErr = passwordProblem(password);
  if (pwErr) return fail(pwErr);

  const { data: existing, error: lookupErr } = await getUserByEmailAdmin(email);
  if (lookupErr) return fail('Connection error. Please try again.', 502);
  if (existing && existing.length > 0) return fail('An account with this email already exists.', 409);

  // Judges: pending until their director approves, if the director has a HOOX account
  let status: DbUserInsert['status'] = role === 'partner' ? 'pending' : 'active';
  let directorName: string | undefined;
  let directorEmail = '';
  // Judges invited from a tournament (tournament_judges) are approved already
  const invited = role === 'judge' ? await hasJudgeInvite(email) : false;
  if (role === 'judge') {
    directorEmail = s('directorEmail', 254).toLowerCase();
    if (!EMAIL_RE.test(directorEmail) && !invited) return fail('Enter your tournament director’s email.');
    if (!EMAIL_RE.test(directorEmail)) directorEmail = '';
    const { data: dir } = directorEmail ? await getUserByEmailAdmin(directorEmail) : { data: null };
    if (dir?.[0]?.role === 'director') { directorName = dir[0].name; if (!invited) status = 'pending'; }
  }

  let password_hash: string;
  try { password_hash = await hashPasswordServer(password); }
  catch (e) { return fail((e as Error).message, 500); }

  const { data: created, error } = await createUserAdmin({
    name, email, password_hash, role: ROLES[role], status,
    organization: s('organization', 160) || null,
    address: s('address', 200) || null,
    city: s('city', 100) || null,
    state: s('state', 100) || null,
    zip: s('zip', 20) || null,
    phone: s('phone', 40) || null,
    website: role === 'director' || role === 'partner' ? s('website', 300) || null : null,
    avatar: null,
    // Judges: the director's email (so the director can find their judges). Partners: their message.
    message: role === 'judge' ? directorEmail : role === 'partner' ? s('message', 2000) || null : null,
    banner_image: null, banner_start_date: null, banner_end_date: null,
    country: s('country', 100) || null,
  });
  if (error || !created?.[0]) {
    return fail(/duplicate|unique/i.test(error || '') ? 'An account with this email already exists.' : 'Registration failed. Please try again.', 500);
  }

  const dbUser = created[0];
  if (invited) await claimJudgeInvites(dbUser.id, email).catch(() => 0);
  const user = dbUserToApp(dbUser);
  const credited = role === 'director' ? (await creditReferral(request, dbUser.id).catch(() => ({ credited: false }))).credited : false;

  const outcome = role === 'judge' ? (invited ? 'invite_accepted' : status === 'pending' ? 'pending_approval' : 'invite_sent') : undefined;
  const response = Response.json({ user, error: null, outcome, directorName });
  if (credited) response.headers.append('Set-Cookie', clearRefCookie);
  if (status === 'active') {
    const token = await createSessionToken(user.id);
    const opts = sessionCookieOptions();
    response.headers.append('Set-Cookie', `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=${opts.path}; Max-Age=${opts.maxAge}; HttpOnly; Secure; SameSite=Lax`);
  }
  return response;
}
