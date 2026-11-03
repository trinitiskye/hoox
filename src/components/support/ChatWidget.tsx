'use client';

/* ------------------------------------------------------------------ */
/* Floating support chat bubble (every public page, not /admin).       */
/*                                                                     */
/*  1. Ask a question → suggested FAQ answers (in the browser)         */
/*  2. "Not what I'm looking for" → live chat if an admin is online,   */
/*     otherwise leave a question (name + email) for a reply           */
/*  3. Admins can start a chat; the bubble shows a preview of it       */
/*                                                                     */
/* Presence heartbeat every 30s while the tab is visible; messages     */
/* refresh every 4s while a conversation is open.                      */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageCircle, X, ArrowLeft, Send, ChevronDown, ThumbsUp, Search, LifeBuoy, Ticket, Loader2, ArrowRight, ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getVisitorIdentity, resetVisitorIdentity, readPref, writePref } from '@/lib/supportVisitor';
import { suggestFaq, isEmail, MESSAGE_MAX, type FaqSuggestion, type PublicMessage, type PublicThread } from '@/lib/support';

type View = 'home' | 'answers' | 'ask' | 'chat' | 'thanks';
const HEARTBEAT_MS = 30_000;
const POLL_MS = 4_000;
const QUICK = ['When do I get the tournament code?', 'How do I submit a catch?', 'How do I list my club?', 'I forgot my password'];

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const dayOf = (iso: string) => {
  const d = new Date(iso); const t = new Date();
  return d.toDateString() === t.toDateString() ? timeOf(iso) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function Rich({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return <>{parts.map((p, i) => {
    const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    return m ? <Link key={i} href={m[2]} className="font-semibold text-[#0E7C7B] underline underline-offset-2">{m[1]}</Link> : <span key={i}>{p}</span>;
  })}</>;
}

function StatusDot({ online, className = '' }: { online: boolean; className?: string }) {
  return (
    <span className={`relative inline-flex h-2.5 w-2.5 ${className}`} aria-hidden>
      {online && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3DDC84] opacity-60 motion-reduce:animate-none" />}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${online ? 'bg-[#3DDC84]' : 'bg-[#9AA9BA]'}`} />
    </span>
  );
}

export default function ChatWidget() {
  const pathname = usePathname() || '';
  const { currentUser } = useAuth();
  // Not shown in the admin area or to admins (they answer chats in Admin → Support)
  const hidden = pathname.startsWith('/admin') || currentUser?.role === 'admin';

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('home');
  const [adminOnline, setAdminOnline] = useState(false);
  const [threads, setThreads] = useState<PublicThread[]>([]);
  const [unread, setUnread] = useState(0);
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState('');
  const [suggestions, setSuggestions] = useState<FaqSuggestion[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ threadId: string; body: string; authorName: string } | null>(null);
  const [setupMissing, setSetupMissing] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastAt = useRef<string | null>(null);

  useEffect(() => {
    if (currentUser) { setName((n) => n || currentUser.name || ''); setEmail((e) => e || currentUser.email || ''); }
  }, [currentUser]);

  /* ------------------------------ presence ------------------------------ */
  const heartbeat = useCallback(async () => {
    if (document.visibilityState !== 'visible') return;
    let me = getVisitorIdentity();
    try {
      let res = await fetch('/api/support/presence', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: me.id, key: me.key, page: window.location.pathname }),
      });
      if (res.status === 401) {
        me = resetVisitorIdentity();
        res = await fetch('/api/support/presence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visitorId: me.id, key: me.key, page: window.location.pathname }) });
      }
      const j = await res.json();
      if (j.setup === false) { setSetupMissing(true); return; }
      setAdminOnline(!!j.adminOnline);
      setThreads(Array.isArray(j.threads) ? j.threads : []);
      setUnread(j.unread || 0);
      // Announce a new reply (e.g. a chat an admin started) once
      const fresh = (j.threads as PublicThread[] | undefined)?.find((t) => t.unread > 0 && t.preview);
      if (fresh?.preview) {
        const seen = readPref<Record<string, string>>('announced', {});
        if (seen[fresh.id] !== fresh.lastMessageAt) {
          setToast({ threadId: fresh.id, ...fresh.preview });
          writePref('announced', { ...seen, [fresh.id]: fresh.lastMessageAt });
        }
      }
    } catch { /* offline: try again next beat */ }
  }, []);

  useEffect(() => {
    if (hidden) return;
    heartbeat();
    const t = setInterval(heartbeat, HEARTBEAT_MS);
    const onVis = () => { if (document.visibilityState === 'visible') heartbeat(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, [heartbeat, hidden]);

  /* ------------------------------ messages ------------------------------ */
  const loadMessages = useCallback(async (id: string, full = false) => {
    const me = getVisitorIdentity();
    const q = new URLSearchParams({ visitorId: me.id, key: me.key, threadId: id });
    if (!full && lastAt.current) q.set('after', lastAt.current);
    const res = await fetch(`/api/support/chat?${q}`, { cache: 'no-store' });
    if (!res.ok) return;
    const j = await res.json();
    if (typeof j.adminOnline === 'boolean') setAdminOnline(j.adminOnline);
    const incoming: PublicMessage[] = j.messages || [];
    if (full) setMessages(incoming);
    else if (incoming.length) setMessages((m) => [...m, ...incoming.filter((x) => !m.some((y) => y.id === x.id))]);
    if (incoming.length) lastAt.current = incoming[incoming.length - 1].createdAt;
    setThreads((ts) => ts.map((t) => (t.id === id ? { ...t, unread: 0 } : t)));
  }, []);

  useEffect(() => {
    if (!open || view !== 'chat' || !threadId) return;
    const t = setInterval(() => { if (document.visibilityState === 'visible') loadMessages(threadId).catch(() => undefined); }, POLL_MS);
    return () => clearInterval(t);
  }, [open, view, threadId, loadMessages]);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, view]);
  useEffect(() => { setUnread(threads.reduce((n, t) => n + t.unread, 0)); }, [threads]);

  const openThread = async (id: string) => {
    setToast(null); setOpen(true); setView('chat'); setThreadId(id); setMessages([]); setError(''); lastAt.current = null;
    await loadMessages(id, true).catch(() => undefined);
  };

  /* ------------------------------- actions ------------------------------- */
  const ask = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setAsked(q); setQuestion(''); setExpanded(null); setError('');
    const s = suggestFaq(q, 3);
    setSuggestions(s);
    setView(s.length ? 'answers' : 'ask');
    if (s.length) setExpanded(s[0].item.id);
  };

  const start = async (mode: 'live' | 'question') => {
    setError('');
    if (mode === 'question' && !isEmail(email.trim())) { setError('Add your email so we can reply.'); return; }
    if (email.trim() && !isEmail(email.trim())) { setError('Enter a valid email address.'); return; }
    setSending(true);
    try {
      const me = getVisitorIdentity();
      const res = await fetch('/api/support/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', mode, visitorId: me.id, key: me.key, body: asked, name: name.trim(), email: email.trim(), page: window.location.pathname }),
      });
      const j = await res.json();
      if (!res.ok || j.error) { setError(j.error || 'Couldn’t send. Please try again.'); return; }
      writePref(`token_${j.thread.id}`, j.token);
      setThreads((ts) => [j.thread, ...ts]);
      await openThread(j.thread.id);
    } catch {
      setError('Couldn’t reach HOOX. Check your connection.');
    } finally {
      setSending(false);
    }
  };

  const send = async () => {
    const body = draft.trim();
    if (!body || !threadId) return;
    setSending(true); setError('');
    try {
      const me = getVisitorIdentity();
      const res = await fetch('/api/support/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', visitorId: me.id, key: me.key, threadId, body }),
      });
      const j = await res.json();
      if (!res.ok || j.error) { setError(j.error || 'Couldn’t send.'); return; }
      setDraft('');
      setMessages((m) => [...m, j.message]);
      lastAt.current = j.message.createdAt;
    } catch {
      setError('Couldn’t reach HOOX. Check your connection.');
    } finally {
      setSending(false);
    }
  };

  const current = useMemo(() => threads.find((t) => t.id === threadId) ?? null, [threads, threadId]);
  const recent = threads.filter((t) => t.status !== 'closed').slice(0, 3);

  if (hidden || setupMissing) return null;

  /* -------------------------------- render ------------------------------- */
  return (
    <div className="font-roboto">
      {/* Reply preview toast */}
      {!open && toast && (
        <div role="status" className="fixed bottom-[92px] right-4 z-[1200] w-[min(320px,calc(100vw-32px))] rounded-xl border border-[#E3EAF1] bg-white p-4 shadow-[0_12px_32px_rgba(10,30,60,0.22)] sm:right-6">
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss" className="absolute right-2 top-2 rounded p-1 text-[#8A9AB0] hover:text-[#0D1B4C]"><X className="h-4 w-4" /></button>
          <p className="pr-5 text-[12px] font-semibold text-[#0E7C7B]">{toast.authorName}</p>
          <p className="mt-1 line-clamp-3 text-[14px] leading-[20px] text-[#1F2D3D]">{toast.body}</p>
          <button type="button" onClick={() => openThread(toast.threadId)} className="mt-3 flex items-center gap-1.5 text-[14px] font-semibold text-[#0E7C7B] hover:underline">
            Reply <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Bubble */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setToast(null); }}
        aria-expanded={open}
        aria-controls="hoox-support-panel"
        aria-label={open ? 'Close support chat' : `Open support chat${unread ? `, ${unread} new message${unread === 1 ? '' : 's'}` : ''}`}
        className={`fixed bottom-4 right-4 z-[1200] h-[60px] w-[60px] ${open ? 'hidden sm:flex' : 'flex'} items-center justify-center rounded-full bg-[#0E7C7B] text-white shadow-[0_8px_24px_rgba(14,124,123,0.45)] transition hover:scale-105 hover:bg-[#0B6766] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#22B3B5]/50 motion-reduce:hover:scale-100 sm:bottom-6 sm:right-6`}
      >
        {open ? <X className="h-6 w-6" strokeWidth={2.25} /> : <MessageCircle className="h-7 w-7" strokeWidth={2} />}
        {!open && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#E5484D] px-1.5 text-[12px] font-bold ring-2 ring-white">{unread}</span>
        )}
        {!open && unread === 0 && adminOnline && (
          <span className="absolute right-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-[#3DDC84] ring-2 ring-white" aria-hidden />
        )}
      </button>

      {/* Panel */}
      {open && (
        <section
          id="hoox-support-panel"
          role="dialog"
          aria-label="HOOX Support"
          className="fixed inset-x-0 bottom-0 top-[64px] z-[1199] flex flex-col overflow-hidden bg-white shadow-[0_20px_50px_rgba(10,30,60,0.3)] sm:inset-auto sm:bottom-[96px] sm:right-6 sm:h-[min(600px,calc(100vh-130px))] sm:w-[380px] sm:rounded-2xl"
        >
          {/* Header */}
          <header className="flex items-center gap-3 bg-gradient-to-br from-[#0A2A47] to-[#0E5A6E] px-4 py-3.5 text-white">
            {view !== 'home' ? (
              <button type="button" onClick={() => { setView('home'); setError(''); }} aria-label="Back" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10"><ArrowLeft className="h-5 w-5" /></button>
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#3FD6D0]"><LifeBuoy className="h-5 w-5" /></span>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-montserrat text-[16px] font-bold leading-tight">HOOX Support</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-white/85">
                <StatusDot online={adminOnline} /> {adminOnline ? 'We’re online' : 'We’re away · leave a question'}
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10"><X className="h-5 w-5" /></button>
          </header>

          {/* Body */}
          <div ref={listRef} className="flex-1 overflow-y-auto bg-[#F6F9FB]">
            {view === 'home' && (
              <div className="space-y-5 p-4">
                <div>
                  <p className="font-montserrat text-[20px] font-bold text-[#0D1B4C]">Hi{currentUser ? ` ${currentUser.name.split(' ')[0]}` : ''}! How can we help?</p>
                  <p className="mt-1 text-[14px] text-[#536B84]">Ask anything. We’ll suggest answers right away{adminOnline ? ', or you can chat with our team.' : '.'}</p>
                </div>
                <form noValidate onSubmit={(e) => { e.preventDefault(); ask(question); }} className="relative">
                  <label htmlFor="support-q" className="sr-only">Your question</label>
                  <input id="support-q" ref={inputRef} value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={300} placeholder="Type your question…" autoFocus
                    className="h-[48px] w-full rounded-lg border border-[#D9E3EC] bg-white pl-4 pr-12 text-[15px] text-[#1F2D3D] shadow-sm placeholder:text-[#7D8BA0] focus:border-[#22B3B5] focus:outline-none focus:ring-2 focus:ring-[#22B3B5]/40" />
                  <button type="submit" aria-label="Ask" disabled={!question.trim()} className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md bg-[#0E7C7B] text-white disabled:opacity-40"><Search className="h-4 w-4" /></button>
                </form>
                <div className="flex flex-wrap gap-2">
                  {QUICK.map((q) => (
                    <button key={q} type="button" onClick={() => ask(q)} className="rounded-full border border-[#CFE3E3] bg-white px-3 py-1.5 text-[13px] text-[#0B6564] hover:bg-[#EEF8F8]">{q}</button>
                  ))}
                </div>

                {recent.length > 0 && (
                  <div>
                    <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6B7D93]">Your conversations</p>
                    <ul className="divide-y divide-[#EDF1F5] overflow-hidden rounded-lg border border-[#E8EEF4] bg-white">
                      {recent.map((t) => (
                        <li key={t.id}>
                          <button type="button" onClick={() => openThread(t.id)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-[#F7FAFC]">
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[14px] font-medium text-[#0D1B4C]">{t.kind === 'ticket' ? `Ticket #${t.number}: ` : ''}{t.subject || 'Conversation'}</span>
                              <span className="block text-[12px] text-[#6B7D93]">{t.status === 'resolved' ? 'Resolved · ' : ''}{dayOf(t.lastMessageAt)}</span>
                            </span>
                            {t.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E5484D] px-1.5 text-[11px] font-bold text-white">{t.unread}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Link href="/faq" onClick={() => setOpen(false)} className="flex items-center justify-center gap-1.5 rounded-lg border border-[#E3EAF1] bg-white py-2.5 text-[13.5px] font-medium text-[#2E3F5C] hover:bg-[#F7FAFC]"><LifeBuoy className="h-4 w-4 text-[#0E7C7B]" /> Browse FAQ</Link>
                  <Link href="/support/ticket" onClick={() => setOpen(false)} className="flex items-center justify-center gap-1.5 rounded-lg border border-[#E3EAF1] bg-white py-2.5 text-[13.5px] font-medium text-[#2E3F5C] hover:bg-[#F7FAFC]"><Ticket className="h-4 w-4 text-[#0E7C7B]" /> Submit a ticket</Link>
                </div>
              </div>
            )}

            {view === 'answers' && (
              <div className="space-y-3 p-4">
                <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-[#0E7C7B] px-3.5 py-2 text-[14px] text-white">{asked}</div>
                <p className="text-[13px] font-medium text-[#536B84]">These answers might help:</p>
                <ul className="space-y-2">
                  {suggestions.map(({ item, section }) => {
                    const isOpen = expanded === item.id;
                    return (
                      <li key={item.id} className="overflow-hidden rounded-lg border border-[#E3EAF1] bg-white">
                        <button type="button" onClick={() => setExpanded(isOpen ? null : item.id)} aria-expanded={isOpen}
                          className="flex w-full items-start justify-between gap-3 px-3.5 py-3 text-left">
                          <span>
                            <span className="block text-[11.5px] font-semibold uppercase tracking-[0.04em] text-[#14889A]">{section}</span>
                            <span className="mt-0.5 block text-[14.5px] font-semibold leading-[20px] text-[#0D1B4C]">{item.q}</span>
                          </span>
                          <ChevronDown className={`mt-1 h-4 w-4 flex-shrink-0 text-[#5F7896] transition ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="space-y-2 px-3.5 pb-3.5 text-[14px] leading-[21px] text-[#3E5675]">
                            {item.a.map((p, i) => <p key={i}><Rich text={p} /></p>)}
                            <Link href={`/faq#${item.id}`} onClick={() => setOpen(false)} className="inline-flex items-center gap-1 text-[13px] font-medium text-[#0E7C7B] hover:underline">Open in FAQ <ExternalLink className="h-3 w-3" /></Link>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <button type="button" onClick={() => setView('thanks')} className="flex h-[42px] items-center justify-center gap-2 rounded-lg border border-[#1FA3A6] bg-white text-[14px] font-semibold text-[#0E7C7B] hover:bg-[#F1F9F9]">
                    <ThumbsUp className="h-4 w-4" /> That answered it
                  </button>
                  <button type="button" onClick={() => setView('ask')} className="flex h-[42px] items-center justify-center rounded-lg bg-[#0E7C7B] text-[14px] font-semibold text-white hover:bg-[#0B6766]">
                    Not what I’m looking for
                  </button>
                </div>
              </div>
            )}

            {view === 'thanks' && (
              <div className="flex flex-col items-center p-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F4F5] text-[#0E7C7B]"><ThumbsUp className="h-6 w-6" /></span>
                <p className="mt-4 font-montserrat text-[18px] font-bold text-[#0D1B4C]">Glad that helped!</p>
                <button type="button" onClick={() => { setView('home'); inputRef.current?.focus(); }} className="mt-4 text-[14px] font-semibold text-[#0E7C7B] hover:underline">Ask something else</button>
              </div>
            )}

            {view === 'ask' && (
              <form noValidate onSubmit={(e) => { e.preventDefault(); start(adminOnline ? 'live' : 'question'); }} className="space-y-4 p-4">
                <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-[#0E7C7B] px-3.5 py-2 text-[14px] text-white">{asked}</div>
                <div className="rounded-lg border border-[#E3EAF1] bg-white p-3.5">
                  <p className="flex items-center gap-2 text-[14.5px] font-semibold text-[#0D1B4C]">
                    <StatusDot online={adminOnline} />
                    {adminOnline ? 'Chat with our team now' : 'Send this question to our team'}
                  </p>
                  <p className="mt-1 text-[13px] leading-[19px] text-[#536B84]">
                    {adminOnline
                      ? 'Someone from HOOX is online and will reply here in a few minutes.'
                      : 'We’re away right now. Leave your email and we’ll reply here as soon as we’re back.'}
                  </p>
                </div>
                <div>
                  <label htmlFor="support-name" className="mb-1 block text-[13px] font-medium text-[#0D1B4C]">Name</label>
                  <input id="support-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120}
                    className="h-[44px] w-full rounded-lg border border-[#D9E3EC] bg-white px-3.5 text-[15px] focus:border-[#22B3B5] focus:outline-none focus:ring-2 focus:ring-[#22B3B5]/40" />
                </div>
                <div>
                  <label htmlFor="support-email" className="mb-1 block text-[13px] font-medium text-[#0D1B4C]">Email {adminOnline ? <span className="font-normal text-[#7A8BA3]">(optional)</span> : <span className="text-[#B42318]">*</span>}</label>
                  <input id="support-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={254} placeholder="you@example.com"
                    className="h-[44px] w-full rounded-lg border border-[#D9E3EC] bg-white px-3.5 text-[15px] focus:border-[#22B3B5] focus:outline-none focus:ring-2 focus:ring-[#22B3B5]/40" />
                </div>
                {error && <p role="alert" className="text-[13px] text-[#B42318]">{error}</p>}
                <button type="submit" disabled={sending} className="flex h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[#0E7C7B] text-[15px] font-semibold text-white hover:bg-[#0B6766] disabled:opacity-60">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {adminOnline ? 'Start chat' : 'Send question'}
                </button>
                <p className="text-center text-[12.5px] text-[#6B7D93]">
                  Need a detailed answer or have files? <Link href="/support/ticket" onClick={() => setOpen(false)} className="font-medium text-[#0E7C7B] hover:underline">Submit a ticket</Link>
                </p>
              </form>
            )}

            {view === 'chat' && (
              <div className="space-y-3 p-4" aria-live="polite">
                {current?.kind === 'ticket' && <p className="text-center text-[12px] text-[#6B7D93]">Ticket #{current.number} · {current.subject}</p>}
                {messages.length === 0 && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-[#8A9AB0]" /></div>}
                {messages.map((m) => (
                  m.author === 'system' ? (
                    <p key={m.id} className="mx-auto max-w-[90%] text-center text-[12.5px] leading-[18px] text-[#6B7D93]">{m.body}</p>
                  ) : (
                    <div key={m.id} className={`flex flex-col ${m.author === 'visitor' ? 'items-end' : 'items-start'}`}>
                      {m.author === 'admin' && <span className="mb-1 text-[11.5px] font-semibold text-[#0E7C7B]">{m.authorName}</span>}
                      <div className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-[14px] leading-[20px] ${m.author === 'visitor' ? 'rounded-br-md bg-[#0E7C7B] text-white' : 'rounded-bl-md border border-[#E3EAF1] bg-white text-[#1F2D3D]'}`}>{m.body}</div>
                      <span className="mt-1 text-[11px] text-[#8A9AB0]">{timeOf(m.createdAt)}</span>
                    </div>
                  )
                ))}
                {messages.length > 0 && !adminOnline && messages[messages.length - 1].author === 'visitor' && (
                  <p className="text-center text-[12.5px] text-[#6B7D93]">We’ll reply here. You can close this window and come back anytime.</p>
                )}
              </div>
            )}
          </div>

          {/* Composer */}
          {view === 'chat' && (
            <form noValidate onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-[#E3EAF1] bg-white p-3">
              {error && <p role="alert" className="mb-2 text-[12.5px] text-[#B42318]">{error}</p>}
              {current?.status === 'closed' ? (
                <button type="button" onClick={() => setView('home')} className="h-[42px] w-full rounded-lg border border-[#1FA3A6] text-[14px] font-semibold text-[#0E7C7B]">This chat is closed · Start a new one</button>
              ) : (
                <div className="flex items-end gap-2">
                  <label htmlFor="support-draft" className="sr-only">Message</label>
                  <textarea id="support-draft" rows={1} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={MESSAGE_MAX} placeholder="Write a message…"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    className="max-h-[120px] min-h-[42px] flex-1 resize-none rounded-lg border border-[#D9E3EC] px-3 py-2.5 text-[14.5px] focus:border-[#22B3B5] focus:outline-none focus:ring-2 focus:ring-[#22B3B5]/40" />
                  <button type="submit" disabled={sending || !draft.trim()} aria-label="Send" className="flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-[#0E7C7B] text-white disabled:opacity-40">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              )}
            </form>
          )}
        </section>
      )}
    </div>
  );
}

