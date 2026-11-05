// PATCH /api/series/:id — edit; DELETE /api/series/:id — delete (the director who created it, or an admin)

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { dbSeriesToApp, type DbSeries } from '@/lib/supabase';
import { getSeriesSrv, ownsEvent, seriesFromBody, checkSeriesTournaments, patchRow, deleteRow } from '@/lib/tournamentServer';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getAuthenticatedUser(request);
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  const { id } = await params;
  const s = await getSeriesSrv(id);
  if (!s) return Response.json({ error: 'Series not found.' }, { status: 404 });
  if (!ownsEvent(user, s)) return Response.json({ error: 'You can only change your own series.' }, { status: 403 });
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const { value, error } = seriesFromBody(b, true);
  if (!value) return Response.json({ error }, { status: 400 });
  const bad = await checkSeriesTournaments(user, value.tournament_ids);
  if (bad) return Response.json({ error: bad }, { status: 400 });
  const { data, error: dbErr } = await patchRow<DbSeries>('series', s.id, value);
  if (dbErr || !data?.[0]) return Response.json({ error: 'Couldn’t save the series.' }, { status: 500 });
  return Response.json({ series: dbSeriesToApp(data[0]), error: null });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const user = await getAuthenticatedUser(request);
  if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  const { id } = await params;
  const s = await getSeriesSrv(id);
  if (!s) return Response.json({ error: 'Series not found.' }, { status: 404 });
  if (!ownsEvent(user, s)) return Response.json({ error: 'You can only delete your own series.' }, { status: 403 });
  const { error } = await deleteRow('series', s.id);
  if (error) return Response.json({ error: 'Couldn’t delete the series.' }, { status: 500 });
  return Response.json({ ok: true, error: null });
}
