// SERVER-ONLY support data access + helpers (service role).
import { supabaseAdminFetch } from './supabaseAdmin';
import {
  AGENT_ONLINE_MS, type DbSupportThread, type DbSupportMessage, type DbSupportVisitor,
  type PublicThread, type MessageAuthor,
} from './support';

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}
export const randomToken = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, '0')).join('');

const enc = encodeURIComponent;
const ID_RE = /^[A-Za-z0-9-]{8,64}$/;
export const validId = (v: unknown): v is string => typeof v === 'string' && ID_RE.test(v);

/* ----------------------------- visitors ----------------------------- */

export async function getVisitor(visitorId: string) {
  const { data } = await supabaseAdminFetch<DbSupportVisitor[]>(`support_visitors?visitor_id=eq.${enc(visitorId)}&select=*`);
  return data?.[0] ?? null;
}

/**
 * Check (or first-time register) a visitor's id + secret key. Returns the
 * visitor row, or null if the key doesn't match an existing visitor.
 */
export async function authVisitor(visitorId: unknown, key: unknown, extra: Partial<DbSupportVisitor> = {}): Promise<DbSupportVisitor | null> {
  if (!validId(visitorId) || typeof key !== 'string' || key.length < 16 || key.length > 128) return null;
  const hash = await sha256(key);
  const existing = await getVisitor(visitorId);
  const now = new Date().toISOString();
  if (existing) {
    if (existing.key_hash !== hash) return null;
    const patch = { last_seen: now, ...extra };
    const { data } = await supabaseAdminFetch<DbSupportVisitor[]>(`support_visitors?visitor_id=eq.${enc(visitorId)}`, { method: 'PATCH', body: JSON.stringify(patch) });
    return data?.[0] ?? { ...existing, ...patch };
  }
  const row = { visitor_id: visitorId, key_hash: hash, last_seen: now, ...extra };
  const { data, error } = await supabaseAdminFetch<DbSupportVisitor[]>('support_visitors', { method: 'POST', body: JSON.stringify(row) });
  if (error) return null;
  return data?.[0] ?? null;
}

export async function listOnlineVisitors(sinceIso: string) {
  return supabaseAdminFetch<DbSupportVisitor[]>(`support_visitors?select=visitor_id,user_id,name,email,page_url,last_seen,created_at&last_seen=gte.${enc(sinceIso)}&order=last_seen.desc&limit=100`);
}

