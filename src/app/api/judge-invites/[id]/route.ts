// PUBLIC: what /register/judge?invite=<id> shows ("You've been invited to
// judge …") and prefills. The invite id is the token; only the invited
// email, tournament name and director are returned.

export const runtime = 'edge';

import { getJudgeInvite } from '@/lib/judgeServer';
import { getTournamentSrv } from '@/lib/tournamentServer';
import { getUserByIdAdmin } from '@/lib/supabaseAdmin';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ invite: null, error: 'Invite not found.' }, { status: 404 });
  const inv = await getJudgeInvite(id);
  if (!inv) return Response.json({ invite: null, error: 'This invite is no longer valid.' }, { status: 404 });
  const t = await getTournamentSrv(inv.tournament_id);
  const dir = t ? (await getUserByIdAdmin(t.created_by)).data?.[0] : undefined;
  return Response.json({
    invite: {
      email: inv.email, name: inv.name || '', status: inv.status,
      tournament: t?.name || 'a tournament', directorName: dir?.name || '', directorEmail: dir?.email || '',
    },
    error: null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
