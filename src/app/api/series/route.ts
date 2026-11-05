// POST /api/series — create a series (active directors and admins). { name, description?, tournamentIds? }

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { dbSeriesToApp, type DbSeries } from '@/lib/supabase';
import { canCreateEvents, seriesFromBody, checkSeriesTournaments, insertRow } from '@/lib/tournamentServer';

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  if (!canCreateEvents(user)) return Response.json({ error: 'Only tournament directors can create a series.' }, { status: 403 });
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const { value, error } = seriesFromBody(b, false);
  if (!value) return Response.json({ error }, { status: 400 });
  const bad = await checkSeriesTournaments(user, value.tournament_ids);
  if (bad) return Response.json({ error: bad }, { status: 400 });
  const { data, error: dbErr } = await insertRow<DbSeries>('series', { tournament_ids: [], ...value, created_by: user.id });
  if (dbErr || !data?.[0]) return Response.json({ error: 'Couldn’t save the series.' }, { status: 500 });
  return Response.json({ series: dbSeriesToApp(data[0]), error: null });
}
