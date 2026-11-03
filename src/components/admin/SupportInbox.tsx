'use client';

/* ------------------------------------------------------------------ */
/* Admin → Support                                                     */
/*  • Online / Away toggle (drives the green dot visitors see)         */
/*  • On the site now: visitors, with "Chat" to start a conversation   */
/*  • Inbox: live chats & questions, and the ticket queue              */
/*  • Conversation: reply, status, priority, internal notes            */
/* Inbox refreshes every 6s; an open conversation every 3s.            */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MessageCircle, Ticket, Send, Loader2, AlertCircle, Users, Mail, ExternalLink, Circle, ArrowLeft, StickyNote, X,
} from 'lucide-react';
import {
  STATUS_LABEL, PRIORITY_LABEL, THREAD_STATUSES, THREAD_PRIORITIES, MESSAGE_MAX,
  type DbSupportThread, type PublicMessage, type ThreadStatus, type ThreadPriority,
} from '@/lib/support';

type Thread = Omit<DbSupportThread, 'access_hash'> & { unread: boolean };
type Visitor = { visitor_id: string; user_id: string | null; name: string | null; email: string | null; page_url: string | null; last_seen: string; openThreadId: string | null };
type Agent = { user_id: string; name: string | null; available: boolean; last_seen: string; online: boolean };
type Box = 'chat' | 'ticket';
type TicketFilter = 'active' | ThreadStatus | 'all';