/** Occasionally drop visitors not seen for a day */
export async function pruneVisitors() {
  const cutoff = new Date(Date.now() - 86_400_000).toISOString();
  await supabaseAdminFetch(`support_visitors?last_seen=lt.${enc(cutoff)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }).catch(() => undefined);
}

/* ------------------------------ agents ------------------------------ */

export async function heartbeatAgent(userId: string, name: string, available?: boolean) {
  const row: Record<string, unknown> = { user_id: userId, name, last_seen: new Date().toISOString() };
  if (available !== undefined) row.available = available;
  return supabaseAdminFetch<{ user_id: string; available: boolean; last_seen: string; name: string }[]>('support_agents?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(row),
  });
}

export async function listAgents() {
  return supabaseAdminFetch<{ user_id: string; name: string | null; available: boolean; last_seen: string }[]>('support_agents?select=*');
}

/** Is any admin available and active in the dashboard right now? */
export async function adminOnline(): Promise<boolean> {
  const since = new Date(Date.now() - AGENT_ONLINE_MS).toISOString();
  const { data } = await supabaseAdminFetch<{ user_id: string }[]>(`support_agents?select=user_id&available=eq.true&last_seen=gte.${enc(since)}&limit=1`);
  return !!data?.length;
}

/* ------------------------------ threads ----------------------------- */

export async function createThread(t: Partial<DbSupportThread>) {
  return supabaseAdminFetch<DbSupportThread[]>('support_threads', { method: 'POST', body: JSON.stringify(t) });
}
export async function getThread(id: string) {
  const { data } = await supabaseAdminFetch<DbSupportThread[]>(`support_threads?id=eq.${enc(id)}&select=*`);
  return data?.[0] ?? null;
}
export async function updateThread(id: string, patch: Partial<DbSupportThread>) {
  return supabaseAdminFetch<DbSupportThread[]>(`support_threads?id=eq.${enc(id)}`, { method: 'PATCH', body: JSON.stringify(patch) });
}
export async function listVisitorThreads(visitorId: string) {
  return supabaseAdminFetch<DbSupportThread[]>(`support_threads?visitor_id=eq.${enc(visitorId)}&select=*&order=last_message_at.desc&limit=20`);
}
export async function listThreadsAdmin(kind?: string) {
  const k = kind === 'chat' || kind === 'ticket' ? `&kind=eq.${kind}` : '';
  return supabaseAdminFetch<DbSupportThread[]>(`support_threads?select=*${k}&order=last_message_at.desc&limit=300`);
}

/* ------------------------------ messages ---------------------------- */

export async function listMessages(threadId: string, afterIso?: string | null) {
  const after = afterIso ? `&created_at=gt.${enc(afterIso)}` : '';
  return supabaseAdminFetch<DbSupportMessage[]>(`support_messages?thread_id=eq.${enc(threadId)}${after}&select=*&order=created_at.asc&limit=500`);
}

export async function lastMessage(threadId: string, author?: MessageAuthor) {
  const a = author ? `&author=eq.${author}` : '';
  const { data } = await supabaseAdminFetch<DbSupportMessage[]>(`support_messages?thread_id=eq.${enc(threadId)}${a}&select=*&order=created_at.desc&limit=1`);
  return data?.[0] ?? null;
}

/** Add a message and bump the thread's last activity. */
export async function addMessage(thread: DbSupportThread, author: MessageAuthor, body: string, authorName: string | null) {
  const { data, error } = await supabaseAdminFetch<DbSupportMessage[]>('support_messages', {
    method: 'POST',
    body: JSON.stringify({ thread_id: thread.id, author, author_name: authorName, body }),
  });
  if (error || !data?.[0]) return { message: null, error: error || 'Could not send.' };
  const m = data[0];
  // System notes don't change who's waiting on whom
  if (author === 'system') return { message: m, error: null };
  const patch: Partial<DbSupportThread> = { last_message_at: m.created_at, last_message_from: author };
  if (author === 'visitor') {
    patch.visitor_last_read_at = m.created_at;
    // A visitor reply re-opens a waiting or resolved conversation
    if (thread.status !== 'open') patch.status = 'open';
  } else if (author === 'admin') {
    patch.admin_last_read_at = m.created_at;
  }
  await updateThread(thread.id, patch);
  return { message: m, error: null };
}

/** Count messages from the other side since `sinceIso` */
export async function countUnread(threadId: string, from: MessageAuthor, sinceIso: string | null) {
  const since = sinceIso ? `&created_at=gt.${enc(sinceIso)}` : '';
  const { data } = await supabaseAdminFetch<{ id: string }[]>(`support_messages?thread_id=eq.${enc(threadId)}&author=eq.${from}${since}&select=id&limit=99`);
  return data?.length ?? 0;
}

export async function toPublicThread(t: DbSupportThread): Promise<PublicThread> {
  const unread = t.last_message_from === 'admin' && (!t.visitor_last_read_at || t.last_message_at > t.visitor_last_read_at)
    ? await countUnread(t.id, 'admin', t.visitor_last_read_at)
    : 0;
  return {
    id: t.id, number: t.number, kind: t.kind, status: t.status, subject: t.subject, category: t.category,
    startedBy: t.started_by, lastMessageAt: t.last_message_at, unread, createdAt: t.created_at,
  };
}

/** True when a visitor (by key) or a link-token holder may access this thread */
export async function canAccessThread(t: DbSupportThread, opts: { visitorId?: unknown; key?: unknown; token?: unknown }) {
  if (typeof opts.token === 'string' && opts.token.length >= 16) {
    if (t.access_hash && (await sha256(opts.token)) === t.access_hash) return true;
    if (t.email_token && opts.token === t.email_token) return true; // link from a ticket email
  }
  if (t.visitor_id && opts.visitorId === t.visitor_id) {
    const v = await authVisitor(opts.visitorId, opts.key);
    return !!v;
  }
  return false;
}

export const missingTables = (e: string | null | undefined) => !!e && /support_|relation|does not exist/i.test(e);
export const MIGRATION_MSG = 'Support isn’t set up yet. Run supabase/migration_2026_11_support.sql in Supabase.';

/* ------------------------------------------------------------------ */
/* Email: ticket links and reply-by-email addresses                    */
/* ------------------------------------------------------------------ */

/** The thread's email token (created on first use for older tickets) */
export async function ensureEmailToken(t: DbSupportThread): Promise<string> {
  if (t.email_token) return t.email_token;
  const token = randomToken();
  await updateThread(t.id, { email_token: token });
  return token;
}

/** reply+<thread id>.<token>@<EMAIL_REPLY_DOMAIN>, or null when receiving isn't set up */
export const replyAddress = (t: DbSupportThread, token: string, domain: string) =>
  domain ? `HOOX Support <reply+${t.id}.${token}@${domain}>` : null;

/** Parse a reply address back into thread id + token */
export function parseReplyAddress(addr: string): { id: string; token: string } | null {
  const m = /reply\+([0-9a-f-]{36})\.([0-9a-f]{32,64})@/i.exec(addr);
  return m ? { id: m[1].toLowerCase(), token: m[2].toLowerCase() } : null;
}
