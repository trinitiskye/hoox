// Client helpers for creating and changing tournaments, series, registrations
// and catch submissions. Each call goes to the HOOX server, which checks the
// signed-in person's permissions (src/lib/tournamentServer.ts). The public
// Supabase key can only read these tables.

import type { Tournament, Series, Registration, Submission } from '@/types';

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
  species?: string; fishTypes?: string[]; startDate?: string; endDate?: string; startTime?: string; endTime?: string;
  timezone?: string; entryFee?: number | string | null; registrationFee?: number | string | null;
  maxParticipants?: number | string | null; image?: string; status?: 'upcoming' | 'active' | 'completed';
}
export interface CatchInput { species: string; size: number; catchDate: string; catchTime: string; location?: string; photo?: string; image?: string }

export const createTournament = (t: TournamentInput) => call<Tournament>('/api/tournaments', 'POST', t, 'tournament');
export const updateTournament = (id: string, t: TournamentInput) => call<Tournament>(`/api/tournaments/${encodeURIComponent(id)}`, 'PATCH', t, 'tournament');
export const deleteTournament = (id: string) => call<{ ok: true }>(`/api/tournaments/${encodeURIComponent(id)}`, 'DELETE');

export const createSeries = (s: { name: string; description?: string; tournamentIds?: string[] }) => call<Series>('/api/series', 'POST', s, 'series');
export const updateSeries = (id: string, s: { name?: string; description?: string; tournamentIds?: string[] }) => call<Series>(`/api/series/${encodeURIComponent(id)}`, 'PATCH', s, 'series');
export const deleteSeries = (id: string) => call<{ ok: true }>(`/api/series/${encodeURIComponent(id)}`, 'DELETE');

/** Register the signed-in angler (or, for the tournament's director, `anglerId`) */
export const registerForTournament = (tournamentId: string, anglerId?: string) =>
  call<Registration>(`/api/tournaments/${encodeURIComponent(tournamentId)}/registrations`, 'POST', anglerId ? { anglerId } : {}, 'registration');
export const cancelRegistration = (id: string) => call<{ ok: true }>(`/api/registrations/${encodeURIComponent(id)}`, 'DELETE');

export const submitCatch = (tournamentId: string, c: CatchInput) => call<Submission>(`/api/tournaments/${encodeURIComponent(tournamentId)}/submissions`, 'POST', c, 'submission');
export const reviewCatch = (id: string, review: { status: 'approved' | 'denied' | 'pending'; species?: string; size?: number }) =>
  call<Submission>(`/api/submissions/${encodeURIComponent(id)}`, 'PATCH', review, 'submission');
export const deleteCatch = (id: string) => call<{ ok: true }>(`/api/submissions/${encodeURIComponent(id)}`, 'DELETE');
