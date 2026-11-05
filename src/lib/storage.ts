// src/lib/storage.ts
// Data access layer - replaces localStorage with Supabase
// All reads/writes go through Supabase REST API

import {
  getTournaments,
  getUsers,
  getRegistrations,
  getSubmissions,
  getSeries,
  createTournament,
  createRegistration,
  createSubmission,
  createSeries,
  updateTournament,
  updateSubmission,
  deleteTournament,
  deleteRegistration,
  deleteSubmission,
  deleteSeries,
  dbTournamentToApp,
  dbUserToApp,
  dbRegistrationToApp,
  dbSubmissionToApp,
  dbSeriesToApp,
  appTournamentToDb,
} from './supabase';

import type { Tournament, User, Registration, Submission, Series } from '@/types';

export async function fetchTournaments(): Promise<Tournament[]> {
  const { data, error } = await getTournaments();
  if (error || !data) { console.error('fetchTournaments:', error); return []; }
  return data.map(dbTournamentToApp);
}

export async function saveTournament(t: Tournament): Promise<Tournament | null> {
  const db = appTournamentToDb(t);
  const { data, error } = await createTournament(db as any);
  if (error || !data?.[0]) { console.error('saveTournament:', error); return null; }
  return dbTournamentToApp(data[0]);
}

export async function editTournament(id: string, updates: Partial<Tournament>): Promise<Tournament | null> {
  const db = appTournamentToDb(updates);
  const { data, error } = await updateTournament(id, db as any);
  if (error || !data?.[0]) { console.error('editTournament:', error); return null; }
  return dbTournamentToApp(data[0]);
}

export async function removeTournament(id: string): Promise<boolean> {
  const { error } = await deleteTournament(id);
  if (error) { console.error('removeTournament:', error); return false; }
  return true;
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

export async function saveRegistration(r: Omit<Registration, 'id' | 'registeredAt'>): Promise<Registration | null> {
  const { data, error } = await createRegistration({
    tournament_id: r.tournamentId, angler: r.angler, fee: r.fee ?? null,
    app_owner_cut: r.appOwnerCut ?? null, director_receives: r.directorReceives ?? null,
  });
  if (error || !data?.[0]) { console.error('saveRegistration:', error); return null; }
  return dbRegistrationToApp(data[0]);
}

export async function removeRegistration(id: string): Promise<boolean> {
  const { error } = await deleteRegistration(id);
  if (error) { console.error('removeRegistration:', error); return false; }
  return true;
}

export async function fetchSubmissions(): Promise<Submission[]> {
  const { data, error } = await getSubmissions();
  if (error || !data) { console.error('fetchSubmissions:', error); return []; }
  return data.map(dbSubmissionToApp);
}

export async function saveSubmission(s: Omit<Submission, 'id' | 'submittedAt'>): Promise<Submission | null> {
  const { data, error } = await createSubmission({
    tournament_id: s.tournamentId, angler: s.angler, species: s.species,
    size: parseFloat(s.size), catch_date: s.catchDate, catch_time: s.catchTime,
    location: s.location ?? null, image: s.image ?? null, photo: s.photo ?? null,
    status: s.status, reviewed_at: s.reviewedAt ?? null,
  });
  if (error || !data?.[0]) { console.error('saveSubmission:', error); return null; }
  return dbSubmissionToApp(data[0]);
}

export async function editSubmission(id: string, updates: Partial<Submission>): Promise<Submission | null> {
  const db: any = {};
  if (updates.status !== undefined) db.status = updates.status;
  if (updates.reviewedAt !== undefined) db.reviewed_at = updates.reviewedAt;
  if (updates.image !== undefined) db.image = updates.image;
  if (updates.photo !== undefined) db.photo = updates.photo;
  const { data, error } = await updateSubmission(id, db);
  if (error || !data?.[0]) { console.error('editSubmission:', error); return null; }
  return dbSubmissionToApp(data[0]);
}

export async function removeSubmission(id: string): Promise<boolean> {
  const { error } = await deleteSubmission(id);
  if (error) { console.error('removeSubmission:', error); return false; }
  return true;
}

export async function fetchSeries(): Promise<Series[]> {
  const { data, error } = await getSeries();
  if (error || !data) { console.error('fetchSeries:', error); return []; }
  return data.map(dbSeriesToApp);
}

export async function saveSeries(s: Omit<Series, 'id' | 'createdAt'>): Promise<Series | null> {
  const { data, error } = await createSeries({
    name: s.name, description: s.description ?? null,
    created_by: s.createdBy, tournament_ids: s.tournaments ?? null,
  });
  if (error || !data?.[0]) { console.error('saveSeries:', error); return null; }
  return dbSeriesToApp(data[0]);
}

export async function removeSeries(id: string): Promise<boolean> {
  const { error } = await deleteSeries(id);
  if (error) { console.error('removeSeries:', error); return false; }
  return true;
}
