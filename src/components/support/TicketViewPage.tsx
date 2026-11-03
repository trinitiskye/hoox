'use client';

/* /support/ticket/[id]?t=… — a visitor's private view of one ticket:     */
/* status, the conversation with HOOX Support, and a reply box.            */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, Send, LifeBuoy, AlertCircle } from 'lucide-react';
import { STATUS_LABEL, MESSAGE_MAX, type PublicMessage, type PublicThread, type ThreadStatus } from '@/lib/support';

const STATUS_CHIP: Record<ThreadStatus, string> = {
  open: 'bg-[#E3F4F4] text-[#0B6564]', pending: 'bg-amber-100 text-amber-800', resolved: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-600',
};
const PUBLIC_STATUS: Record<ThreadStatus, string> = { open: 'Open', pending: 'Awaiting your reply', resolved: 'Resolved', closed: 'Closed' };
const when = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function TicketViewPage({ id }: { id: string }) {
  const token = useSearchParams().get('t') || '';
  const [thread, setThread] = useState<(PublicThread & { name?: string | null }) | null>(null);
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/support/tickets/${encodeURIComponent(id)}?t=${encodeURIComponent(token)}`, { cache: 'no-store' });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setError(j.error || 'Ticket not found.'); return; }
    setThread(j.thread); setMessages(j.messages || []);
  }, [id, token]);

  useEffect(() => {
    load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') load().catch(() => undefined); }, 15_000);
    return () => clearInterval(t);
  }, [load]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }); }, [messages.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setSending(true); setSendError('');
    try {
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: token, body }) });
      const j = await res.json();
      if (!res.ok) { setSendError(j.error || 'Couldn’t send.'); return; }
      setDraft(''); setMessages((m) => [...m, j.message]);
      setThread((t) => (t ? { ...t, status: 'open' } : t));
    } catch {
      setSendError('We couldn’t reach HOOX. Check your connection.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="font-roboto mx-auto max-w-[820px] px-4 pb-14 pt-8 sm:px-6 lg:pt-[34px]">
      {error ? (
        <div className="flex flex-col items-center rounded-lg border border-[#E8EEF4] bg-white px-6 py-14 text-center">
          <AlertCircle className="h-8 w-8 text-[#B42318]" />
          <h1 className="mt-4 font-montserrat text-[24px] font-bold text-[#0D1B4C]">{error}</h1>
          <p className="mt-2 text-[15px] text-[#536B84]">Check that you copied the whole link, or submit a new ticket.</p>
          <Link href="/support/ticket" className="mt-6 rounded-md bg-[#0E7C7B] px-6 py-3 text-[15px] font-semibold text-white hover:bg-[#0B6766]">Submit a ticket</Link>
        </div>
      ) : !thread ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#8A9AB0]" /></div>
      ) : (
        <>
          <header className="rounded-lg bg-gradient-to-br from-[#0A2A47] to-[#0E5A6E] px-6 py-6 text-white shadow-[0_6px_20px_rgba(5,30,60,0.18)]">
            <p className="flex flex-wrap items-center gap-2 text-[13px] text-white/80">
              <LifeBuoy className="h-4 w-4 text-[#3FD6D0]" /> {thread.kind === 'ticket' ? `Ticket #${thread.number}` : `Conversation #${thread.number}`}
              {thread.category && <> · {thread.category}</>}
              <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${STATUS_CHIP[thread.status]}`}>{PUBLIC_STATUS[thread.status] ?? STATUS_LABEL[thread.status]}</span>
            </p>
            <h1 className="mt-2 font-montserrat text-[24px] font-bold leading-tight sm:text-[28px]">{thread.subject || 'Support request'}</h1>
            <p className="mt-1 text-[13px] text-white/70">Opened {when(thread.createdAt)}</p>
          </header>

          <ol className="mt-6 space-y-4" aria-live="polite">
            {messages.map((m) => m.author === 'system' ? (
              <li key={m.id} className="text-center text-[13px] text-[#6B7D93]">{m.body}</li>
            ) : (
              <li key={m.id} className={`rounded-lg border p-4 ${m.author === 'admin' ? 'border-[#CFE8E8] bg-[#F1F9F9]' : 'border-[#E8EEF4] bg-white'}`}>
                <p className="flex items-center justify-between gap-3 text-[13px]">
                  <span className={`font-semibold ${m.author === 'admin' ? 'text-[#0E7C7B]' : 'text-[#0D1B4C]'}`}>{m.author === 'admin' ? m.authorName : (m.authorName || 'You')}</span>
                  <span className="text-[#8A9AB0]">{when(m.createdAt)}</span>
                </p>
                <p className="mt-2 whitespace-pre-line text-[15px] leading-[24px] text-[#2E3F5C]">{m.body}</p>
              </li>
            ))}
            <div ref={endRef} />
          </ol>

          {thread.status === 'closed' ? (
            <p className="mt-6 text-center text-[15px] text-[#536B84]">This ticket is closed. <Link href="/support/ticket" className="font-semibold text-[#0E7C7B] hover:underline">Submit a new ticket</Link></p>
          ) : (
            <form noValidate onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-6 rounded-lg border border-[#E8EEF4] bg-white p-4 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
              <label htmlFor="tk-reply" className="mb-2 block text-[14px] font-medium text-[#0D1B4C]">Add a reply</label>
              <textarea id="tk-reply" rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={MESSAGE_MAX}
                className="w-full rounded-md border border-[#D9E3EC] px-4 py-3 text-[15px] leading-[22px] focus:border-hoox-ui focus:outline-none focus:ring-2 focus:ring-hoox-ui/40" />
              {sendError && <p role="alert" className="mt-2 text-[13px] text-[#B42318]">{sendError}</p>}
              <div className="mt-3 flex justify-end">
                <button type="submit" disabled={sending || !draft.trim()} className="flex h-[44px] items-center gap-2 rounded-md bg-[#0E7C7B] px-5 text-[15px] font-semibold text-white hover:bg-[#0B6766] disabled:opacity-50">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send reply
                </button>
              </div>
            </form>
          )}
          <p className="mt-4 text-center text-[13px] text-[#6B7D93]">Keep this page’s link private. Anyone with it can read and reply to this ticket.</p>
        </>
      )}
    </div>
  );
}
