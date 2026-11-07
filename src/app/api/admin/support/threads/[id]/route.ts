// Admin-only: one support conversation or ticket.
//   GET   [?after]                          → thread + messages (marks read)
//   POST  { body }                          → reply as HOOX Support
//   PATCH { status?, priority?, adminNotes? }

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { getThread, listMessages, addMessage, updateThread, validId, getVisitor } from '@/lib/supportServer';
import { emailSupportReply } from '@/lib/supportEmail';
import {
  cleanText, toPublicMessage, MESSAGE_MAX, THREAD_STATUSES, THREAD_PRIORITIES, VISITOR_ONLINE_MS,
  type DbSupportThread, type ThreadStatus, type ThreadPriority,
} from '@/lib/support';

type Ctx = { params: Promise<{ id: string }> };
const strip = ({ access_hash: _h, ...t }: DbSupportThread) => t;

export async function GET(request: Request, { params }: Ctx) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  if (!validId(id)) return Response.json({ error: 'Not found.' }, { status: 404 });
  const thread = await getThread(id);
  if (!thread) return Response.json({ error: 'Not found.' }, { status: 404 });

  const after = new URL(request.url).searchParams.get('after');
  const [{ data }, visitor] = await Promise.all([
    listMessages(id, after && !Number.isNaN(Date.parse(after)) ? after : null),
    thread.visitor_id ? getVisitor(thread.visitor_id) : Promise.resolve(null),
  ]);
  const now = new Date().toISOString();
  if (thread.last_message_from === 'visitor') await updateThread(id, { admin_last_read_at: now });
  return Response.json({
    thread: strip(thread),
    messages: (data || []).map(toPublicMessage),
    visitor: visitor ? { online: Date.now() - Date.parse(visitor.last_seen) < VISITOR_ONLINE_MS, lastSeen: visitor.last_seen, page: visitor.page_url } : null,
    error: null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request, { params }: Ctx) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const thread = validId(id) ? await getThread(id) : null;
  if (!thread) return Response.json({ error: 'Not found.' }, { status: 404 });
  const body = cleanText(b.body, MESSAGE_MAX);
  if (!body) return Response.json({ error: 'Type a reply first.' }, { status: 400 });
  const sent = await addMessage(thread, 'admin', body, admin.name ? `${admin.name.split(' ')[0]} · HOOX Support` : 'HOOX Support');
  if (!sent.message) return Response.json({ error: 'Couldn’t send.' }, { status: 500 });
  // Replying to an open ticket marks it as waiting on the visitor
  if (thread.kind === 'ticket' && thread.status === 'open') await updateThread(id, { status: 'pending' });
  // Email the reply (tickets, and chats where we have the visitor's email)
  const mail = thread.email ? await emailSupportReply(thread, body, sent.message.author_name || 'HOOX Support') : null;
  return Response.json({ message: toPublicMessage(sent.message), emailed: mail?.ok ?? false, emailError: mail && !mail.ok ? mail.error : null, error: null });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const patch: Partial<DbSupportThread> = {};
  if ('status' in b) {
    if (!THREAD_STATUSES.includes(b.status as ThreadStatus)) return Response.json({ error: 'Unknown status.' }, { status: 400 });
    patch.status = b.status as ThreadStatus;
  }
  if ('priority' in b) {
    if (!THREAD_PRIORITIES.includes(b.priority as ThreadPriority)) return Response.json({ error: 'Unknown priority.' }, { status: 400 });
    patch.priority = b.priority as ThreadPriority;
  }
  if ('adminNotes' in b) patch.admin_notes = cleanText(b.adminNotes, 4000) || null;
  if (!Object.keys(patch).length) return Response.json({ error: 'Nothing to update.' }, { status: 400 });
  const { data, error } = await updateThread(id, patch);
  if (error || !data?.[0]) return Response.json({ error: 'Couldn’t save.' }, { status: 500 });
  if (patch.status === 'closed' || patch.status === 'resolved') {
    const t = data[0];
    await addMessage(t, 'system', patch.status === 'closed' ? 'This conversation was closed by HOOX Support.' : 'Marked as resolved. Reply anytime if you still need help.', null);
  }
  return Response.json({ thread: strip(data[0]), error: null });
}
