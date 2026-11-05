// POST /api/tournaments — create a tournament (active directors and admins).
//   { name, startDate, endDate, startTime?, endTime?, timezone?, description?, location?, city?, state?,
//     species?, fishTypes?, entryFee?, registrationFee?, maxParticipants?, image?, createdBy? (admin only) }

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { dbTournamentToApp, type DbTournament } from '@/lib/supabase';
import { canCreateEvents, isAdmin, tournamentFromBody, insertRow } from '@/lib/tournamentServer';

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  if (!canCreateEvents(user)) return Response.json({ error: 'Only tournament directors can create tournaments.' }, { status: 403 });
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const { value, error } = tournamentFromBody(b);
  if (!value) return Response.json({ error }, { status: 400 });
  const createdBy = isAdmin(user) && typeof b.createdBy === 'string' && b.createdBy ? b.createdBy : user.id;
  const { data, error: dbErr } = await insertRow<DbTournament>('tournaments', {
    start_time: '06:00', end_time: '18:00', status: 'upcoming', ...value, created_by: createdBy,
  });
  if (dbErr || !data?.[0]) return Response.json({ error: 'Couldn’t save the tournament.' }, { status: 500 });
  return Response.json({ tournament: dbTournamentToApp(data[0]), error: null });
}
