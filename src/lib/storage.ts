// src/lib/storage.ts
// Data access layer: public reads straight from Supabase (read-only key).
// Writes go through the HOOX server: see src/lib/tournamentApi.ts.

import {
  getTournaments,
  getUsers,
  getRegistrations,
  getSubmissions,
  getSeries,
  dbTournamentToApp,
  dbUserToApp,
  dbRegistrationToApp,
  dbSubmissionToApp,
  dbSeriesToApp,
} from './supabase';

import type { Tournament, User, Registration, Submission, Series } from '@/types';

export async function fetchTournaments(): Promise<Tournament[]> {
  const { data, error } = await getTournaments();
  if (error || !data) { console.error('fetchTournaments:', error); return []; }
  return data.map(dbTournamentToApp);
}

/** Admin pages: full user records (email, phone …) through the admin API */
export async function fetchUsersForAdmin(): Promise<User[]> {
  try {
    const res = await fetch('/api/admin/users', { cache: 'no-store' });
    const j = await res.json();
    if (!res.ok || j.error) { console.error('fetchUsersForAdmin:', j.error); return []; }
    return j.users as User[];
  } catch (e) { console.error('fetchUsersForAdmin:', e); return []; }
}

/** Public pages: users without private fields */
export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await getUsers();
  if (error || !data) { console.error('fetchUsers:', error); return []; }
  return data.map(dbUserToApp);
}

// Creating, editing and deleting users happens on the server only:
// sign-up → /api/auth/register, admin edits → /api/admin/users/[id].

export async function fetchRegistrations(): Promise<Registration[]> {
  const { data, error } = await getRegistrations();
  if (error || !data) { console.error('fetchRegistrations:', error); return []; }
  return data.map(dbRegistrationToApp);
}

export async function fetchSubmissions(): Promise<Submission[]> {
  const { data, error } = await getSubmissions();
  if (error || !data) { console.error('fetchSubmissions:', error); return []; }
  return data.map(dbSubmissionToApp);
}

export async function fetchSeries(): Promise<Series[]> {
  const { data, error } = await getSeries();
  if (error || !data) { console.error('fetchSeries:', error); return []; }
  return data.map(dbSeriesToApp);
}

