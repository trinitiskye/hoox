// Resend "email.received" webhook: replies to support emails.
//
// Ticket emails go out with Reply-To reply+<thread id>.<token>@<EMAIL_REPLY_DOMAIN>.
// When someone replies, Resend posts here; we check the signature, fetch the
// message, keep only the new text (not the quoted history) and add it to the
// ticket as a visitor reply, then alert the HOOX team. Anything else sent to
// the reply domain is forwarded to SUPPORT_EMAIL.

export const runtime = 'edge';

import { verifyWebhook, getReceivedEmail, logInbound, notifyAdmins, appLink } from '@/lib/email';
import { adminAlertEmail } from '@/lib/emailTemplates';
import { getThread, addMessage, parseReplyAddress } from '@/lib/supportServer';
import { emailAdminsVisitorReply } from '@/lib/supportEmail';
import { MESSAGE_MAX } from '@/lib/support';
import { htmlToText, newText } from '@/lib/inboundEmail';

interface Received { type?: string; data?: { email_id?: string; from?: string; to?: string[]; received_for?: string[]; subject?: string } }

export async function POST(request: Request) {
  const raw = await request.text();
  if (!(await verifyWebhook(raw, request.headers))) return Response.json({ error: 'Invalid signature.' }, { status: 401 });
  let evt: Received;
  try { evt = JSON.parse(raw); } catch { return Response.json({ error: 'Invalid payload.' }, { status: 400 }); }
  if (evt.type !== 'email.received' || !evt.data?.email_id) return Response.json({ ok: true });

  const d = evt.data;
  const from = d.from || '';
  const recipients = [...(d.to || []), ...(d.received_for || [])];
  const target = recipients.map(parseReplyAddress).find(Boolean) || null;
  const content = await getReceivedEmail(d.email_id!);
  const full = content ? (content.text?.trim() ? content.text : htmlToText(content.html || '')) : '';
  const subject = d.subject || content?.subject || '(no subject)';

  const thread = target ? await getThread(target.id) : null;
  if (!thread || !thread.email_token || thread.email_token !== target!.token) {
    // Not a ticket reply: pass it on to the HOOX inbox
    await logInbound({ kind: 'unmatched', from, to: recipients.join(', '), subject, providerId: d.email_id, error: target ? 'Unknown ticket or token' : null });
    await notifyAdmins({ kind: 'admin_alert', replyTo: from || undefined, ...adminAlertEmail({ subject: `Email to the reply address: ${subject}`, heading: 'An email arrived at the reply address', lines: [`From ${from || 'unknown sender'}. It didn’t match a support ticket, so it’s forwarded here.`], quote: full.slice(0, 4000) || '(empty message)', link: appLink('/admin/support'), linkLabel: 'Open Support' }) });
    return Response.json({ ok: true, matched: false });
  }

  let body = newText(full).slice(0, MESSAGE_MAX);
  if (!body) body = '(Replied by email with no new text.)';
  if (thread.email && from && from.toLowerCase() !== thread.email.toLowerCase()) body = `${body}\n\n(Sent by email from ${from})`;
  const sent = await addMessage(thread, 'visitor', body.slice(0, MESSAGE_MAX), thread.name);
  await logInbound({ kind: 'support_reply', from, to: recipients.join(', '), subject, relatedId: thread.id, providerId: d.email_id, error: sent.message ? null : sent.error });
  if (sent.message) await emailAdminsVisitorReply(thread, body);
  return Response.json({ ok: true, matched: true });
}
