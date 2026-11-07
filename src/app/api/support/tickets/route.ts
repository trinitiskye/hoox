// PUBLIC: submit a support ticket from /support/ticket.
// Returns the ticket number and a private link token for checking replies.

export const runtime = 'edge';

import { getAuthenticatedUser, AUTH_COOKIE_NAME } from '@/lib/serverSession';
import { authVisitor, createThread, addMessage, randomToken, sha256, missingTables, MIGRATION_MSG } from '@/lib/supportServer';
import { emailTicketCreated } from '@/lib/supportEmail';
import { cleanText, isEmail, TICKET_CATEGORIES, MESSAGE_MAX, SUBJECT_MAX } from '@/lib/support';

const fail = (error: string, status = 400) => Response.json({ ok: false, error }, { status });

export async function POST(request: Request) {
  try {
    let b: Record<string, unknown>;
    try { b = await request.json(); } catch { return fail('Invalid request.'); }
    if (typeof b.website_url === 'string' && b.website_url.trim()) return Response.json({ ok: true, number: 0 }); // honeypot

    const name = cleanText(b.name, 120);
    const email = cleanText(b.email, 254).toLowerCase();
    const category = cleanText(b.category, 60);
    const subject = cleanText(b.subject, SUBJECT_MAX);
    const message = cleanText(b.message, MESSAGE_MAX * 2);
    const link = cleanText(b.relatedUrl, 500);
    if (!name) return fail('Enter your name.');
    if (!isEmail(email)) return fail('Enter a valid email address.');
    if (!(TICKET_CATEGORIES as readonly string[]).includes(category)) return fail('Choose a topic.');
    if (!subject) return fail('Add a short subject.');
    if (message.length < 10) return fail('Tell us a little more (at least 10 characters).');

    let userId: string | null = null;
    if ((request.headers.get('cookie') || '').includes(`${AUTH_COOKIE_NAME}=`)) {
      const user = await getAuthenticatedUser(request).catch(() => null);
      if (user) userId = user.id;
    }
    // Link to the visitor's chat bubble identity, so replies also show there
    const visitor = b.visitorId ? await authVisitor(b.visitorId, b.key) : null;

    const token = randomToken();
    const { data, error } = await createThread({
      kind: 'ticket', status: 'open', priority: category === 'Report a bug' ? 'high' : 'normal',
      category, subject, name, email, user_id: userId, visitor_id: visitor?.visitor_id ?? null,
      access_hash: await sha256(token), email_token: randomToken(), started_by: 'visitor', page_url: link || null, last_message_from: 'visitor',
    });
    if (error || !data?.[0]) return fail(missingTables(error) ? MIGRATION_MSG : 'We couldn’t submit your ticket. Please try again.', 500);
    const thread = data[0];
    const sent = await addMessage(thread, 'visitor', link ? `${message}\n\nRelated page: ${link}` : message, name);
    if (!sent.message) return fail('We couldn’t submit your ticket. Please try again.', 500);
    await emailTicketCreated(thread, message);
    return Response.json({ ok: true, id: thread.id, number: thread.number, token, error: null });
  } catch {
    return fail('Something went wrong on our end. Please try again.', 500);
  }
}
