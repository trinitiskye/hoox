// SERVER-ONLY: permissions and validation for tournaments, series,
// registrations and catch submissions. The public key can only READ these
// tables (supabase/migration_2026_11_lock_tournament_tables.sql); every write
// goes through src/app/api/** with the caller's signed session.
//
// Who can do what
//   tournaments / series  create: active directors and admins
//                         edit/delete: the director who created it, or an admin
//   registrations         create: the signed-in angler (one per tournament);
//                         admins/owning director can add an angler by id
//                         cancel: the angler before the tournament starts, or the owning director/admin
//   submissions           create: a registered angler, during the tournament
//                         review (approve/deny/edit): the owning director, their approved judges, admins
//                         delete: the angler while pending, or the owning director/admin

import { supabaseAdminFetch, getUserByIdAdmin } from './supabaseAdmin';
import { todayIso } from './featured';
import type { DbTournament, DbSeries, DbRegistration, DbSubmission, DbTournamentInsert } from './supabase';
import type { User } from '@/types';
import { cleanVessels, VESSEL_TYPES } from './vessels';
import { parseFormat, formatFromRow, formatToRow, measuresFor, type TournamentFormat } from './tournamentFormat';
import { parseDetails, detailsFromRow, WATER_TYPES } from './tournamentDetails';

export const TOURNAMENT_STATUSES = ['upcoming', 'active', 'completed'] as const;
export const SUBMISSION_REVIEW = ['pending', 'approved', 'denied'] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;
const idEq = (id: string) => `id=eq.${encodeURIComponent(id)}`;

/* ------------------------------- data access ------------------------------ */

export const getTournamentSrv = async (id: string) => (await supabaseAdminFetch<DbTournament[]>(`tournaments?${idEq(id)}&select=*`)).data?.[0] ?? null;
export const getSeriesSrv = async (id: string) => (await supabaseAdminFetch<DbSeries[]>(`series?${idEq(id)}&select=*`)).data?.[0] ?? null;
export const getRegistrationSrv = async (id: string) => (await supabaseAdminFetch<(DbRegistration & { angler_id: string | null })[]>(`registrations?${idEq(id)}&select=*`)).data?.[0] ?? null;
export const getSubmissionSrv = async (id: string) => (await supabaseAdminFetch<(DbSubmission & { angler_id: string | null })[]>(`submissions?${idEq(id)}&select=*`)).data?.[0] ?? null;
export async function registrationsFor(tournamentId: string) {
  return (await supabaseAdminFetch<(DbRegistration & { angler_id: string | null })[]>(`registrations?tournament_id=eq.${encodeURIComponent(tournamentId)}&select=*&limit=10000`)).data ?? [];
}

export const insertRow = <T>(table: string, row: unknown) => supabaseAdminFetch<T[]>(table, { method: 'POST', body: JSON.stringify(row) });
export const patchRow = <T>(table: string, id: string, patch: unknown) => supabaseAdminFetch<T[]>(`${table}?${idEq(id)}`, { method: 'PATCH', body: JSON.stringify(patch) });
export const deleteRow = (table: string, id: string) => supabaseAdminFetch<unknown[]>(`${table}?${idEq(id)}`, { method: 'DELETE' });

/* ------------------------------- permissions ------------------------------ */

export const isAdmin = (u: User | null) => u?.role === 'admin';
export const canCreateEvents = (u: User | null) => !!u && u.status === 'active' && (u.role === 'director' || u.role === 'admin');
export const ownsEvent = (u: User | null, row: { created_by: string } | null) => !!u && !!row && (isAdmin(u) || (u.role === 'director' && row.created_by === u.id));

/** Directors, their approved judges (judge.message = director's email) and admins can review catches */
export async function canReview(u: User | null, t: DbTournament): Promise<boolean> {
  if (!u || u.status !== 'active') return false;
  if (ownsEvent(u, t)) return true;
  if (u.role !== 'judge' || !u.message) return false;
  const { data } = await getUserByIdAdmin(t.created_by);
  return !!data?.[0] && data[0].email.toLowerCase() === u.message.toLowerCase();
}

/** Name shown on leaderboards: public display name, else account name */
export const anglerName = (u: User) => u.profileDisplayName || u.displayName || u.name;

/* -------------------------------- validation ------------------------------ */

type Body = Record<string, unknown>;
const str = (b: Body, k: string, max: number) => (typeof b[k] === 'string' ? (b[k] as string).trim().slice(0, max) : '');
const has = (b: Body, k: string) => k in b && b[k] !== undefined;
const money = (v: unknown) => (v === '' || v === null || v === undefined ? null : Number(v));

