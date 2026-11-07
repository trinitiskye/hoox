// Judges for one tournament. Owning director or admin.
//
// GET    → { judges: [{ id, userId, name, email, status, inviteLink }] }
// POST   { userId } (an existing judge account) or { email, name } (invite)
// DELETE ?judge=<row id>
// Invited judges get an invite link (emailed once an email service is
// connected; until then the director can copy and send it).

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { getTournamentSrv, ownsEvent } from '@/lib/tournamentServer';
import { judgesFor, addJudge, removeJudge, judgeInviteLink, type DbTournamentJudge } from '@/lib/judgeServer';

type Ctx = { params: Promise<{ id: string }> };

async function load(request: Request, params: Ctx['params']) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { res: Response.json({ error: 'Please sign in.' }, { status: 401 }) };
  const { id } = await params;
  const t = await getTournamentSrv(id);
  if (!t) return { res: Response.json({ error: 'Tournament not found.' }, { status: 404 }) };
  if (!ownsEvent(user, t)) return { res: Response.json({ error: 'Only the tournament’s director can manage its judges.' }, { status: 403 }) };
  return { user, t };
}

const out = (j: DbTournamentJudge, origin: string) => ({
  id: j.id, userId: j.user_id, name: j.name || j.email, email: j.email, status: j.status,
  inviteLink: j.status === 'invited' ? judgeInviteLink(origin, j.id) : null,
});

export async function GET(request: Request, { params }: Ctx) {
  const l = await load(request, params);
  if ('res' in l) return l.res;
  const origin = new URL(request.url).origin;
  return Response.json({ judges: (await judgesFor(l.t.id)).map((j) => out(j, origin)), error: null }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request, { params }: Ctx) {
  const l = await load(request, params);
  if ('res' in l) return l.res;
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const s = (k: string) => (typeof b[k] === 'string' ? (b[k] as string) : '');
  const r = await addJudge(l.t.id, { userId: s('userId') || undefined, email: s('email'), name: s('name') }, l.user.id);
  if (!r.judge) return Response.json({ judge: null, error: r.error }, { status: 400 });
  return Response.json({ judge: out(r.judge, new URL(request.url).origin), invited: !!r.invited, error: null });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const l = await load(request, params);
  if ('res' in l) return l.res;
  const jid = new URL(request.url).searchParams.get('judge') || '';
  if (!jid) return Response.json({ error: 'Choose a judge to remove.' }, { status: 400 });
  const { error } = await removeJudge(l.t.id, jid);
  if (error) return Response.json({ error: 'Couldn’t remove the judge.' }, { status: 500 });
  return Response.json({ ok: true, error: null });
}
