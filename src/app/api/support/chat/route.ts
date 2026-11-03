// PUBLIC chat bubble conversations, authorized by the visitor's id + secret key.
//   GET  ?visitorId&key&threadId[&after]  → messages (marks them read)
//   POST { action: 'start', mode: 'live' | 'question', body, name?, email?, page? }
//   POST { action: 'send', threadId, body }

export const runtime = 'edge';

import {
  authVisitor, adminOnline, createThread, getThread, addMessage, listMessages, updateThread,
  toPublicThread, canAccessThread, randomToken, sha256, validId, missingTables, MIGRATION_MSG,
} from '@/lib/supportServer';
import { cleanText, isEmail, toPublicMessage, MESSAGE_MAX } from '@/lib/support';

const fail = (error: string, status = 400, code = 'invalid') => Response.json({ error, code }, { status });

export async function GET(request: Request) {
  try {
    const u = new URL(request.url);
    const threadId = u.searchParams.get('threadId');
    if (!validId(threadId)) return fail('Missing conversation.');
    const thread = await getThread(threadId);
    if (!thread || !(await canAccessThread(thread, { visitorId: u.searchParams.get('visitorId'), key: u.searchParams.get('key') }))) {
      return fail('Conversation not found.', 404, 'not_found');
    }
    const after = u.searchParams.get('after');
    const { data } = await listMessages(thread.id, after && !Number.isNaN(Date.parse(after)) ? after : null);
    const messages = (data || []).map(toPublicMessage);
    if (messages.some((m) => m.author === 'admin')) await updateThread(thread.id, { visitor_last_read_at: new Date().toISOString() });
    return Response.json(
      { thread: { ...(await toPublicThread({ ...thread, visitor_last_read_at: new Date().toISOString() })) }, messages, adminOnline: await adminOnline(), error: null },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return fail('Something went wrong.', 500, 'unknown');
  }
}

export async function POST(request: Request) {
  try {
    let b: Record<string, unknown>;
    try { b = await request.json(); } catch { return fail('Invalid request.'); }

    const visitor = await authVisitor(b.visitorId, b.key);
    if (!visitor) return fail('Please refresh the page and try again.', 401, 'bad_visitor');

    const body = cleanText(b.body, MESSAGE_MAX);
    if (!body) return fail('Type a message first.');

    if (b.action === 'start') {
      const mode = b.mode === 'live' ? 'live' : 'question';
      const name = cleanText(b.name, 120) || visitor.name || null;
      const email = cleanText(b.email, 254).toLowerCase() || visitor.email || null;
      if (email && !isEmail(email)) return fail('Enter a valid email address.');
      if (mode === 'question' && !email) return fail('Add your email so we can reply.');

      const token = randomToken();
      const { data, error } = await createThread({
        kind: 'chat', status: 'open', subject: body.slice(0, 120), name, email,
        user_id: visitor.user_id, visitor_id: visitor.visitor_id, access_hash: await sha256(token),
        started_by: 'visitor', page_url: cleanText(b.page, 300) || visitor.page_url, last_message_from: 'visitor',
        category: mode === 'live' ? 'Live chat' : 'Question',
      });
      if (error || !data?.[0]) return fail(missingTables(error) ? MIGRATION_MSG : 'Couldn’t start the conversation.', 500, 'unknown');
      const thread = data[0];
      const sent = await addMessage(thread, 'visitor', body, name);
      if (!sent.message) return fail('Couldn’t send your message.', 500, 'unknown');
      const online = await adminOnline();
      if (mode === 'live' && !online) {
        await addMessage({ ...thread, last_message_from: 'visitor' }, 'system', 'Our team just went offline. We’ll reply here and by email as soon as we’re back.', null);
      }
      return Response.json({ thread: await toPublicThread(thread), message: toPublicMessage(sent.message), token, adminOnline: online, error: null });
    }

    if (b.action === 'send') {
      if (!validId(b.threadId)) return fail('Missing conversation.');
      const thread = await getThread(b.threadId);
      if (!thread || thread.visitor_id !== visitor.visitor_id) return fail('Conversation not found.', 404, 'not_found');
      if (thread.status === 'closed') return fail('This conversation is closed. Start a new one.', 409, 'closed');
      const sent = await addMessage(thread, 'visitor', body, thread.name || visitor.name);
      if (!sent.message) return fail('Couldn’t send your message.', 500, 'unknown');
      return Response.json({ message: toPublicMessage(sent.message), error: null });
    }

    return fail('Unknown action.');
  } catch {
    return fail('Something went wrong.', 500, 'unknown');
  }
}
