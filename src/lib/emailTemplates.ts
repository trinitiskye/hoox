// SERVER-ONLY: HOOX email templates. Each returns { subject, html, text }.
// One shared layout (logo, card, button, footer) with inline styles, since
// email clients ignore stylesheets.

import { appLink, emailEnv } from './email';

export interface Rendered { subject: string; html: string; text: string }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nl2br = (s: string) => esc(s).replace(/\n/g, '<br>');

interface Layout {
  subject: string;
  preheader?: string;
  heading: string;
  paragraphs: string[];          // plain text; line breaks kept
  quote?: string;                // a quoted message (support replies)
  button?: { label: string; url: string };
  after?: string[];              // small print under the button
}

export function render(l: Layout): Rendered {
  const { appUrl, support } = emailEnv();
  const p = (t: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:23px;color:#2E3F5C">${nl2br(t)}</p>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(l.subject)}</title></head>
<body style="margin:0;padding:0;background:#F2F6F9;font-family:Roboto,Helvetica,Arial,sans-serif">
${l.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(l.preheader)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F6F9"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 4px 16px"><a href="${appUrl}"><img src="${appUrl}/hoox_logo.png" width="120" alt="HOOX" style="display:block;border:0;height:auto"></a></td></tr>
<tr><td style="background:#ffffff;border:1px solid #E3EAF1;border-radius:10px;padding:28px 28px 22px">
<h1 style="margin:0 0 16px;font-family:Montserrat,Helvetica,Arial,sans-serif;font-size:21px;line-height:28px;color:#0D1B4C">${esc(l.heading)}</h1>
${l.paragraphs.map(p).join('')}
${l.quote ? `<div style="margin:4px 0 18px;padding:12px 16px;border-left:3px solid #0E7C7B;background:#F5F9FA;font-size:15px;line-height:23px;color:#1F2D3D">${nl2br(l.quote)}</div>` : ''}
${l.button ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 18px"><tr><td style="border-radius:8px;background:#0E7C7B"><a href="${esc(l.button.url)}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px">${esc(l.button.label)}</a></td></tr></table>` : ''}
${(l.after || []).map((t) => `<p style="margin:0 0 8px;font-size:13px;line-height:19px;color:#6B7D93">${nl2br(t)}</p>`).join('')}
</td></tr>
<tr><td style="padding:16px 4px;font-size:12px;line-height:18px;color:#8A9AB0">HOOX · Fishing tournaments, made easy · <a href="${appUrl}" style="color:#8A9AB0">hoox.app</a><br>Questions? Email <a href="mailto:${support}" style="color:#8A9AB0">${support}</a></td></tr>
</table></td></tr></table></body></html>`;
  const text = [l.heading, '', ...l.paragraphs.flatMap((t) => [t, '']), ...(l.quote ? [l.quote.split('\n').map((x) => `> ${x}`).join('\n'), ''] : []),
    ...(l.button ? [`${l.button.label}: ${l.button.url}`, ''] : []), ...(l.after || []).flatMap((t) => [t, '']), '—', `HOOX · ${appUrl}`, `Questions? ${support}`].join('\n');
  return { subject: l.subject, html, text };
}

const first = (name: string) => (name || '').trim().split(/\s+/)[0] || 'there';

/* ------------------------------- accounts ------------------------------- */

const ROLE_WELCOME: Record<string, { line: string; cta: string; path: string }> = {
  angler: { line: 'Find tournaments near you, register in a few taps, and submit your catches from the water.', cta: 'Find a tournament', path: '/tournaments' },
  director: { line: 'Your tournament director account is ready. HOOX helps you list tournaments, take registrations, set up judging and prizes, and run live leaderboards.', cta: 'Sign in to HOOX', path: '/login' },
  judge: { line: 'You’ll review and approve catch submissions for the tournaments you’re assigned to.', cta: 'Sign in to HOOX', path: '/login' },
  sponsor: { line: 'Thanks for your interest in partnering with HOOX. Our team will review your application and get back to you shortly.', cta: 'Visit HOOX', path: '/' },
};

export function welcomeEmail(name: string, role: string, pending: boolean): Rendered {
  const w = ROLE_WELCOME[role] || ROLE_WELCOME.angler;
  return render({
    subject: pending ? 'Your HOOX account is waiting for approval' : 'Welcome to HOOX',
    preheader: pending ? 'We’ll email you as soon as it’s approved.' : 'Your account is ready.',
    heading: pending ? `Thanks for signing up, ${first(name)}` : `Welcome to HOOX, ${first(name)}!`,
    paragraphs: pending
      ? [role === 'judge' ? 'Your judge account is waiting for your tournament director to approve it.' : 'Your account is waiting for approval from the HOOX team.', 'We’ll email you as soon as it’s approved.']
      : [w.line],
    button: pending ? undefined : { label: w.cta, url: appLink(w.path) },
  });
}

export function accountApprovedEmail(name: string): Rendered {
  return render({
    subject: 'Your HOOX account is approved',
    heading: `You’re all set, ${first(name)}`,
    paragraphs: ['Your HOOX account has been approved. You can sign in now.'],
    button: { label: 'Sign in', url: appLink('/login') },
  });
}

export function judgeAwaitingDirectorEmail(directorName: string, judgeName: string, judgeEmail: string): Rendered {
  return render({
    subject: `${judgeName} wants to judge your tournaments`,
    heading: `A judge is waiting for your approval`,
    paragraphs: [`Hi ${first(directorName)}, ${judgeName} (${judgeEmail}) created a HOOX judge account and listed you as their tournament director.`, 'Approve them to let them review catch submissions for your tournaments.'],
    button: { label: 'Sign in to review', url: appLink('/login') },
  });
}

export function directorInviteFromJudgeEmail(judgeName: string): Rendered {
  return render({
    subject: `${judgeName} invited you to run tournaments on HOOX`,
    heading: 'You’re invited to HOOX',
    paragraphs: [`${judgeName} signed up as a tournament judge on HOOX and listed you as their tournament director.`, 'Create a free director account to list tournaments, take registrations and run live leaderboards, with your judges reviewing catches.'],
    button: { label: 'Create a director account', url: appLink('/register/director') },
  });
}

export function passwordResetEmail(name: string, link: string): Rendered {
  return render({
    subject: 'Reset your HOOX password',
    preheader: 'This link expires in 1 hour.',
    heading: 'Reset your password',
    paragraphs: [`Hi ${first(name)}, we received a request to reset your HOOX password.`],
    button: { label: 'Choose a new password', url: link },
    after: ['This link expires in 1 hour and can be used once.', 'If you didn’t ask to reset your password, you can ignore this email; your password won’t change.'],
  });
}

/* ------------------------------ tournaments ----------------------------- */

export function judgeInviteEmail(o: { name: string; tournament: string; director: string; link: string; hasAccount: boolean }): Rendered {
  return render({
    subject: `You’re invited to judge ${o.tournament}`,
    heading: `Judge ${o.tournament}`,
    paragraphs: [
      `Hi ${first(o.name)}, ${o.director || 'the tournament director'} added you as a judge for ${o.tournament} on HOOX.`,
      o.hasAccount ? 'You can review and approve catch submissions for this tournament when you sign in.' : 'Create your free judge account with this email address to accept. You’ll be assigned to the tournament automatically.',
    ],
    button: { label: o.hasAccount ? 'Sign in to HOOX' : 'Accept and create account', url: o.link },
  });
}

export function teamInviteEmail(o: { team: string; tournament: string; captain: string; link: string; hasAccount: boolean }): Rendered {
  return render({
    subject: `${o.captain} invited you to join ${o.team}`,
    heading: `Join ${o.team}`,
    paragraphs: [`${o.captain} invited you to fish ${o.tournament} on their team, ${o.team}.`, o.hasAccount ? 'Sign in to HOOX to accept or decline.' : 'Create a free HOOX angler account with this email address to accept.'],
    button: { label: o.hasAccount ? 'Respond to the invite' : 'Create an account', url: o.link },
  });
}

/* -------------------------------- support ------------------------------- */

export function ticketReceivedEmail(o: { name: string; number: number; subject: string; link: string; canReply: boolean }): Rendered {
  return render({
    subject: `[HOOX #${o.number}] We got your request: ${o.subject}`,
    heading: `We got your request (#${o.number})`,
    paragraphs: [`Hi ${first(o.name)}, thanks for contacting HOOX Support. We’ve received your ticket “${o.subject}” and will reply as soon as we can.`],
    button: { label: 'View your ticket', url: o.link },
    after: [o.canReply ? 'You can add details by replying to this email.' : 'Keep this email: the link above is how you check for replies.'],
  });
}

export function ticketReplyEmail(o: { name: string; number: number; subject: string; body: string; agent: string; link: string; canReply: boolean }): Rendered {
  return render({
    subject: `[HOOX #${o.number}] Re: ${o.subject}`,
    preheader: o.body.slice(0, 120),
    heading: `${o.agent} replied to your ticket`,
    paragraphs: [`Hi ${first(o.name)},`],
    quote: o.body,
    button: { label: 'View the conversation', url: o.link },
    after: [o.canReply ? 'Reply to this email to answer. Please keep your reply above this line.' : 'Answer from the ticket page using the button above.'],
  });
}

/* ------------------------------ admin alerts ---------------------------- */

export function adminAlertEmail(o: { subject: string; heading: string; lines: string[]; link: string; linkLabel?: string; quote?: string }): Rendered {
  return render({ subject: `[HOOX admin] ${o.subject}`, heading: o.heading, paragraphs: o.lines, quote: o.quote, button: { label: o.linkLabel || 'Open in admin', url: o.link } });
}

export function testEmail(): Rendered {
  return render({ subject: 'HOOX test email', heading: 'Email is working', paragraphs: ['This is a test email from HOOX Admin → Settings → Email. If you’re reading it, sending is set up correctly.'] });
}
