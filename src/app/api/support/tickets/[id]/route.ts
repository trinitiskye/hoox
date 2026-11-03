// PUBLIC: view and reply to one ticket/conversation with its private link token.
//   GET  ?t=token[&after]  → ticket + messages (marks admin replies read)
//   POST { t, body }       → visitor reply

export const runtime = 'edge';

import { getThread, canAccessThread, listMessages, addMessage, updateThread, toPublicThread, validId } from '@/lib/supportServer';
import { cleanText, toPublicMessage, MESSAGE_MAX } from '@/lib/support';

type Ctx = { params: Promise<{ id: string }> };
const fail = (error: string, status = 400) => Response.json({ error }, { status });

export async function GET(request: Request, { params }: Ctx) {
  const { id } = await params;
  if (!validId(id)) return fail('Ticket not found.', 404);
  const u = new URL(request.url);
  const thread = await getThread(id);
  if (!thread || !(await canAccessThread(thread, { token: u.searchParams.get('t') }))) return fail('Ticket not found, or the link has expired.', 404);
  const after = u.searchParams.get('after');
  const { data } = await listMessages(thread.id, after && !Number.isNaN(Date.parse(after)) ? after : null);
  const now = new Date().toISOString();
  await updateThread(thread.id, { visitor_last_read_at: now });
  return Response.json(
    { thread: { ...(await toPublicThread({ ...thread, visitor_last_read_at: now })), name: thread.name, email: thread.email }, messages: (data || []).map(toPublicMessage), error: null },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  if (!validId(id)) return fail('Ticket not found.', 404);
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return fail('Invalid request.'); }
  const thread = await getThread(id);
  if (!thread || !(await canAccessThread(thread, { token: b.t }))) return fail('Ticket not found, or the link has expired.', 404);
  if (thread.status === 'closed') return fail('This ticket is closed. Please submit a new one.', 409);
  const body = cleanText(b.body, MESSAGE_MAX);
  if (!body) return fail('Type a reply first.');
  const sent = await addMessage(thread, 'visitor', body, thread.name);
  if (!sent.message) return fail('Couldn’t send your reply.', 500);
  return Response.json({ message: toPublicMessage(sent.message), error: null });
}
