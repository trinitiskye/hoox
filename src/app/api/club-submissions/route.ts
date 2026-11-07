// src/app/api/club-submissions/route.ts
// Endpoint behind /clubs/submit. Only Anglers and Tournament Directors
// (and admins) can list a club, so every request must identify an account:
//
//   • a valid signed session cookie (already signed in), or
//   • email + password in the form, verified here like /api/auth/login.
//     If no account uses that email, we answer code "not_found" WITHOUT
//     saving anything; the page asks whether to create one. The page then
//     re-sends the same form with createAccount=true + role + name, and we
//     create the account with those credentials.
//
// The club fields and images are validated BEFORE any account is created,
// so a bad form never leaves behind a half-made account. On success the
// signed session cookie is set, so the person is signed in.

export const runtime = 'edge';

import { notifyAdmins, appLink } from '@/lib/email';
import { adminAlertEmail } from '@/lib/emailTemplates';

import {
  getUserByEmailAdmin,
  createUserAdmin,
  createClubSubmissionAdmin,
  uploadPublicImageAdmin,
  deletePublicImageAdmin,
  CLUB_SUBMISSION_BUCKET,
} from '@/lib/supabaseAdmin';
import { dbUserToApp, type DbUser } from '@/lib/supabase';
import { hashPasswordServer, checkPasswordServer } from '@/lib/passwordServer';
import { updateUserAdmin } from '@/lib/supabaseAdmin';
import {
  getAuthenticatedUser,
  createSessionToken,
  sessionCookieOptions,
  AUTH_COOKIE_NAME,
} from '@/lib/serverSession';
import {
  parseClubFields,
  readImageSize,
  isEmail,
  IMAGE_TYPES,
  CLUB_SUBMIT_ROLES,
  CLUB_SIGNUP_ROLES,
  CLUB_LOGO_MAX_BYTES,
  CLUB_COVER_MAX_BYTES,
  CLUB_COVER_MIN_WIDTH,
  PASSWORD_MIN,
} from '@/lib/clubSubmission';
import type { User } from '@/types';

const MAX_REQUEST_BYTES = 8 * 1024 * 1024;
const ROLE_LABEL: Record<string, string> = {
  angler: 'Angler', director: 'Tournament Director', admin: 'Admin', judge: 'Judge', sponsor: 'Partner',
};

function fail(error: string, code: string, status = 400) {
  return Response.json({ ok: false, user: null, error, code }, { status });
}

type Img = { buf: ArrayBuffer; type: string; ext: string } | null;

async function checkImage(
  form: FormData, field: string, label: string, maxBytes: number, minWidth?: number
): Promise<{ img: Img; error: string | null }> {
  const f = form.get(field);
  if (!f || typeof f === 'string' || f.size === 0) return { img: null, error: null };
  const ext = IMAGE_TYPES[f.type];
  if (!ext) return { img: null, error: `${label} must be a JPG, PNG, or WebP image.` };
  if (f.size > maxBytes) return { img: null, error: `${label} must be ${maxBytes / 1024 / 1024} MB or smaller.` };
  const buf = await f.arrayBuffer();
  const size = readImageSize(buf);
  if (!size) return { img: null, error: `${label} couldn’t be read. Try exporting it again as JPG or PNG.` };
  if (minWidth) {
    if (size.width < minWidth) return { img: null, error: `${label} must be at least ${minWidth} px wide (yours is ${size.width}).` };
    if (size.width < size.height) return { img: null, error: `${label} must be landscape (wider than it is tall).` };
  }
  return { img: { buf, type: f.type, ext }, error: null };
}

/** Same account-status checks as /api/auth/login. */
function statusProblem(u: DbUser) {
  if (u.status === 'paused') return fail('This account is paused. Please contact support.', 'account_paused', 403);
  if (u.status === 'banned' || u.status === 'inactive') return fail('This account is no longer active.', 'account_banned', 403);
  if (u.status === 'pending') return fail('Your account is pending approval. You will receive an email when approved.', 'account_pending', 403);
  return null;
}

function roleProblem(role: string) {
  if ((CLUB_SUBMIT_ROLES as readonly string[]).includes(role)) return null;
  return fail(
    `Club listings need an Angler or Tournament Director account. This email is registered as a ${ROLE_LABEL[role] || role} account.`,
    'role_not_allowed',
    403,
  );
}

export async function POST(request: Request) {
  try {
    return await handle(request);
  } catch {
    return fail('Something went wrong on our end. Please try again in a moment.', 'unknown', 500);
  }
}

