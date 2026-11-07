// SERVER-ONLY: support emails. Ticket confirmations and HOOX replies go to
// the visitor (with a private link and, when receiving is set up, a
// reply+<thread>.<token>@reply.hoox.app reply-to address); new tickets and
// visitor replies alert the HOOX team.

import { sendEmail, notifyAdmins, appLink, emailEnv } from './email';
import { ticketReceivedEmail, ticketReplyEmail, adminAlertEmail } from './emailTemplates';
import { ensureEmailToken, replyAddress } from './supportServer';
import type { DbSupportThread } from './support';

const ticketLink = (t: DbSupportThread, token: string) => appLink(`/support/ticket/${t.id}?t=${token}`);
const adminLink = (t: DbSupportThread) => appLink(`/admin/support?thread=${t.id}`);
const label = (t: DbSupportThread) => (t.kind === 'ticket' ? `Ticket #${t.number}` : `Chat #${t.number}`);

export async function emailTicketCreated(t: DbSupportThread, message: string) {
  const token = await ensureEmailToken(t);
  const reply = replyAddress(t, token, emailEnv().replyDomain);
  if (t.email) {
    await sendEmail({
      to: t.email, kind: 'ticket_received', relatedId: t.id, replyTo: reply || undefined,
      ...ticketReceivedEmail({ name: t.name || '', number: t.number, subject: t.subject || 'Support request', link: ticketLink(t, token), canReply: !!reply }),
    });
  }
  await notifyAdmins({
    kind: 'admin_alert', relatedId: t.id, replyTo: t.email || undefined,
    ...adminAlertEmail({
      subject: `New ticket #${t.number}: ${t.subject || ''}`, heading: `New ticket #${t.number}`,
      lines: [`${t.name || 'Someone'}${t.email ? ` (${t.email})` : ''} · ${t.category || 'General'}${t.priority === 'high' ? ' · High priority' : ''}`, t.subject || ''],
      quote: message, link: adminLink(t), linkLabel: 'Reply in admin',
    }),
  });
}

export async function emailAdminsVisitorReply(t: DbSupportThread, body: string) {
  await notifyAdmins({
    kind: 'admin_alert', relatedId: t.id, replyTo: t.email || undefined,
    ...adminAlertEmail({ subject: `${label(t)} reply from ${t.name || t.email || 'visitor'}`, heading: `New reply on ${label(t).toLowerCase()}`, lines: [`${t.name || 'The visitor'} replied${t.subject ? ` to “${t.subject}”` : ''}.`], quote: body, link: adminLink(t), linkLabel: 'Reply in admin' }),
  });
}

export async function emailSupportReply(t: DbSupportThread, body: string, agent: string) {
  if (!t.email) return { ok: false, error: 'No email on this conversation.' };
  const token = await ensureEmailToken(t);
  const reply = replyAddress(t, token, emailEnv().replyDomain);
  return sendEmail({
    to: t.email, kind: 'support_reply', relatedId: t.id, replyTo: reply || undefined,
    ...ticketReplyEmail({ name: t.name || '', number: t.number, subject: t.subject || (t.kind === 'chat' ? 'Your chat with HOOX' : 'Support request'), body, agent: agent.replace(/\s*·\s*HOOX Support$/, ' from HOOX Support'), link: ticketLink(t, token), canReply: !!reply }),
  });
}
