// Shared support definitions (client + server): chat bubble, live chat,
// "ask our team" questions and support tickets.

import { FAQ, plain, type FaqItem } from './faqContent';

export type ThreadKind = 'chat' | 'ticket';
export type ThreadStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type ThreadPriority = 'low' | 'normal' | 'high' | 'urgent';
export type MessageAuthor = 'visitor' | 'admin' | 'system';

export const THREAD_STATUSES: ThreadStatus[] = ['open', 'pending', 'resolved', 'closed'];
export const THREAD_PRIORITIES: ThreadPriority[] = ['low', 'normal', 'high', 'urgent'];
export const STATUS_LABEL: Record<ThreadStatus, string> = { open: 'Open', pending: 'Waiting on visitor', resolved: 'Resolved', closed: 'Closed' };
export const PRIORITY_LABEL: Record<ThreadPriority, string> = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' };

export const TICKET_CATEGORIES = [
  'Account & sign-in',
  'Tournaments & registration',
  'Catch submissions & judging',
  'Leaderboards & results',
  'Clubs',
  'Expos & events',
  'Advertising & partners',
  'Billing & payments',
  'Report a bug',
  'Other',
] as const;

export const MESSAGE_MAX = 2000;
export const SUBJECT_MAX = 140;

/** Admin counts as online if seen this recently (and marked available) */
export const AGENT_ONLINE_MS = 90_000;
/** Visitors seen this recently show in the admin's "On the site now" list */
export const VISITOR_ONLINE_MS = 120_000;

export interface DbSupportThread {
  id: string;
  number: number;
  kind: ThreadKind;
  status: ThreadStatus;
  priority: ThreadPriority;
  category: string | null;
  subject: string | null;
  name: string | null;
  email: string | null;
  user_id: string | null;
  visitor_id: string | null;
  access_hash: string | null;
  /** Private token for links and reply-by-email in ticket emails (migration_2026_11_email.sql) */
  email_token?: string | null;
  started_by: 'visitor' | 'admin';
  page_url: string | null;
  admin_notes: string | null;
  last_message_at: string;
  last_message_from: MessageAuthor;
  admin_last_read_at: string | null;
  visitor_last_read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSupportMessage {
  id: string;
  thread_id: string;
  author: MessageAuthor;
  author_name: string | null;
  body: string;
  created_at: string;
}

export interface DbSupportVisitor {
  visitor_id: string;
  key_hash: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  page_url: string | null;
  last_seen: string;
  created_at: string;
}

/** Thread as the visitor sees it (no admin notes, hashes, etc.) */
export interface PublicThread {
  id: string;
  number: number;
  kind: ThreadKind;
  status: ThreadStatus;
  subject: string | null;
  category: string | null;
  startedBy: 'visitor' | 'admin';
  lastMessageAt: string;
  unread: number;
  createdAt: string;
  /** Latest unread reply (presence only) */
  preview?: { body: string; authorName: string } | null;
}

export interface PublicMessage {
  id: string;
  author: MessageAuthor;
  authorName: string | null;
  body: string;
  createdAt: string;
}

export const toPublicMessage = (m: DbSupportMessage): PublicMessage => ({
  id: m.id, author: m.author, authorName: m.author === 'admin' ? (m.author_name || 'HOOX Support') : m.author_name, body: m.body, createdAt: m.created_at,
});

export const ticketLabel = (n: number) => `#${n}`;

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (v: string) => EMAIL_RE.test(v);

export function cleanText(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  // keep line breaks, drop other control characters
  return v.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
}

/* ------------------------------------------------------------------ */
/* FAQ suggestions (runs in the browser)                               */
/* ------------------------------------------------------------------ */

const STOP = new Set('a an the and or but of to in on for with my me i is are be can do does how what when where who why which it at by from as this that your you our we us have has get if not no yes will was'.split(' '));
const SYNONYMS: Record<string, string[]> = {
  signup: ['register', 'account', 'join'], sign: ['account', 'login'], login: ['sign', 'password', 'account'], log: ['sign', 'login'],
  password: ['forgot', 'login'], code: ['tournament', 'hand'], photo: ['catch', 'picture', 'board'], picture: ['photo', 'catch'],
  fish: ['catch', 'species'], catch: ['submit', 'photo', 'fish'], pay: ['fee', 'cost', 'invoice'], price: ['cost', 'fee', 'pricing'],
  cost: ['fee', 'free', 'price'], club: ['clubs'], expo: ['events', 'show'], show: ['expo', 'events'], ad: ['advertising', 'banner'],
  ads: ['advertising', 'banner'], judge: ['judges', 'verify'], score: ['leaderboard', 'standings'], ranking: ['leaderboard', 'standings'],
  app: ['mobile', 'phone', 'download'], signal: ['service', 'offline'],
};

const words = (s: string) => s.toLowerCase().replace(/[’']/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w));
const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, '');

export interface FaqSuggestion { item: FaqItem; section: string; score: number }

/** Best-matching FAQ answers for a free-text question (top `limit`, best first). */
export function suggestFaq(question: string, limit = 3): FaqSuggestion[] {
  const qWords = words(question);
  if (!qWords.length) return [];
  const expanded = new Set<string>();
  qWords.forEach((w) => { expanded.add(stem(w)); (SYNONYMS[w] || []).forEach((s) => expanded.add(stem(s))); });
  const out: FaqSuggestion[] = [];
  for (const s of FAQ) {
    for (const item of s.items) {
      const qText = words(item.q).map(stem);
      const aText = words(item.a.map(plain).join(' ')).map(stem);
      let score = 0;
      expanded.forEach((w) => {
        if (qText.includes(w)) score += qWords.map(stem).includes(w) ? 3 : 1.5;
        else if (aText.includes(w)) score += qWords.map(stem).includes(w) ? 1 : 0.4;
      });
      if (score > 0) out.push({ item, section: s.title, score });
    }
  }
  return out.sort((a, b) => b.score - a.score).filter((x, i, arr) => x.score >= Math.max(1.5, arr[0].score * 0.35)).slice(0, limit);
}