async function handle(request: Request) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_REQUEST_BYTES) return fail('Upload is too large. Keep images under 5 MB.', 'invalid', 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail('Invalid submission.', 'invalid');
  }
  const get = (k: string) => {
    const v = form.get(k);
    return typeof v === 'string' ? v : '';
  };
  const getAll = (k: string) => form.getAll(k).filter((v): v is string => typeof v === 'string');

  // Honeypot
  if (get('website_url').trim()) return Response.json({ ok: true, user: null, error: null });

  // 1) Validate the club and images first — nothing is created if these fail.
  const { value: club, error: invalid } = parseClubFields(get, getAll);
  if (invalid || !club) return fail(invalid || 'Invalid submission.', 'invalid');
  const logo = await checkImage(form, 'logo', 'Logo', CLUB_LOGO_MAX_BYTES);
  if (logo.error) return fail(logo.error, 'invalid');
  const cover = await checkImage(form, 'coverImage', 'Cover photo', CLUB_COVER_MAX_BYTES, CLUB_COVER_MIN_WIDTH);
  if (cover.error) return fail(cover.error, 'invalid');

  // 2) Work out who is submitting.
  const email = get('email').toLowerCase().trim();
  const password = get('password');
  let user: User | null = null;
  let created = false;
  let setCookie = false;

  if (!email) {
    user = await getAuthenticatedUser(request);
    if (!user) return fail('Please sign in, or enter your email and password.', 'auth_required', 401);
    const rp = roleProblem(user.role);
    if (rp) return rp;
  } else {
    if (!isEmail(email)) return fail('Enter a valid email address.', 'invalid_credentials');
    if (!password) return fail('Enter your password.', 'invalid_credentials');

    const { data, error } = await getUserByEmailAdmin(email);
    if (error) return fail('Connection error. Please try again.', 'connection_error', 502);
    let dbUser = data?.[0];

    if (!dbUser) {
      if (get('createAccount') !== 'true') {
        // Ask the person first; nothing has been saved.
        return fail('No HOOX account uses this email yet.', 'not_found', 200);
      }
      const role = get('accountRole');
      const name = get('accountName').trim();
      if (!(CLUB_SIGNUP_ROLES as readonly string[]).includes(role)) return fail('Choose Angler or Tournament Director.', 'invalid');
      if (!name || name.length > 120) return fail('Enter your full name (120 characters or fewer).', 'invalid');
      if (password.length < PASSWORD_MIN) return fail(`Password must be at least ${PASSWORD_MIN} characters.`, 'invalid');

      const res = await createUserAdmin({
        name,
        email,
        password_hash: await hashPasswordServer(password),
        role: role as 'angler' | 'director',
        status: 'active',
        organization: null,
        address: null,
        city: null,
        state: null,
        zip: null,
        phone: null,
        website: null,
        avatar: null,
        message: null,
        banner_image: null,
        banner_start_date: null,
        banner_end_date: null,
        country: null,
      });
      if (res.error || !res.data?.[0]) return fail('We couldn’t create your account. Please try again.', 'unknown', 502);
      dbUser = res.data[0];
      created = true;
    } else {
      const check = await checkPasswordServer(password, dbUser.password_hash).catch(() => ({ ok: false, upgrade: null }));
      if (!check.ok) return fail('Incorrect password for this email.', 'wrong_password', 401);
      if (check.upgrade) await updateUserAdmin(dbUser.id, { password_hash: check.upgrade }).catch(() => null);
    }

    const sp = statusProblem(dbUser);
    if (sp) return sp;
    const rp = roleProblem(dbUser.role);
    if (rp) return rp;
    user = dbUserToApp(dbUser);
    setCookie = true;
  }

  // 3) Upload images and save the request.
  const folder = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}`;
  const uploaded: string[] = [];
  const cleanup = () => Promise.all(uploaded.map((u) => deletePublicImageAdmin(CLUB_SUBMISSION_BUCKET, u)));

  for (const [key, img] of [['logo', logo.img], ['cover', cover.img]] as const) {
    if (!img) continue;
    const { url, error } = await uploadPublicImageAdmin(CLUB_SUBMISSION_BUCKET, `${folder}/${key}.${img.ext}`, img.buf, img.type);
    if (error || !url) {
      await cleanup();
      return fail('We couldn’t upload your images. Please try again.', 'unknown', 500);
    }
    uploaded.push(url);
    if (key === 'logo') club.logo_url = url;
    else club.cover_image_url = url;
  }

  const { error: dbErr } = await createClubSubmissionAdmin({
    ...club,
    contact_email: club.contact_email || user.email,
    submitted_by: user.id,
    submitter_name: user.name,
    submitter_email: user.email,
    submitter_role: user.role,
  });
  if (dbErr) {
    await cleanup();
    // The account (if just created) is kept so they can simply sign in and retry.
    return fail('We couldn’t save your club. Please try again in a moment.', 'unknown', 500);
  }

  await notifyAdmins({ kind: 'admin_alert', replyTo: user.email, ...adminAlertEmail({ subject: `New club submission: ${club.club_name}`, heading: 'New club submission', lines: [`${club.club_name} (${club.city}, ${club.state}), submitted by ${user.name} (${user.email}).`, 'Review it in Event Management → Clubs.'], link: appLink('/admin/clubs') }) });
  const response = Response.json({ ok: true, user, created, error: null, code: null });
  if (setCookie) {
    const token = await createSessionToken(user.id);
    const opts = sessionCookieOptions();
    response.headers.append(
      'Set-Cookie',
      `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=${opts.path}; Max-Age=${opts.maxAge}; HttpOnly; Secure; SameSite=Lax`,
    );
  }
  return response;
}