const STATUS_CHIP: Record<ThreadStatus, string> = {
  open: 'bg-[#E3F4F4] text-[#0B6564]', pending: 'bg-amber-100 text-amber-800', resolved: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-600',
};
const PRIORITY_CHIP: Record<ThreadPriority, string> = {
  low: 'bg-gray-100 text-gray-600', normal: 'bg-[#F0F4F8] text-[#4A5B76]', high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700',
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init });
  let json: Record<string, unknown> = {};
  try { json = await res.json(); } catch { /* ignore */ }
  if (!res.ok || json.error) {
    const msg = typeof json.error === 'string' ? json.error : `Request failed (${res.status})`;
    throw new Error(res.status === 403 ? 'Your admin session has expired. Please log in again.' : msg);
  }
  return json as T;
}
const ago = (iso: string) => {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const time = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const who = (t: { name: string | null; email: string | null }) => t.name || t.email || 'Visitor';

export default function SupportInbox() {
  const [box, setBox] = useState<Box>('chat');
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>('active');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [available, setAvailable] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [startFor, setStartFor] = useState<Visitor | null>(null);

  const load = useCallback(async () => {
    try {
      const j = await api<{ threads: Thread[]; visitors: Visitor[]; agents: Agent[]; available: boolean }>('/api/admin/support');
      setThreads(j.threads); setVisitors(j.visitors); setAgents(j.agents); setAvailable(j.available); setLoadError(null);
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 6000);
    return () => clearInterval(t);
  }, [load]);

  const toggleAvailable = async () => {
    const next = !available;
    setAvailable(next);
    try { await api('/api/admin/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ available: next }) }); load(); }
    catch { setAvailable(!next); }
  };

  const chats = useMemo(() => threads.filter((t) => t.kind === 'chat' && t.status !== 'closed'), [threads]);
  const tickets = useMemo(() => threads.filter((t) => t.kind === 'ticket' && (
    ticketFilter === 'all' ? true : ticketFilter === 'active' ? t.status === 'open' || t.status === 'pending' : t.status === ticketFilter)), [threads, ticketFilter]);
  const list = box === 'chat' ? chats : tickets;
  const unreadChats = threads.filter((t) => t.kind === 'chat' && t.unread).length;
  const unreadTickets = threads.filter((t) => t.kind === 'ticket' && t.unread).length;
  const otherOnline = agents.filter((a) => a.online).length;

  if (loadError && !loaded) return <ErrorBox msg={loadError} />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C]">Support</h2>
          <p className="mt-0.5 text-sm text-[#5F6F86]">Live chat, questions from the chat bubble, and support tickets</p>
        </div>
        <button type="button" onClick={toggleAvailable} aria-pressed={available}
          className={`flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${available ? 'border-green-200 bg-green-50 text-green-800' : 'border-[#D3DEE8] bg-white text-[#4A5B76]'}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${available ? 'bg-[#3DDC84]' : 'bg-[#9AA9BA]'}`} />
          {available ? 'Online for live chat' : 'Away'}
          <span className="font-normal text-xs opacity-75">· click to {available ? 'go away' : 'go online'}</span>
        </button>
      </div>
      <p className="-mt-3 mb-5 text-xs text-[#6B7D93]">
        Visitors see the green “We’re online” dot while you’re signed in to HOOX as an admin and set to Online{otherOnline ? ` · ${otherOnline} admin${otherOnline === 1 ? '' : 's'} online now` : ''}.
      </p>
      {loadError && <div className="mb-4"><ErrorBox msg={loadError} /></div>}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_minmax(0,1fr)_280px]">
        {/* Inbox list */}
        <div className={`overflow-hidden rounded-lg border border-[#E8EEF4] bg-white shadow-[0_2px_10px_rgba(10,30,60,0.05)] ${selected ? 'hidden xl:block' : ''}`}>
          <div className="flex border-b border-[#EEF3F8]">
            {([['chat', 'Chats', MessageCircle, unreadChats], ['ticket', 'Tickets', Ticket, unreadTickets]] as const).map(([id, label, Icon, n]) => (
              <button key={id} type="button" onClick={() => setBox(id)}
                className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-semibold transition ${box === id ? 'border-[#0E7C7B] text-[#0E7C7B]' : 'border-transparent text-[#5F6F86] hover:text-[#2E3F5C]'}`}>
                <Icon className="h-4 w-4" /> {label}
                {n > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E5484D] px-1.5 text-[11px] font-bold text-white">{n}</span>}
              </button>
            ))}
          </div>
          {box === 'ticket' && (
            <div className="flex flex-wrap gap-1.5 border-b border-[#EEF3F8] px-3 py-2.5">
              {(['active', 'open', 'pending', 'resolved', 'closed', 'all'] as TicketFilter[]).map((f) => (
                <button key={f} type="button" onClick={() => setTicketFilter(f)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${ticketFilter === f ? 'bg-[#0E7C7B] text-white' : 'bg-[#F0F4F8] text-[#4A5B76] hover:bg-[#E3EAF1]'}`}>
                  {f === 'active' ? 'Needs attention' : f === 'all' ? 'All' : STATUS_LABEL[f]}
                </button>
              ))}
            </div>
          )}
          {!loaded ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#8A9AB0]" /></div>
          ) : list.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[#5F6F86]">{box === 'chat' ? 'No open chats.' : 'No tickets here.'}</p>
          ) : (
            <ul className="max-h-[640px] divide-y divide-[#EEF3F8] overflow-y-auto">
              {list.map((t) => (
                <li key={t.id}>
                  <button type="button" onClick={() => setSelected(t.id)} aria-current={selected === t.id}
                    className={`w-full px-4 py-3 text-left transition ${selected === t.id ? 'bg-[#EEF8F8]' : 'hover:bg-[#F7FAFC]'}`}>
                    <div className="flex items-center gap-2">
                      {t.unread && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#E5484D]" aria-label="Unread" />}
                      <span className={`min-w-0 flex-1 truncate text-sm ${t.unread ? 'font-bold text-[#0D1B4C]' : 'font-medium text-[#2E3F5C]'}`}>{who(t)}</span>
                      <span className="flex-shrink-0 text-[11px] text-[#8A9AB0]">{ago(t.last_message_at)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-[#4A5B76]">{t.kind === 'ticket' ? `#${t.number} · ` : ''}{t.subject || '(no subject)'}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_CHIP[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                      {t.kind === 'ticket' && t.priority !== 'normal' && <span className={`rounded-full px-2 py-0.5 text-[11px] ${PRIORITY_CHIP[t.priority]}`}>{PRIORITY_LABEL[t.priority]}</span>}
                      {t.category && <span className="rounded-full bg-[#F5F8FB] px-2 py-0.5 text-[11px] text-[#5F6F86]">{t.category}</span>}
                      {t.started_by === 'admin' && <span className="rounded-full bg-[#F1EAFA] px-2 py-0.5 text-[11px] text-[#59338A]">You started</span>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Conversation */}
        <div className={`${selected ? '' : 'hidden xl:block'}`}>
          {selected ? (
            <Conversation key={selected} id={selected} onBack={() => setSelected(null)} onChanged={load} />
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-[#D3DEE8] bg-white p-8 text-center text-sm text-[#5F6F86]">
              <MessageCircle className="mb-2 h-6 w-6 text-[#B3BFCC]" /> Choose a conversation to read and reply.
            </div>
          )}
        </div>

        {/* On the site now */}
        <aside className="overflow-hidden rounded-lg border border-[#E8EEF4] bg-white shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
          <div className="flex items-center gap-2 border-b border-[#EEF3F8] px-4 py-3">
            <Users className="h-4 w-4 text-[#0E7C7B]" />
            <span className="text-sm font-semibold text-[#0D1B4C]">On the site now</span>
            <span className="ml-auto rounded-full bg-[#F0F4F8] px-2 py-0.5 text-xs text-[#4A5B76]">{visitors.length}</span>
          </div>
          {visitors.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#5F6F86]">No visitors right now.</p>
          ) : (
            <ul className="max-h-[640px] divide-y divide-[#EEF3F8] overflow-y-auto">
              {visitors.map((v) => (
                <li key={v.visitor_id} className="flex items-center gap-3 px-4 py-2.5">
                  <Circle className="h-2.5 w-2.5 flex-shrink-0 fill-[#3DDC84] text-[#3DDC84]" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0D1B4C]">{v.name || 'Guest'}{v.user_id && <span className="ml-1 text-[11px] font-normal text-[#0E7C7B]">signed in</span>}</p>
                    <p className="truncate text-xs text-[#8A9AB0]" title={v.page_url || ''}>{v.page_url || '/'}</p>
                  </div>
                  <button type="button" onClick={() => (v.openThreadId ? (setBox('chat'), setSelected(v.openThreadId)) : setStartFor(v))}
                    className="flex-shrink-0 rounded-lg border border-[#1FA3A6] px-2.5 py-1 text-xs font-semibold text-[#0E7C7B] hover:bg-[#EEF9F8]">
                    {v.openThreadId ? 'Open chat' : 'Chat'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {startFor && (
        <StartChat visitor={startFor} onClose={() => setStartFor(null)} onStarted={(id) => { setStartFor(null); setBox('chat'); setSelected(id); load(); }} />
      )}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />{msg}</div>;
}

/* --------------------------- conversation --------------------------- */

function Conversation({ id, onBack, onChanged }: { id: string; onBack: () => void; onChanged: () => void }) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [visitor, setVisitor] = useState<{ online: boolean; lastSeen: string; page: string | null } | null>(null);
  const [draft, setDraft] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const lastAt = useRef<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (full = false) => {
    const q = !full && lastAt.current ? `?after=${encodeURIComponent(lastAt.current)}` : '';
    const j = await api<{ thread: Thread; messages: PublicMessage[]; visitor: typeof visitor }>(`/api/admin/support/threads/${id}${q}`);
    setThread((prev) => { if (!prev || full) setNotes(j.thread.admin_notes || ''); return j.thread; });
    setVisitor(j.visitor);
    if (full) setMessages(j.messages);
    else if (j.messages.length) setMessages((m) => [...m, ...j.messages.filter((x) => !m.some((y) => y.id === x.id))]);
    if (j.messages.length) lastAt.current = j.messages[j.messages.length - 1].createdAt;
  }, [id]);

  useEffect(() => {
    lastAt.current = null;
    load(true).then(onChanged).catch((e) => setError((e as Error).message));
    const t = setInterval(() => { if (document.visibilityState === 'visible') load().catch(() => undefined); }, 3000);
    return () => clearInterval(t);
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); }, [messages.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setSending(true); setError('');
    try {
      const j = await api<{ message: PublicMessage }>(`/api/admin/support/threads/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) });
      setDraft(''); setMessages((m) => [...m, j.message]); lastAt.current = j.message.createdAt;
      await load(true); // picks up status changes (e.g. ticket → Waiting on visitor)
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const patch = async (body: Record<string, unknown>) => {
    setError('');
    try {
      const j = await api<{ thread: Thread }>(`/api/admin/support/threads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setThread((t) => (t ? { ...t, ...j.thread } : t));
      await load(); onChanged();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!thread) return <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-[#E8EEF4] bg-white">{error ? <ErrorBox msg={error} /> : <Loader2 className="h-5 w-5 animate-spin text-[#8A9AB0]" />}</div>;

  return (
    <div className="flex h-[720px] flex-col overflow-hidden rounded-lg border border-[#E8EEF4] bg-white shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
      <div className="border-b border-[#EEF3F8] px-4 py-3">
        <div className="flex items-start gap-3">
          <button type="button" onClick={onBack} aria-label="Back to inbox" className="mt-0.5 rounded p-1 text-[#5F6F86] hover:bg-[#F5F8FB] xl:hidden"><ArrowLeft className="h-4 w-4" /></button>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-[#0D1B4C]">
              {who(thread)}
              {visitor && (
                <span className={`flex items-center gap-1 text-xs font-medium ${visitor.online ? 'text-green-700' : 'text-[#8A9AB0]'}`}>
                  <span className={`h-2 w-2 rounded-full ${visitor.online ? 'bg-[#3DDC84]' : 'bg-[#C9D3DE]'}`} /> {visitor.online ? 'On the site now' : `Last seen ${ago(visitor.lastSeen)}`}
                </span>
              )}
            </p>
            <p className="mt-0.5 truncate text-[13px] text-[#4A5B76]">{thread.kind === 'ticket' ? `Ticket #${thread.number} · ` : `#${thread.number} · `}{thread.subject}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B7D93]">
              {thread.email && <a href={`mailto:${thread.email}?subject=${encodeURIComponent(`Re: ${thread.subject || 'Your HOOX support request'} [#${thread.number}]`)}`} className="flex items-center gap-1 text-[#0E7C7B] hover:underline"><Mail className="h-3 w-3" />{thread.email}</a>}
              {(visitor?.page || thread.page_url) && <span className="flex items-center gap-1 truncate"><ExternalLink className="h-3 w-3" />{visitor?.online ? visitor.page : thread.page_url}</span>}
              {thread.category && <span>{thread.category}</span>}
              <span>Opened {time(thread.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`st-${id}`}>Status</label>
          <select id={`st-${id}`} value={thread.status} onChange={(e) => patch({ status: e.target.value })} className={`h-8 rounded-full border-0 px-3 text-xs font-semibold ${STATUS_CHIP[thread.status]}`}>
            {THREAD_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          {thread.kind === 'ticket' && (
            <>
              <label className="sr-only" htmlFor={`pr-${id}`}>Priority</label>
              <select id={`pr-${id}`} value={thread.priority} onChange={(e) => patch({ priority: e.target.value })} className={`h-8 rounded-full border-0 px-3 text-xs font-semibold ${PRIORITY_CHIP[thread.priority]}`}>
                {THREAD_PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]} priority</option>)}
              </select>
            </>
          )}
          <button type="button" onClick={() => setShowNotes((v) => !v)} aria-expanded={showNotes}
            className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium ${thread.admin_notes ? 'bg-yellow-100 text-yellow-800' : 'bg-[#F0F4F8] text-[#4A5B76]'}`}>
            <StickyNote className="h-3.5 w-3.5" /> Notes{thread.admin_notes ? ' ·' : ''}
          </button>
          {thread.status !== 'resolved' && thread.status !== 'closed' && (
            <button type="button" onClick={() => patch({ status: 'resolved' })} className="ml-auto h-8 rounded-full bg-[#0E7C7B] px-3 text-xs font-semibold text-white hover:bg-[#0B6564]">Mark resolved</button>
          )}
        </div>
        {showNotes && (
          <div className="mt-3">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Internal notes (visitors never see these)"
              className="w-full rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300" />
            <button type="button" disabled={notes === (thread.admin_notes || '')} onClick={() => patch({ adminNotes: notes })} className="mt-1 rounded-lg border border-[#D3DEE8] px-3 py-1 text-xs font-medium text-[#2E3F5C] disabled:opacity-50">Save notes</button>
          </div>
        )}
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-[#F6F9FB] p-4">
        {messages.map((m) => m.author === 'system' ? (
          <p key={m.id} className="text-center text-xs text-[#8A9AB0]">{m.body} · {time(m.createdAt)}</p>
        ) : (
          <div key={m.id} className={`flex flex-col ${m.author === 'admin' ? 'items-end' : 'items-start'}`}>
            <span className="mb-1 text-[11px] text-[#8A9AB0]">{m.author === 'admin' ? m.authorName : (m.authorName || who(thread))} · {time(m.createdAt)}</span>
            <div className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm leading-[20px] ${m.author === 'admin' ? 'rounded-br-md bg-[#0E7C7B] text-white' : 'rounded-bl-md border border-[#E3EAF1] bg-white text-[#1F2D3D]'}`}>{m.body}</div>
          </div>
        ))}
      </div>

      <form noValidate onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-[#EEF3F8] p-3">
        {error && <p role="alert" className="mb-2 text-xs text-red-600">{error}</p>}
        <div className="flex items-end gap-2">
          <label htmlFor={`reply-${id}`} className="sr-only">Reply</label>
          <textarea id={`reply-${id}`} rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={MESSAGE_MAX}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
            placeholder={thread.kind === 'ticket' ? 'Reply to this ticket… (⌘/Ctrl + Enter to send)' : visitor?.online ? 'Reply… they’ll see it right away' : 'Reply… they’ll see it next time they visit'}
            className="min-h-[52px] flex-1 resize-y rounded-lg border border-[#D3DEE8] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#22B3B5]" />
          <button type="submit" disabled={sending || !draft.trim()} className="flex h-[52px] items-center gap-1.5 rounded-lg bg-[#0E7C7B] px-4 text-sm font-semibold text-white hover:bg-[#0B6564] disabled:opacity-50">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
          </button>
        </div>
        {thread.kind === 'ticket' && thread.email && (
          <p className="mt-1.5 text-[11px] text-[#8A9AB0]">The visitor sees replies on their private ticket page. Email isn’t sent automatically; use the email link above if needed.</p>
        )}
      </form>
    </div>
  );
}

/* ---------------------------- start chat ---------------------------- */

function StartChat({ visitor, onClose, onStarted }: { visitor: Visitor; onClose: () => void; onStarted: (threadId: string) => void }) {
  const [body, setBody] = useState(`Hi${visitor.name ? ` ${visitor.name.split(' ')[0]}` : ''}! I’m with HOOX Support. Can I help you with anything?`);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const start = async () => {
    setSending(true); setError('');
    try {
      const j = await api<{ threadId: string }>('/api/admin/support/visitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visitorId: visitor.visitor_id, body }) });
      onStarted(j.threadId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#0A1A2E]/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="start-chat-title" className="w-full max-w-[460px] rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h3 id="start-chat-title" className="font-montserrat text-lg font-bold text-[#0D1B4C]">Start a chat with {visitor.name || 'this visitor'}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-[#8A9AB0] hover:text-[#0D1B4C]"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-1 text-sm text-[#5F6F86]">They’re on <span className="font-medium text-[#2E3F5C]">{visitor.page_url || '/'}</span>. Your message pops up above their chat bubble.</p>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={MESSAGE_MAX} autoFocus
          className="mt-4 w-full rounded-lg border border-[#D3DEE8] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#22B3B5]" />
        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-[38px] rounded-lg border border-[#D3DEE8] px-4 text-sm font-medium text-[#2E3F5C] hover:bg-[#F5F8FB]">Cancel</button>
          <button type="button" onClick={start} disabled={sending || !body.trim()} className="flex h-[38px] items-center gap-1.5 rounded-lg bg-[#0E7C7B] px-4 text-sm font-semibold text-white hover:bg-[#0B6564] disabled:opacity-50">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
          </button>
        </div>
      </div>
    </div>
  );
}
