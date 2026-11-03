// Admin-only: start (or continue) a live chat with a visitor who's on the site.
export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { getVisitor, listVisitorThreads, createThread, addMessage, validId } from '@/lib/supportServer';
import { cleanText, MESSAGE_MAX } from '@/lib/support';

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  if (!validId(b.visitorId)) return Response.json({ error: 'Unknown visitor.' }, { status: 400 });
  const body = cleanText(b.body, MESSAGE_MAX);
  if (!body) return Response.json({ error: 'Type a message first.' }, { status: 400 });

  const visitor = await getVisitor(b.visitorId);
  if (!visitor) return Response.json({ error: 'That visitor has left the site.' }, { status: 404 });

  const { data: existing } = await listVisitorThreads(visitor.visitor_id);
  let thread = (existing || []).find((t) => t.kind === 'chat' && t.status !== 'closed') ?? null;
  if (!thread) {
    const { data, error } = await createThread({
      kind: 'chat', status: 'open', subject: 'Chat started by HOOX Support', category: 'Live chat',
      name: visitor.name, email: visitor.email, user_id: visitor.user_id, visitor_id: visitor.visitor_id,
      started_by: 'admin', page_url: visitor.page_url, last_message_from: 'admin',
    });
    if (error || !data?.[0]) return Response.json({ error: 'Couldn’t start the chat.' }, { status: 500 });
    thread = data[0];
  }
  const sent = await addMessage(thread, 'admin', body, admin.name ? `${admin.name.split(' ')[0]} · HOOX Support` : 'HOOX Support');
  if (!sent.message) return Response.json({ error: 'Couldn’t send.' }, { status: 500 });
  return Response.json({ threadId: thread.id, error: null });
}
