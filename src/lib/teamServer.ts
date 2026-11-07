// SERVER-ONLY: teams, invites and "is this angler entered?" for tournaments.
//
// A team tournament entry is one registration (team_id set, angler_id = captain)
// plus rows in team_members:
//   captain   status 'accepted', role 'captain'
//   teammates invited by email → 'invited' → 'accepted' | 'declined'; or 'removed'
// An angler can be on one team per tournament. Invites close when the
// tournament starts (the director can still change rosters).

import { supabaseAdminFetch, getUserByEmailAdmin } from './supabaseAdmin';
import { todayIso } from './featured';
import { formatFromRow } from './tournamentFormat';
import { loadAffiliateSettings } from './affiliateServer';
import { sendEmail, appLink } from './email';
import { teamInviteEmail } from './emailTemplates';
import type { DbTournament, DbRegistration } from './supabase';
import type { User } from '@/types';

export interface DbTeam { id: string; tournament_id: string; name: string; captain_id: string; created_at: string }
export interface DbTeamMember {
  id: string; team_id: string; tournament_id: string; user_id: string | null; email: string; name: string | null;
  role: 'captain' | 'member'; status: 'invited' | 'accepted' | 'declined' | 'removed';
  invited_by: string | null; invited_at: string; responded_at: string | null;
}
export type DbReg = DbRegistration & { angler_id: string | null; team_id: string | null; side_pots: string[] | null; side_pot_fees: number | null };

const eq = (v: string) => `eq.${encodeURIComponent(v)}`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isEmail = (e: string) => EMAIL_RE.test(e);

export const getTeam = async (id: string) => (await supabaseAdminFetch<DbTeam[]>(`teams?id=${eq(id)}&select=*`)).data?.[0] ?? null;
export const getMember = async (id: string) => (await supabaseAdminFetch<DbTeamMember[]>(`team_members?id=${eq(id)}&select=*`)).data?.[0] ?? null;
export const membersOf = async (teamId: string) => (await supabaseAdminFetch<DbTeamMember[]>(`team_members?team_id=${eq(teamId)}&select=*&order=invited_at.asc`)).data ?? [];
export const membersForTournament = async (tid: string) => (await supabaseAdminFetch<DbTeamMember[]>(`team_members?tournament_id=${eq(tid)}&select=*&limit=20000`)).data ?? [];
export const teamsForTournament = async (tid: string) => (await supabaseAdminFetch<DbTeam[]>(`teams?tournament_id=${eq(tid)}&select=*&limit=10000`)).data ?? [];
export const registrationForTeam = async (teamId: string) => (await supabaseAdminFetch<DbReg[]>(`registrations?team_id=${eq(teamId)}&select=*`)).data?.[0] ?? null;

/** Pending invites addressed to this email, across tournaments */
export const invitesForEmail = async (email: string) =>
  (await supabaseAdminFetch<DbTeamMember[]>(`team_members?email=${eq(email.toLowerCase())}&status=eq.invited&select=*&order=invited_at.desc`)).data ?? [];

/** The registration that a signed-in angler competes under, if any (their own, or their team's) */
export async function entryFor(t: DbTournament, userId: string, regs: DbReg[]): Promise<{ reg: DbReg; teamId: string | null } | null> {
  const own = regs.find((r) => r.angler_id === userId && !r.team_id);
  if (own) return { reg: own, teamId: null };
  const { data } = await supabaseAdminFetch<DbTeamMember[]>(`team_members?tournament_id=${eq(t.id)}&user_id=${eq(userId)}&status=eq.accepted&select=team_id`);
  const teamId = data?.[0]?.team_id;
  const reg = teamId ? regs.find((r) => r.team_id === teamId) : undefined;
  return reg ? { reg, teamId: teamId! } : null;
}

export const startedOrOver = (t: DbTournament) => t.start_date <= todayIso() || t.status === 'completed';

/** Invite one email to a team. Returns the member row or an error message. */
export async function inviteToTeam(t: DbTournament, team: DbTeam, emailRaw: string, by: User, direct = false): Promise<{ member: DbTeamMember | null; error: string | null }> {
  const email = emailRaw.trim().toLowerCase();
  if (!isEmail(email)) return { member: null, error: `“${emailRaw}” isn’t a valid email.` };
  if (email === by.email.toLowerCase() && !direct) return { member: null, error: 'You’re already on the team.' };
  const f = formatFromRow(t);
  const roster = (await membersOf(team.id)).filter((m) => m.status === 'accepted' || m.status === 'invited');
  if (roster.some((m) => m.email === email)) return { member: null, error: `${email} is already on or invited to this team.` };
  if (roster.length >= f.teamMax) return { member: null, error: `Teams can have up to ${f.teamMax} anglers.` };

  const { data: users } = await getUserByEmailAdmin(email);
  const u = users?.[0];
  if (u && u.role !== 'angler') return { member: null, error: `${email} isn’t an angler account.` };
  if (u) {
    const { data: other } = await supabaseAdminFetch<DbTeamMember[]>(`team_members?tournament_id=${eq(t.id)}&user_id=${eq(u.id)}&status=eq.accepted&select=id`);
    if (other?.length) return { member: null, error: `${u.name} is already on a team in this tournament.` };
    const { data: solo } = await supabaseAdminFetch<DbReg[]>(`registrations?tournament_id=${eq(t.id)}&angler_id=${eq(u.id)}&team_id=is.null&select=id`);
    if (solo?.length) return { member: null, error: `${u.name} is already registered in this tournament.` };
  }
  if (direct && !u) return { member: null, error: `${email} doesn’t have a HOOX account yet. Send an invite instead.` };

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdminFetch<DbTeamMember[]>('team_members', {
    method: 'POST',
    body: JSON.stringify({
      team_id: team.id, tournament_id: t.id, email, user_id: direct ? u!.id : null, name: u ? u.profile_display_name || u.display_name || u.name : null,
      role: 'member', status: direct ? 'accepted' : 'invited', invited_by: by.id, invited_at: now, responded_at: direct ? now : null,
    }),
  });
  if (error || !data?.[0]) return { member: null, error: /team_members_one_team_idx|duplicate/i.test(error || '') ? 'That angler is already on a team in this tournament.' : 'Couldn’t save the invite.' };
  if (direct) await syncTeamFee(t, team.id);
  // Email the teammate (direct adds are already on the team, so no email)
  if (!direct) {
    await sendEmail({
      to: email, kind: 'team_invite', relatedId: t.id, replyTo: by.email,
      ...teamInviteEmail({ team: team.name, tournament: t.name, captain: by.profileDisplayName || by.displayName || by.name, link: appLink(u ? '/login' : '/register/angler'), hasAccount: !!u }),
    });
  }
  return { member: data[0], error: null };
}

/** Per-angler fees: the team's fee follows its roster size */
export async function syncTeamFee(t: DbTournament, teamId: string) {
  const f = formatFromRow(t);
  if (f.feeBasis !== 'per_angler') return;
  const reg = await registrationForTeam(teamId);
  if (!reg) return;
  const anglers = (await membersOf(teamId)).filter((m) => m.status === 'accepted').length || 1;
  const { settings } = await loadAffiliateSettings();
  const per = Number(t.entry_fee ?? t.registration_fee ?? 0) || 0;
  const cut = Math.min(per, settings.fallbackFee);
  await supabaseAdminFetch(`registrations?id=${eq(reg.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ fee: Math.round(per * anglers * 100) / 100, app_owner_cut: Math.round(cut * anglers * 100) / 100, director_receives: Math.round((per - cut) * anglers * 100) / 100 }),
  });
}
