// src/app/api/tournaments/host-clubs/route.ts
// "Hosted by" picker on the tournament form (directors and admins).
//
//   GET   clubs to choose from: every approved club, plus the signed-in
//         person's own clubs still in review (admins see every club that
//         isn't declined). Contact email/phone only for your own clubs, or
//         for admins: they're not public in the directory.
//   POST  quick-add a new club. Admins: approved right away (and put on the
//         map). Directors: saved for HOOX review like /clubs/submit, and
//         usable as this tournament's host straight away.

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import {
  listClubSubmissionsAdmin, listApprovedClubsAdmin, listClubSubmissionsByUserAdmin,
  createClubSubmissionAdmin, updateClubSubmissionAdmin, getUserByIdAdmin, publicUrlPrefix,
} from '@/lib/supabaseAdmin';
import { parseClubFields, type DbClubSubmission } from '@/lib/clubSubmission';
import { ensureClubLocation } from '@/lib/clubLocation';
import { TOURNAMENT_IMAGE_BUCKET } from '@/lib/tournamentImages';

export interface HostClub {
  id: string; name: string; city: string; state: string; website: string; logo: string;
  email: string; phone: string; status: string; mine: boolean;
}

const toHost = (s: DbClubSubmission, showContact: boolean, mine: boolean): HostClub => ({
  id: s.id, name: s.club_name, city: s.city, state: s.state, website: s.website || '', logo: s.logo_url || '',
  email: showContact ? s.contact_email || '' : '', phone: showContact ? s.contact_phone || '' : '', status: s.status, mine,
});

const canHost = (role: string) => role === 'admin' || role === 'director';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user || !canHost(user.role)) return Response.json({ clubs: [], error: 'Please sign in as a tournament director.' }, { status: 401 });
  const isAdmin = user.role === 'admin';
  const [all, own] = await Promise.all([
    isAdmin ? listClubSubmissionsAdmin() : listApprovedClubsAdmin(),
    listClubSubmissionsByUserAdmin(user.id),
  ]);
  if (all.error) return Response.json({ clubs: [], error: 'Couldn’t load clubs.' }, { status: 502 });
  const mineIds = new Set((own.data || []).map((s) => s.id));
  const byId = new Map<string, HostClub>();
  for (const s of [...(own.data || []), ...(all.data || [])]) {
    if (s.status === 'declined' || byId.has(s.id)) continue;
    const mine = mineIds.has(s.id);
    byId.set(s.id, toHost(s, isAdmin || mine, mine));
  }
  const clubs = [...byId.values()].sort((a, b) => Number(b.mine) - Number(a.mine) || a.name.localeCompare(b.name));
  return Response.json({ clubs, error: null }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user || !canHost(user.role)) return Response.json({ club: null, error: 'Please sign in as a tournament director.' }, { status: 401 });
  const isAdmin = user.role === 'admin';
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ club: null, error: 'Invalid request.' }, { status: 400 }); }

  const str = (k: string) => (typeof body[k] === 'string' ? (body[k] as string) : '');
  const list = (k: string) => (Array.isArray(body[k]) ? (body[k] as unknown[]).filter((x): x is string => typeof x === 'string') : []);
  // Same validation as "Submit a Club"; admins don't need to tick "authorized"
  const { value, error } = parseClubFields(
    (k) => (k === 'agreedAuthorized' ? (isAdmin || body.agreedAuthorized === true ? 'true' : '') : str(k)),
    list,
  );
  if (error || !value) return Response.json({ club: null, error: error || 'Invalid club.' }, { status: 400 });

  // An admin adding a club for a director's tournament files it under that director
  let owner = user;
  const forId = str('forUser');
  if (isAdmin && forId && forId !== user.id) {
    const { data } = await getUserByIdAdmin(forId);
    const u = data?.[0];
    if (u) owner = { ...user, id: u.id, name: u.name, email: u.email, role: u.role as typeof user.role };
  }

  // Logo uploaded through /api/tournaments/upload (only our own storage is accepted)
  const logo = str('logoUrl').trim();
  if (logo && !logo.startsWith(`${publicUrlPrefix(TOURNAMENT_IMAGE_BUCKET)}club-logo/`)) return Response.json({ club: null, error: 'Upload the logo again.' }, { status: 400 });

  const { data, error: dbErr } = await createClubSubmissionAdmin({
    ...value,
    logo_url: logo || null,
    contact_email: value.contact_email,
    submitted_by: owner.id,
    submitter_name: owner.name,
    submitter_email: owner.email,
    submitter_role: owner.role,
  });
  let club = data?.[0];
  if (dbErr || !club) return Response.json({ club: null, error: 'Couldn’t save the club. Please try again.' }, { status: 500 });

  if (isAdmin) {
    const { data: up } = await updateClubSubmissionAdmin(club.id, { status: 'approved', reviewed_at: new Date().toISOString() });
    if (up?.[0]) club = (await ensureClubLocation(up[0]).catch(() => ({ club: up[0] }))).club;
  }
  return Response.json({ club: toHost(club, true, owner.id === user.id), error: null });
}
