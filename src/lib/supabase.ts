// src/lib/supabase.ts
// Supabase client for FishTournament Pro
// Project: Hoox (iefjracmxpkpwndrksps)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Lightweight fetch-based Supabase client (no SDK dependency needed)
// This keeps the bundle small and works perfectly on Cloudflare Pages

async function supabaseFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let message = `HTTP ${res.status}`;
    try {
      const json = JSON.parse(text);
      message = json.message || json.hint || json.error || text;
    } catch {
      message = text || message;
    }
    return { data: null, error: message };
  }

  // 204 No Content
  if (res.status === 204) {
    return { data: null, error: null };
  }

  const data = await res.json();
  return { data, error: null };
}

// ============================================================
// TOURNAMENTS
// ============================================================

export async function getTournaments() {
  return supabaseFetch<DbTournament[]>(
    'tournaments?select=*&order=start_date.asc'
  );
}

export async function getTournamentById(id: string) {
  return supabaseFetch<DbTournament[]>(
    `tournaments?id=eq.${id}&select=*`
  );
}

export async function createTournament(t: Omit<DbTournamentInsert, 'id' | 'created_at'>) {
  return supabaseFetch<DbTournament[]>('tournaments', {
    method: 'POST',
    body: JSON.stringify(t),
  });
}

