// Admin-only support inbox data + presence.
//   GET  ?kind=chat|ticket  → threads, visitors on the site now, agents, counts
//   POST { available? }     → heartbeat (keeps the "online" dot green) and
//                             optionally toggles availability for live chat

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { listThreadsAdmin, listOnlineVisitors, listAgents, heartbeatAgent, missingTables, MIGRATION_MSG } from '@/lib/supportServer';
import { AGENT_ONLINE_MS, VISITOR_ONLINE_MS, type DbSupportThread } from '@/lib/support';

const adminUnread = (t: DbSupportThread) =>
  t.last_message_from === 'visitor' && (!t.admin_last_read_at || t.last_message_at > t.admin_last_read_at);

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const kind = new URL(request.url).searchParams.get('kind') || undefined;
  const [threads, visitors, agents] = await Promise.all([
    listThreadsAdmin(kind),
    listOnlineVisitors(new Date(Date.now() - VISITOR_ONLINE_MS).toISOString()),
    listAgents(),
  ]);
  if (threads.error) return Response.json({ error: missingTables(threads.error) ? MIGRATION_MSG : 'Couldn’t load support.' }, { status: 500 });

  const list = (threads.data || []).map(({ access_hash: _h, ...t }) => ({ ...t, unread: adminUnread(t as DbSupportThread) }));
  // Latest open chat per visitor, so "Chat" opens the existing conversation
  const openChatByVisitor: Record<string, string> = {};
  list.filter((t) => t.kind === 'chat' && t.status !== 'closed' && t.visitor_id)
    .forEach((t) => { openChatByVisitor[t.visitor_id!] ??= t.id; });

  const now = Date.now();
  const me = (agents.data || []).find((a) => a.user_id === admin.id);
  return Response.json({
    threads: list,
    visitors: (visitors.data || []).map((v) => ({ ...v, openThreadId: openChatByVisitor[v.visitor_id] ?? null })),
    agents: (agents.data || []).map((a) => ({ ...a, online: a.available && now - Date.parse(a.last_seen) < AGENT_ONLINE_MS })),
    available: me ? me.available : true,
    counts: {
      unreadChats: list.filter((t) => t.kind === 'chat' && t.unread).length,
      unreadTickets: list.filter((t) => t.kind === 'ticket' && t.unread).length,
      openTickets: list.filter((t) => t.kind === 'ticket' && (t.status === 'open' || t.status === 'pending')).length,
    },
    error: null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  let b: Record<string, unknown> = {};
  try { b = await request.json(); } catch { /* heartbeat with no body */ }
  const available = typeof b.available === 'boolean' ? b.available : undefined;
  const { data, error } = await heartbeatAgent(admin.id, admin.name, available);
  if (error) return Response.json({ error: missingTables(error) ? MIGRATION_MSG : 'Couldn’t update status.' }, { status: 500 });

  // Unread count for the admin nav badge
  const threads = await listThreadsAdmin();
  const unread = (threads.data || []).filter(adminUnread).length;
  return Response.json({ available: data?.[0]?.available ?? available ?? true, unread, error: null }, { headers: { 'Cache-Control': 'no-store' } });
}
