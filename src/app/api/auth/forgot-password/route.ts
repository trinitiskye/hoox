// POST { email } → emails a one-time reset link (1 hour) if an account uses
// that email. Always answers the same way, so it can't be used to find out
// which emails have accounts. At most 3 links per account per hour.

export const runtime = 'edge';

import { getUserByEmailAdmin, supabaseAdminFetch } from '@/lib/supabaseAdmin';
import { sendEmail, appLink } from '@/lib/email';
import { passwordResetEmail } from '@/lib/emailTemplates';
import { sha256, randomToken } from '@/lib/supportServer';

const OK = () => Response.json({ ok: true, error: null });

export async function POST(request: Request) {
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ ok: false, error: 'Invalid request.' }, { status: 400 }); }
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase().slice(0, 254) : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return Response.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });

  const user = (await getUserByEmailAdmin(email)).data?.[0];
  if (!user || user.status === 'banned' || user.status === 'inactive') return OK();

  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { data: recent } = await supabaseAdminFetch<{ id: string }[]>(`password_resets?user_id=eq.${encodeURIComponent(user.id)}&created_at=gt.${encodeURIComponent(hourAgo)}&select=id`);
  if ((recent?.length ?? 0) >= 3) return OK();

  const token = randomToken();
  const { error } = await supabaseAdminFetch('password_resets', {
    method: 'POST',
    body: JSON.stringify({ user_id: user.id, token_hash: await sha256(token), expires_at: new Date(Date.now() + 3600_000).toISOString() }),
  });
  if (error) return Response.json({ ok: false, error: /password_resets|relation/i.test(error) ? 'Password reset isn’t set up yet (run the email migration).' : 'Something went wrong. Please try again.' }, { status: 500 });
  await sendEmail({ to: user.email, kind: 'password_reset', relatedId: user.id, ...passwordResetEmail(user.name, appLink(`/reset-password?token=${token}`)) });
  return OK();
}
