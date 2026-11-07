// SERVER-ONLY: judges assigned to tournaments (public.tournament_judges).
//
// A director (or admin) picks an existing judge account, or invites someone
// by email. Invited judges are linked when they create their judge account
// with that email (see /api/auth/register). Assigned judges can review the
// tournament's catches (canReview in tournamentServer.ts).

import { supabaseAdminFetch, getUserByEmailAdmin } from './supabaseAdmin';
import type { DbUser } from './supabase';

export interface DbTournamentJudge {
  id: string; tournament_id: string; user_id: string | null; email: string; name: string | null;
  status: 'invited' | 'assigned'; invited_by: string | null; invited_at: string; accepted_at: string | null;
}

const eq = (v: string) => `eq.${encodeURIComponent(v)}`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const judgesFor = async (tid: string) =>
  (await supabaseAdminFetch<DbTournamentJudge[]>(`tournament_judges?tournament_id=${eq(tid)}&select=*&order=invited_at.asc`)).data ?? [];

export async function isTournamentJudge(tid: string, userId: string) {
  const { data } = await supabaseAdminFetch<DbTournamentJudge[]>(`tournament_judges?tournament_id=${eq(tid)}&user_id=${eq(userId)}&status=eq.assigned&select=id`);
  return !!data?.length;
}

/** Active judge accounts, for the picker */
export async function judgeAccounts() {
  const { data } = await supabaseAdminFetch<DbUser[]>('users?role=eq.judge&status=eq.active&select=*&order=name.asc&limit=2000');
  return data ?? [];
}

const displayName = (u: DbUser) => u.profile_display_name || u.display_name || u.name;

/** Add a judge by account id or by email (+ name for invites) */
export async function addJudge(tid: string, input: { userId?: string; email?: string; name?: string }, by: string): Promise<{ judge: DbTournamentJudge | null; error: string | null; invited?: boolean }> {
  let user: DbUser | undefined;
  let email = (input.email || '').trim().toLowerCase();
  if (input.userId) {
    const { data } = await supabaseAdminFetch<DbUser[]>(`users?id=${eq(input.userId)}&select=*`);
    user = data?.[0];
    if (!user) return { judge: null, error: 'That judge account wasn’t found.' };
    email = user.email.toLowerCase();
  } else {
    if (!EMAIL_RE.test(email)) return { judge: null, error: 'Enter a valid email for the judge.' };
    user = (await getUserByEmailAdmin(email)).data?.[0];
  }
  if (user && user.role !== 'judge') return { judge: null, error: `${email} is a ${user.role === 'sponsor' ? 'partner' : user.role} account, not a judge. Use a different email.` };
  if (user && user.status !== 'active') return { judge: null, error: `${displayName(user)}’s judge account isn’t active yet. Approve it in User Management first.` };

  const existing = (await judgesFor(tid)).find((j) => j.email.toLowerCase() === email);
  if (existing) return { judge: null, error: `${existing.name || email} is already a judge for this tournament.` };

  const now = new Date().toISOString();
  const name = user ? displayName(user) : (input.name || '').trim().slice(0, 120) || null;
  if (!user && !name) return { judge: null, error: 'Enter the judge’s name.' };
  const { data, error } = await supabaseAdminFetch<DbTournamentJudge[]>('tournament_judges', {
    method: 'POST',
    body: JSON.stringify({
      tournament_id: tid, user_id: user?.id ?? null, email, name,
      status: user ? 'assigned' : 'invited', invited_by: by, invited_at: now, accepted_at: user ? now : null,
    }),
  });
  if (error || !data?.[0]) return { judge: null, error: /duplicate|unique/i.test(error || '') ? 'That judge is already on this tournament.' : 'Couldn’t add the judge.' };
  return { judge: data[0], error: null, invited: !user };
}

export const removeJudge = (tid: string, id: string) =>
  supabaseAdminFetch(`tournament_judges?id=${eq(id)}&tournament_id=${eq(tid)}`, { method: 'DELETE' });

/** On judge sign-up: link any tournament invites sent to this email. Returns how many. */
export async function claimJudgeInvites(userId: string, email: string) {
  const { data } = await supabaseAdminFetch<DbTournamentJudge[]>(`tournament_judges?email=${eq(email.toLowerCase())}&status=eq.invited&select=id`);
  if (!data?.length) return 0;
  await supabaseAdminFetch(`tournament_judges?email=${eq(email.toLowerCase())}&status=eq.invited`, {
    method: 'PATCH', body: JSON.stringify({ user_id: userId, status: 'assigned', accepted_at: new Date().toISOString() }),
  });
  return data.length;
}

/** Link a new judge uses to create their account (the invite id is the token) */
export const judgeInviteLink = (origin: string, inviteId: string) => `${origin}/register/judge?invite=${encodeURIComponent(inviteId)}`;

export const getJudgeInvite = async (id: string) =>
  (await supabaseAdminFetch<DbTournamentJudge[]>(`tournament_judges?id=${eq(id)}&select=*`)).data?.[0] ?? null;
