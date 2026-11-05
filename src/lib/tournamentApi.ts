// Client helpers for creating and changing tournaments, series, registrations
// and catch submissions. Each call goes to the HOOX server, which checks the
// signed-in person's permissions (src/lib/tournamentServer.ts). The public
// Supabase key can only read these tables.

import type { Tournament, Series, Registration, Submission } from '@/types';
import type { PlacePrize, SidePot } from './tournamentFormat';
import type { Scoreboard } from './scoring';

type Result<T> = { data: T | null; error: string | null };

async function call<T>(url: string, method: string, body?: unknown, key?: string): Promise<Result<T>> {
  try {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || j.error) return { data: null, error: typeof j.error === 'string' ? j.error : `Request failed (${res.status})` };
    return { data: (key ? j[key] : j) as T, error: null };
  } catch {
    return { data: null, error: 'Connection error. Please try again.' };
  }
}

export interface TournamentInput {
  name?: string; description?: string; location?: string; city?: string; state?: string;
  species?: string; fishTypes?: string[]; vesselTypes?: ('Kayak' | 'Powerboat')[]; startDate?: string; endDate?: string; startTime?: string; endTime?: string;
  timezone?: string; entryFee?: number | string | null; registrationFee?: number | string | null;
  maxParticipants?: number | string | null; image?: string; status?: 'upcoming' | 'active' | 'completed';
  // Format (src/lib/tournamentFormat.ts)
  entryType?: 'individual' | 'team'; teamMin?: number; teamMax?: number; feeBasis?: 'per_entry' | 'per_angler';
  scoring?: 'weight' | 'length' | 'both'; primaryMeasure?: 'weight' | 'length'; fishLimit?: number | null;
  placePrizes?: PlacePrize[]; sidePots?: Partial<SidePot>[];
}
export interface CatchInput { species: string; weight?: number; length?: number; catchDate: string; catchTime: string; location?: string; photo?: string; image?: string }

export const createTournament = (t: TournamentInput) => call<Tournament>('/api/tournaments', 'POST', t, 'tournament');
export const updateTournament = (id: string, t: TournamentInput) => call<Tournament>(`/api/tournaments/${encodeURIComponent(id)}`, 'PATCH', t, 'tournament');
export const deleteTournament = (id: string) => call<{ ok: true }>(`/api/tournaments/${encodeURIComponent(id)}`, 'DELETE');

export const createSeries = (s: { name: string; description?: string; tournamentIds?: string[]; vesselTypes?: string[] }) => call<Series>('/api/series', 'POST', s, 'series');
export const updateSeries = (id: string, s: { name?: string; description?: string; tournamentIds?: string[]; vesselTypes?: string[] }) => call<Series>(`/api/series/${encodeURIComponent(id)}`, 'PATCH', s, 'series');
export const deleteSeries = (id: string) => call<{ ok: true }>(`/api/series/${encodeURIComponent(id)}`, 'DELETE');

export interface EntryInput { sidePots?: string[]; teamName?: string; invites?: string[]; anglerId?: string }
export interface EntryResult { registration: Registration; team?: { id: string; name: string }; invites?: { email: string; ok: boolean; error: string | null }[]; sidePots: string[]; cost: { main: number; pots: number } }
/** Enter the signed-in angler, or start a team as its captain (team tournaments) */
export const registerForTournament = (tournamentId: string, entry: EntryInput = {}) =>
  call<EntryResult>(`/api/tournaments/${encodeURIComponent(tournamentId)}/registrations`, 'POST', entry);
export const updateEntry = (registrationId: string, patch: { sidePots?: string[]; teamName?: string }) =>
  call<{ registration: Registration; sidePots: string[] }>(`/api/registrations/${encodeURIComponent(registrationId)}`, 'PATCH', patch);

/* Teams */
export const getTeam = (teamId: string) => call<{ team: { id: string; name: string; captainId: string; tournamentId: string; registrationId: string | null; sidePots: string[] }; limits: { min: number; max: number } | null; members: { id: string; name: string | null; role: string; status: string; email?: string }[] }>(`/api/teams/${encodeURIComponent(teamId)}`, 'GET');
export const inviteTeammate = (teamId: string, email: string, direct = false) => call<{ member: { id: string; email: string; status: string } }>(`/api/teams/${encodeURIComponent(teamId)}/members`, 'POST', { email, direct });
export const answerInvite = (memberId: string, action: 'accept' | 'decline') => call<{ status: string }>(`/api/team-members/${encodeURIComponent(memberId)}`, 'PATCH', { action });
export const removeTeammate = (memberId: string) => call<{ ok: true }>(`/api/team-members/${encodeURIComponent(memberId)}`, 'DELETE');
export const myTeamInvites = () => call<{ id: string; team: string; invitedBy: string; tournament: { id: string; name: string; startDate: string; endDate: string } | null }[]>('/api/me/team-invites', 'GET', undefined, 'invites');

/* Standings & entries */
export const getLeaderboard = (tournamentId: string) => call<Scoreboard & { format: Record<string, unknown> }>(`/api/tournaments/${encodeURIComponent(tournamentId)}/leaderboard`, 'GET');
export const getEntries = (tournamentId: string) => call<Record<string, unknown>>(`/api/tournaments/${encodeURIComponent(tournamentId)}/entries`, 'GET');
export const cancelRegistration = (id: string) => call<{ ok: true }>(`/api/registrations/${encodeURIComponent(id)}`, 'DELETE');

export const submitCatch = (tournamentId: string, c: CatchInput) => call<Submission>(`/api/tournaments/${encodeURIComponent(tournamentId)}/submissions`, 'POST', c, 'submission');
export const reviewCatch = (id: string, review: { status?: 'approved' | 'denied' | 'pending'; species?: string; weight?: number; length?: number }) =>
  call<Submission>(`/api/submissions/${encodeURIComponent(id)}`, 'PATCH', review, 'submission');
export const deleteCatch = (id: string) => call<{ ok: true }>(`/api/submissions/${encodeURIComponent(id)}`, 'DELETE');
