// PUBLIC heartbeat from the chat bubble (every ~30s while the tab is visible).
// Registers/refreshes the anonymous visitor, and answers: is an admin online,
// and does this visitor have unread replies (including a chat an admin started)?

export const runtime = 'edge';

import { getAuthenticatedUser, AUTH_COOKIE_NAME } from '@/lib/serverSession';
import { authVisitor, adminOnline, listVisitorThreads, toPublicThread, pruneVisitors, missingTables, lastMessage } from '@/lib/supportServer';
import { cleanText } from '@/lib/support';

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try { body = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }

    const extra: Record<string, unknown> = {};
    const page = cleanText(body.page, 300);
    if (page) extra.page_url = page;

    // Attach the signed-in account (verified from the signed cookie) when present
    if ((request.headers.get('cookie') || '').includes(`${AUTH_COOKIE_NAME}=`)) {
      const user = await getAuthenticatedUser(request).catch(() => null);
      if (user) Object.assign(extra, { user_id: user.id, name: user.name, email: user.email });
    }

    const visitor = await authVisitor(body.visitorId, body.key, extra);
    if (!visitor) return Response.json({ error: 'Unknown visitor.', code: 'bad_visitor' }, { status: 401 });

    const [online, threadsRes] = await Promise.all([adminOnline(), listVisitorThreads(visitor.visitor_id)]);
    if (missingTables(threadsRes.error)) return Response.json({ adminOnline: false, threads: [], unread: 0, setup: false });
    const threads = await Promise.all((threadsRes.data || []).slice(0, 10).map(async (t) => {
      const pt = await toPublicThread(t);
      // Short preview so the bubble can show "HOOX Support: Hi there…" for new replies
      if (!pt.unread) return pt;
      const last = await lastMessage(t.id, 'admin');
      return { ...pt, preview: last ? { body: last.body.slice(0, 140), authorName: last.author_name || 'HOOX Support' } : null };
    }));
    const unread = threads.reduce((n, t) => n + t.unread, 0);

    if (Math.random() < 0.01) await pruneVisitors();
    return Response.json({ adminOnline: online, threads, unread, error: null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ adminOnline: false, threads: [], unread: 0, error: 'unavailable' }, { status: 500 });
  }
}
