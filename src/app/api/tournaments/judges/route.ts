// Judge accounts on HOOX, for the tournament form's judge picker.
// Directors and admins. Admins see emails; directors see a masked email.

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { judgeAccounts } from '@/lib/judgeServer';

const mask = (e: string) => { const [u, d] = e.split('@'); return `${u.slice(0, 1)}${'•'.repeat(Math.max(1, Math.min(4, u.length - 1)))}@${d}`; };

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user || (user.role !== 'admin' && user.role !== 'director')) return Response.json({ judges: [], error: 'Please sign in as a tournament director.' }, { status: 401 });
  const admin = user.role === 'admin';
  const judges = (await judgeAccounts()).map((u) => ({
    id: u.id, name: u.profile_display_name || u.display_name || u.name,
    email: admin ? u.email : mask(u.email),
    place: [u.city, u.state].filter(Boolean).join(', '),
  }));
  return Response.json({ judges, error: null }, { headers: { 'Cache-Control': 'no-store' } });
}
