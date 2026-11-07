// SERVER-ONLY: sending email through Resend (https://resend.com), plus the
// email log (public.email_log).
//
// Environment (Cloudflare Pages → Settings → Environment variables):
//   RESEND_API_KEY         required to send; without it emails are logged as "skipped"
//   EMAIL_FROM             "HOOX <no-reply@hoox.app>"
//   SUPPORT_EMAIL          where admin alerts go and the public support address,
//                          e.g. support@hoox.app (Cloudflare Email Routing forwards it)
//   EMAIL_REPLY_DOMAIN     receiving domain on Resend for ticket replies, e.g. reply.hoox.app
//   RESEND_WEBHOOK_SECRET  signing secret of the Resend "email.received" webhook
//   APP_URL                https://hoox.app (links in emails)

import { supabaseAdminFetch } from './supabaseAdmin';

export const emailEnv = () => ({
  apiKey: process.env.RESEND_API_KEY || '',
  from: process.env.EMAIL_FROM || 'HOOX <no-reply@hoox.app>',
  support: process.env.SUPPORT_EMAIL || 'support@hoox.app',
  replyDomain: process.env.EMAIL_REPLY_DOMAIN || '',
  webhookSecret: process.env.RESEND_WEBHOOK_SECRET || '',
  appUrl: (process.env.APP_URL || 'https://hoox.app').replace(/\/+$/, ''),
  apiBase: (process.env.RESEND_API_URL || 'https://api.resend.com').replace(/\/+$/, ''), // override only for local testing
});

export const emailConfigured = () => !!emailEnv().apiKey;

/** Absolute link into the site */
export const appLink = (path: string) => `${emailEnv().appUrl}${path.startsWith('/') ? path : `/${path}`}`;

export interface OutgoingEmail {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  kind: string;            // for the log, e.g. "welcome"
  replyTo?: string;
  relatedId?: string | null;
  from?: string;
}

export interface SendResult { ok: boolean; skipped?: boolean; id?: string | null; error?: string | null }

async function log(row: Record<string, unknown>) {
  await supabaseAdminFetch('email_log', { method: 'POST', body: JSON.stringify(row) }).catch(() => null);
}

/** Send one email. Never throws: failures are logged and returned. */
export async function sendEmail(m: OutgoingEmail): Promise<SendResult> {
  const env = emailEnv();
  const to = (Array.isArray(m.to) ? m.to : [m.to]).map((x) => x.trim()).filter(Boolean);
  const base = { kind: m.kind, to_email: to.join(', '), from_email: m.from || env.from, subject: m.subject.slice(0, 300), related_id: m.relatedId ?? null, direction: 'out' };
  if (!to.length) return { ok: false, error: 'No recipient.' };
  if (!env.apiKey) {
    await log({ ...base, status: 'skipped', error: 'RESEND_API_KEY is not set' });
    return { ok: false, skipped: true, error: 'Email isn’t set up yet.' };
  }
  try {
    const res = await fetch(`${env.apiBase}/emails`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: m.from || env.from, to, subject: m.subject, html: m.html, text: m.text,
        ...(m.replyTo ? { reply_to: m.replyTo } : {}),
        tags: [{ name: 'kind', value: m.kind.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50) }],
      }),
    });
    const j = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
    if (!res.ok) {
      const error = j.message || `Resend error ${res.status}`;
      await log({ ...base, status: 'failed', error: error.slice(0, 500) });
      return { ok: false, error };
    }
    await log({ ...base, status: 'sent', provider_id: j.id ?? null });
    return { ok: true, id: j.id ?? null };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Network error';
    await log({ ...base, status: 'failed', error });
    return { ok: false, error };
  }
}

/** Alert the HOOX team (SUPPORT_EMAIL) */
export const notifyAdmins = (m: Omit<OutgoingEmail, 'to'>) => sendEmail({ ...m, to: emailEnv().support });

/** Record an incoming email in the log */
export const logInbound = (row: { kind: string; from: string; to: string; subject: string; relatedId?: string | null; error?: string | null; providerId?: string | null }) =>
  log({ direction: 'in', status: 'received', kind: row.kind, from_email: row.from, to_email: row.to, subject: row.subject.slice(0, 300), related_id: row.relatedId ?? null, error: row.error ?? null, provider_id: row.providerId ?? null });

/** Fetch a received email's content from Resend */
export async function getReceivedEmail(id: string): Promise<{ from: string; to: string[]; subject: string; text: string | null; html: string | null } | null> {
  const env = emailEnv();
  if (!env.apiKey) return null;
  const res = await fetch(`${env.apiBase}/emails/receiving/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${env.apiKey}` } }).catch(() => null);
  if (!res?.ok) return null;
  return res.json();
}

/** Verify a Resend (Svix) webhook signature against the raw body */
export async function verifyWebhook(raw: string, headers: Headers): Promise<boolean> {
  const secret = emailEnv().webhookSecret;
  const id = headers.get('svix-id'), ts = headers.get('svix-timestamp'), sig = headers.get('svix-signature');
  if (!secret || !id || !ts || !sig) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false; // 5-minute replay window
  const keyBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, '')), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${raw}`));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return sig.split(' ').some((part) => { const [v, s] = part.split(','); return v === 'v1' && s === expected; });
}