export function tournamentFromBody(b: Body, prev?: DbTournament): { value: Partial<DbTournamentInsert> | null; error: string | null } {
  const v: Partial<DbTournamentInsert> = {};
  const fail = (error: string) => ({ value: null, error });
  if (!prev || has(b, 'name')) { const n = str(b, 'name', 160); if (!n) return fail('Enter the tournament name.'); v.name = n; }
  for (const [k, col, max] of [['description', 'description', 8000], ['location', 'location', 200], ['city', 'city', 100], ['state', 'state', 100], ['species', 'species', 200], ['image', 'image', 1000], ['timezone', 'timezone', 60]] as const) {
    if (has(b, k)) (v as Record<string, unknown>)[col] = str(b, k, max) || null;
  }
  if (v.image && !/^https:\/\//i.test(v.image) && !v.image.startsWith('/') && !(process.env.NEXT_PUBLIC_SUPABASE_URL && v.image.startsWith(process.env.NEXT_PUBLIC_SUPABASE_URL))) return fail('Image must be an https:// link.');
  if (has(b, 'fishTypes')) {
    if (!Array.isArray(b.fishTypes)) return fail('Fish types must be a list.');
    v.fish_types = (b.fishTypes as unknown[]).map((x) => String(x).trim().slice(0, 60)).filter(Boolean).slice(0, 30);
  }
  // Format: entry type, judging, prizes, side pots (merged over what's saved)
  const FORMAT_KEYS = ['entryType', 'teamMin', 'teamMax', 'feeBasis', 'scoring', 'primaryMeasure', 'fishLimit', 'placePrizes', 'sidePots'];
  if (!prev || FORMAT_KEYS.some((k) => has(b, k))) {
    const fmt = parseFormat(Object.fromEntries(FORMAT_KEYS.filter((k) => has(b, k)).map((k) => [k, b[k]])), prev ? formatFromRow(prev) : undefined);
    if (!fmt.value) return fail(fmt.error!);
    Object.assign(v, formatToRow(fmt.value));
  }
  if (has(b, 'waterType')) {
    const w = str(b, 'waterType', 20);
    if (w && !(WATER_TYPES as readonly string[]).includes(w)) return fail('Choose freshwater or saltwater.');
    v.water_type = w || null;
  }
  if (has(b, 'details')) {
    if (!b.details || typeof b.details !== 'object') return fail('Invalid tournament details.');
    // Merge over what's saved so partial updates keep the rest
    const merged = { ...(prev ? detailsFromRow(prev.details) : {}), ...(b.details as Record<string, unknown>) };
    const d = parseDetails(merged);
    if (!d.value) return fail(d.error!);
    v.details = d.value;
  }
  if (has(b, 'vesselTypes')) {
    if (!Array.isArray(b.vesselTypes)) return fail(`Vessel types must be a list (${VESSEL_TYPES.join(', ')}).`);
    v.vessel_types = cleanVessels(b.vesselTypes);
  }
  for (const [k, col] of [['startDate', 'start_date'], ['endDate', 'end_date']] as const) {
    if (!prev || has(b, k)) { const d = str(b, k, 10); if (!DATE_RE.test(d)) return fail(k === 'startDate' ? 'Choose a start date.' : 'Choose an end date.'); (v as Record<string, unknown>)[col] = d; }
  }
  for (const [k, col] of [['startTime', 'start_time'], ['endTime', 'end_time']] as const) {
    if (has(b, k)) { const t = str(b, k, 8); if (!TIME_RE.test(t)) return fail('Enter times as HH:MM.'); (v as Record<string, unknown>)[col] = t; }
  }
  const start = v.start_date ?? prev?.start_date, end = v.end_date ?? prev?.end_date;
  if (start && end && end < start) return fail('The end date can’t be before the start date.');
  for (const [k, col] of [['entryFee', 'entry_fee'], ['registrationFee', 'registration_fee']] as const) {
    if (has(b, k)) { const n = money(b[k]); if (n !== null && (!Number.isFinite(n) || n < 0 || n > 100000)) return fail('Enter a valid fee.'); (v as Record<string, unknown>)[col] = n; }
  }
  if (has(b, 'maxParticipants')) {
    const n = money(b.maxParticipants);
    if (n !== null && (!Number.isInteger(n) || n < 1 || n > 100000)) return fail('Max participants must be a whole number.');
    v.max_participants = n;
  }
  if (has(b, 'status')) {
    const s = str(b, 'status', 20);
    if (!(TOURNAMENT_STATUSES as readonly string[]).includes(s)) return fail('Unknown status.');
    v.status = s;
  }
  return { value: v, error: null };
}

export function seriesFromBody(b: Body, partial: boolean): { value: Partial<DbSeries> | null; error: string | null } {
  const v: Partial<DbSeries> = {};
  if (!partial || has(b, 'name')) { const n = str(b, 'name', 160); if (!n) return { value: null, error: 'Enter the series name.' }; v.name = n; }
  if (has(b, 'description')) v.description = str(b, 'description', 8000) || null;
  if (has(b, 'vesselTypes')) {
    if (!Array.isArray(b.vesselTypes)) return { value: null, error: 'Vessel types must be a list.' };
    v.vessel_types = cleanVessels(b.vesselTypes);
  }
  if (has(b, 'tournamentIds')) {
    if (!Array.isArray(b.tournamentIds)) return { value: null, error: 'Tournaments must be a list.' };
    v.tournament_ids = [...new Set((b.tournamentIds as unknown[]).map(String))].slice(0, 100);
  }
  return { value: v, error: null };
}

/** Tournaments in a series must belong to the same director (admins can mix) */
export async function checkSeriesTournaments(u: User, ids: string[] | null | undefined): Promise<string | null> {
  if (!ids || ids.length === 0) return null;
  const list = ids.map((i) => `"${i.replace(/"/g, '')}"`).join(',');
  const { data } = await supabaseAdminFetch<Pick<DbTournament, 'id' | 'created_by'>[]>(`tournaments?select=id,created_by&id=in.(${list})`);
  if ((data?.length ?? 0) !== ids.length) return 'One of those tournaments doesn’t exist.';
  if (!isAdmin(u) && data!.some((t) => t.created_by !== u.id)) return 'A series can only include your own tournaments.';
  return null;
}

export function submissionFromBody(b: Body, t: DbTournament, partial: boolean): { value: Partial<DbSubmission> | null; error: string | null } {
  const v: Partial<DbSubmission> = {};
  const fail = (error: string) => ({ value: null, error });
  const f = formatFromRow(t);
  const needs = measuresFor(f.scoring);
  // Weight (lb) and/or length (in), as the tournament judges. "size" mirrors the main measure.
  for (const [k, col, m, label, max] of [['weight', 'weight_lb', 'weight', 'weight in pounds', 300], ['length', 'length_in', 'length', 'length in inches', 200]] as const) {
    if (!needs.includes(m)) continue;
    const raw = has(b, k) ? b[k] : (!partial && m === f.primaryMeasure && has(b, 'size') ? b.size : undefined);
    if (raw === undefined) { if (!partial) return fail(`Enter the catch ${label}.`); continue; }
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0 || n > max) return fail(`Enter a valid ${label}.`);
    (v as Record<string, unknown>)[col] = Math.round(n * 100) / 100;
    if (m === f.primaryMeasure) v.size = Math.round(n * 100) / 100;
  }
  if (!partial || has(b, 'species')) {
    const sp = str(b, 'species', 80);
    if (!sp) return fail('Choose the species.');
    if (t.fish_types?.length && !t.fish_types.some((f) => f.toLowerCase() === sp.toLowerCase())) return fail('That species isn’t eligible in this tournament.');
    v.species = sp;
  }

  if (!partial || has(b, 'catchDate')) {
    const d = str(b, 'catchDate', 10);
    if (!DATE_RE.test(d)) return fail('Choose the catch date.');
    if (d < t.start_date || d > t.end_date) return fail('The catch date must be during the tournament.');
    v.catch_date = d;
  }
  if (!partial || has(b, 'catchTime')) {
    const tm = str(b, 'catchTime', 8);
    if (!TIME_RE.test(tm)) return fail('Enter the catch time as HH:MM.');
    v.catch_time = tm;
  }
  if (has(b, 'location')) v.location = str(b, 'location', 200) || null;
  for (const k of ['photo', 'image'] as const) {
    if (has(b, k)) {
      const u = str(b, k, 1000);
      if (u && !/^https:\/\//i.test(u)) return fail('Photos must be https:// links.');
      v[k] = u || null;
    }
  }
  return { value: v, error: null };
}

/** Registration is open until the tournament ends (and it isn't marked completed) */
export function registrationProblem(t: DbTournament, count: number): string | null {
  if (t.status === 'completed' || t.end_date < todayIso()) return 'Registration for this tournament is closed.';
  if (t.max_participants && count >= t.max_participants) return 'This tournament is full.';
  return null;
}

/** Catches can be submitted from the start date through the end date */
export function submissionWindowProblem(t: DbTournament): string | null {
  const today = todayIso();
  if (today < t.start_date) return 'Catch submissions open when the tournament starts.';
  if (today > t.end_date || t.status === 'completed') return 'This tournament has ended.';
  return null;
}