export async function updateTournament(id: string, updates: Partial<DbTournamentInsert>) {
  return supabaseFetch<DbTournament[]>(`tournaments?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteTournament(id: string) {
  return supabaseFetch<null>(`tournaments?id=eq.${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// USERS
// ============================================================

export async function getUsers() {
  return supabaseFetch<DbUser[]>('users?select=*&order=created_at.desc');
}

export async function getUserByEmail(email: string) {
  return supabaseFetch<DbUser[]>(
    `users?email=eq.${encodeURIComponent(email)}&select=*`
  );
}

export async function getUserById(id: string) {
  return supabaseFetch<DbUser[]>(`users?id=eq.${id}&select=*`);
}

export async function createUser(u: Omit<DbUserInsert, 'id' | 'created_at'>) {
  return supabaseFetch<DbUser[]>('users', {
    method: 'POST',
    body: JSON.stringify(u),
  });
}

export async function updateUser(id: string, updates: Partial<DbUserInsert>) {
  return supabaseFetch<DbUser[]>(`users?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteUser(id: string) {
  return supabaseFetch<null>(`users?id=eq.${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// REGISTRATIONS
// ============================================================

export async function getRegistrations() {
  return supabaseFetch<DbRegistration[]>(
    'registrations?select=*&order=registered_at.desc'
  );
}

export async function getRegistrationsByTournament(tournamentId: string) {
  return supabaseFetch<DbRegistration[]>(
    `registrations?tournament_id=eq.${tournamentId}&select=*`
  );
}

export async function createRegistration(r: Omit<DbRegistrationInsert, 'id' | 'registered_at'>) {
  return supabaseFetch<DbRegistration[]>('registrations', {
    method: 'POST',
    body: JSON.stringify(r),
  });
}

export async function deleteRegistration(id: string) {
  return supabaseFetch<null>(`registrations?id=eq.${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// SUBMISSIONS
// ============================================================

export async function getSubmissions() {
  return supabaseFetch<DbSubmission[]>(
    'submissions?select=*&order=submitted_at.desc'
  );
}

export async function getSubmissionsByTournament(tournamentId: string) {
  return supabaseFetch<DbSubmission[]>(
    `submissions?tournament_id=eq.${tournamentId}&select=*`
  );
}

export async function createSubmission(s: Omit<DbSubmissionInsert, 'id' | 'submitted_at'>) {
  return supabaseFetch<DbSubmission[]>('submissions', {
    method: 'POST',
    body: JSON.stringify(s),
  });
}

export async function updateSubmission(id: string, updates: Partial<DbSubmissionInsert>) {
  return supabaseFetch<DbSubmission[]>(`submissions?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteSubmission(id: string) {
  return supabaseFetch<null>(`submissions?id=eq.${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// SERIES
// ============================================================

export async function getSeries() {
  return supabaseFetch<DbSeries[]>('series?select=*&order=created_at.desc');
}

export async function createSeries(s: Omit<DbSeriesInsert, 'id' | 'created_at'>) {
  return supabaseFetch<DbSeries[]>('series', {
    method: 'POST',
    body: JSON.stringify(s),
  });
}

export async function updateSeries(id: string, updates: Partial<DbSeriesInsert>) {
  return supabaseFetch<DbSeries[]>(`series?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteSeries(id: string) {
  return supabaseFetch<null>(`series?id=eq.${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// TYPE MAPPERS  (DB snake_case <-> App camelCase)
// ============================================================

import type {
  Tournament,
  User,
  Registration,
  Submission,
  Series,
} from '@/types';

export function dbTournamentToApp(t: DbTournament): Tournament {
  return {
    id: t.id,
    name: t.name,
    description: t.description ?? undefined,
    location: t.location ?? undefined,
    city: t.city ?? undefined,
    state: t.state ?? undefined,
    species: t.species ?? undefined,
    fishTypes: t.fish_types ?? undefined,
    startDate: t.start_date,
    startTime: t.start_time,
    endDate: t.end_date,
    endTime: t.end_time,
    timezone: t.timezone ?? undefined,
    registrationFee: t.registration_fee != null ? String(t.registration_fee) : undefined,
    entryFee: t.entry_fee != null ? String(t.entry_fee) : undefined,
    maxParticipants: t.max_participants != null ? String(t.max_participants) : undefined,
    image: t.image ?? undefined,
    createdBy: t.created_by,
    createdAt: t.created_at,
    status: (t.status as Tournament['status']) ?? 'upcoming',
    directorFeePercentage: t.director_fee_percentage ?? undefined,
  };
}

export function appTournamentToDb(t: Partial<Tournament>): Partial<DbTournamentInsert> {
  const out: Partial<DbTournamentInsert> = {};
  if (t.name !== undefined) out.name = t.name;
  if (t.description !== undefined) out.description = t.description;
  if (t.location !== undefined) out.location = t.location;
  if (t.city !== undefined) out.city = t.city;
  if (t.state !== undefined) out.state = t.state;
  if (t.species !== undefined) out.species = t.species;
  if (t.fishTypes !== undefined) out.fish_types = t.fishTypes;
  if (t.startDate !== undefined) out.start_date = t.startDate;
  if (t.startTime !== undefined) out.start_time = t.startTime;
  if (t.endDate !== undefined) out.end_date = t.endDate;
  if (t.endTime !== undefined) out.end_time = t.endTime;
  if (t.timezone !== undefined) out.timezone = t.timezone;
  if (t.registrationFee !== undefined) out.registration_fee = parseFloat(t.registrationFee) || null;
  if (t.entryFee !== undefined) out.entry_fee = parseFloat(t.entryFee) || null;
  if (t.maxParticipants !== undefined) out.max_participants = parseInt(t.maxParticipants) || null;
  if (t.image !== undefined) out.image = t.image;
  if (t.createdBy !== undefined) out.created_by = t.createdBy;
  if (t.status !== undefined) out.status = t.status;
  if (t.directorFeePercentage !== undefined) out.director_fee_percentage = t.directorFeePercentage;
  return out;
}

export function dbUserToApp(u: DbUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as User['role'],
    status: u.status as User['status'],
    organization: u.organization ?? undefined,
    address: u.address ?? undefined,
    city: u.city ?? undefined,
    state: u.state ?? undefined,
    zip: u.zip ?? undefined,
    phone: u.phone ?? undefined,
    website: u.website ?? undefined,
    avatar: u.avatar ?? undefined,
    message: u.message ?? undefined,
    bannerImage: u.banner_image ?? undefined,
    bannerStartDate: u.banner_start_date ?? undefined,
    bannerEndDate: u.banner_end_date ?? undefined,
    createdAt: u.created_at,
  };
}

export function dbRegistrationToApp(r: DbRegistration): Registration {
  return {
    id: r.id,
    tournamentId: r.tournament_id,
    angler: r.angler,
    registeredAt: r.registered_at,
    fee: r.fee ?? undefined,
    appOwnerCut: r.app_owner_cut ?? undefined,
    directorReceives: r.director_receives ?? undefined,
  };
}

export function dbSubmissionToApp(s: DbSubmission): Submission {
  return {
    id: s.id,
    tournamentId: s.tournament_id,
    angler: s.angler,
    species: s.species,
    size: String(s.size),
    catchDate: s.catch_date,
    catchTime: s.catch_time,
    location: s.location ?? undefined,
    image: s.image ?? undefined,
    photo: s.photo ?? undefined,
    submittedAt: s.submitted_at,
    status: s.status as Submission['status'],
    reviewedAt: s.reviewed_at ?? undefined,
  };
}

export function dbSeriesToApp(s: DbSeries): Series {
  return {
    id: s.id,
    name: s.name,
    description: s.description ?? undefined,
    createdBy: s.created_by,
    createdAt: s.created_at,
    tournaments: s.tournament_ids?.map(String) ?? undefined,
  };
}

// ============================================================
// DATABASE TYPES  (mirrors schema.sql exactly)
// ============================================================

export interface DbTournament {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  species: string | null;
  fish_types: string[] | null;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  timezone: string | null;
  registration_fee: number | null;
  entry_fee: number | null;
  max_participants: number | null;
  image: string | null;
  created_by: string;
  status: string;
  director_fee_percentage: number | null;
  created_at: string;
}

export type DbTournamentInsert = Omit<DbTournament, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export interface DbUser {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  role: string;
  status: string;
  organization: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  website: string | null;
  avatar: string | null;
  message: string | null;
  banner_image: string | null;
  banner_start_date: string | null;
  banner_end_date: string | null;
  created_at: string;
}

export type DbUserInsert = Omit<DbUser, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export interface DbRegistration {
  id: string;
  tournament_id: string;
  angler: string;
  fee: number | null;
  app_owner_cut: number | null;
  director_receives: number | null;
  registered_at: string;
}

export type DbRegistrationInsert = Omit<DbRegistration, 'id' | 'registered_at'> & {
  id?: string;
  registered_at?: string;
};

export interface DbSubmission {
  id: string;
  tournament_id: string;
  angler: string;
  species: string;
  size: number;
  catch_date: string;
  catch_time: string;
  location: string | null;
  image: string | null;
  photo: string | null;
  status: string;
  reviewed_at: string | null;
  submitted_at: string;
}

export type DbSubmissionInsert = Omit<DbSubmission, 'id' | 'submitted_at'> & {
  id?: string;
  submitted_at?: string;
};

export interface DbSeries {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  tournament_ids: string[] | null;
  created_at: string;
}

export type DbSeriesInsert = Omit<DbSeries, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};
