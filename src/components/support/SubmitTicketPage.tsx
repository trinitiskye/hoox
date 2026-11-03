'use client';

/* /support/ticket — support ticket form. Suggests FAQ answers as the       */
/* subject is typed; on submit shows the ticket number and a private link.  */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Copy, Check, LifeBuoy, Clock, MessageSquare, Lightbulb, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getVisitorIdentity } from '@/lib/supportVisitor';
import { suggestFaq, isEmail, TICKET_CATEGORIES, MESSAGE_MAX, SUBJECT_MAX } from '@/lib/support';

const inputClass =
  'h-[48px] w-full rounded-md border border-[#D9E3EC] bg-white px-4 text-[15px] text-[#1F2D3D] placeholder:text-[#7D8BA0] shadow-[0_1px_3px_rgba(10,30,60,0.04)] focus:border-hoox-ui focus:outline-none focus:ring-2 focus:ring-hoox-ui/40';
const labelClass = 'mb-1.5 block text-[14px] font-medium text-[#0D1B4C]';
const Req = () => <span className="text-[#B42318]"> *</span>;
const Opt = () => <span className="font-normal text-[#7A8BA3]"> (optional)</span>;

function Rich({ text }: { text: string }) {
  return <>{text.split(/(\[[^\]]+\]\([^)]+\))/g).map((p, i) => {
    const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    return m ? <Link key={i} href={m[2]} className="font-semibold text-[#0E7C7B] underline underline-offset-2">{m[1]}</Link> : <span key={i}>{p}</span>;
  })}</>;
}

export default function SubmitTicketPage() {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', category: '', subject: '', message: '', relatedUrl: '', website_url: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ number: number; link: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [openTip, setOpenTip] = useState<string | null>(null);
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    if (currentUser) setForm((f) => ({ ...f, name: f.name || currentUser.name || '', email: f.email || currentUser.email || '' }));
  }, [currentUser]);
  useEffect(() => { const t = setTimeout(() => setDebounced(form.subject), 350); return () => clearTimeout(t); }, [form.subject]);
  const tips = useMemo(() => (debounced.trim().length >= 6 ? suggestFaq(debounced, 3) : []), [debounced]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError('');
    if (!form.name.trim() || !isEmail(form.email.trim()) || !form.category || !form.subject.trim() || form.message.trim().length < 10) {
      setError(!form.name.trim() ? 'Enter your name.' : !isEmail(form.email.trim()) ? 'Enter a valid email address.' : !form.category ? 'Choose a topic.' : !form.subject.trim() ? 'Add a short subject.' : 'Tell us a little more (at least 10 characters).');
      return;
    }
    setLoading(true);
    try {
      const me = getVisitorIdentity();
      const res = await fetch('/api/support/tickets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, visitorId: me.id, key: me.key }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) { setError(j.error || 'Something went wrong. Please try again.'); return; }
      setDone({ number: j.number, link: `${window.location.origin}/support/ticket/${j.id}?t=${j.token}` });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('We couldn’t reach HOOX. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!done) return;
    try { await navigator.clipboard.writeText(done.link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  const STEPS = [
    { icon: MessageSquare, title: 'Tell us what’s up', text: 'The more detail, the faster we can help.' },
    { icon: Clock, title: 'We reply to your ticket', text: 'Track replies with your private ticket link or the chat bubble.' },
    { icon: CheckCircle2, title: 'Problem solved', text: 'Reply anytime to keep the conversation going.' },
  ];

  return (
    <div className="font-roboto">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-start gap-6 px-4 pb-12 pt-8 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:px-[42px] lg:pt-[34px]">
        <aside className="rounded-lg bg-gradient-to-br from-[#0A2A47] via-[#0B3552] to-[#0E5A6E] px-6 py-8 text-white shadow-[0_6px_20px_rgba(5,30,60,0.18)] sm:px-8 lg:sticky lg:top-[100px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E4F63] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.03em] text-[#3FD6D0]">
            <LifeBuoy className="h-3.5 w-3.5" strokeWidth={2.25} /> Support
          </span>
          <h1 className="mt-4 font-montserrat text-[30px] font-bold leading-[1.15] sm:text-[36px]">Submit a ticket</h1>
          <p className="mt-3 text-[16px] leading-[25px] text-white/90">Questions about an account, a tournament, a catch or a listing? Send us the details and our team will help.</p>
          <ol className="mt-6 space-y-4">
            {STEPS.map((s) => (
              <li key={s.title} className="flex items-start gap-3.5">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#3FD6D0]"><s.icon className="h-5 w-5" strokeWidth={2} /></span>
                <span>
                  <span className="block text-[15px] font-semibold">{s.title}</span>
                  <span className="block text-[14px] leading-[20px] text-white/80">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-8 border-t border-white/15 pt-5 text-[14px] text-white/80">
            Looking for a quick answer? Try the <Link href="/faq" className="font-semibold text-[#3FD6D0] hover:underline">FAQ</Link> or the chat bubble.
          </p>
        </aside>

        <section aria-label="Support ticket" className="rounded-lg border border-[#E8EEF4] bg-white p-5 shadow-[0_2px_10px_rgba(10,30,60,0.06)] sm:p-8">
          {done ? (
            <div className="flex flex-col items-center py-8 text-center" role="status">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E6F4F5] text-[#0E7C7B]"><CheckCircle2 className="h-8 w-8" strokeWidth={1.75} /></span>
              <p className="mt-5 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#14889A]">Ticket #{done.number}</p>
              <h2 className="mt-1 font-montserrat text-[26px] font-bold text-[#0D1B4C]">Thanks, we’ve got your ticket</h2>
              <p className="mt-3 max-w-[480px] text-[16px] leading-[25px] text-[#536B84]">
                Our team will reply as soon as we can. Save your private ticket link to check replies or add details from any device.
              </p>
              <div className="mt-6 flex w-full max-w-[520px] items-center gap-2 rounded-md border border-[#D9E3EC] bg-[#F7FAFC] p-1.5 pl-3">
                <span className="min-w-0 flex-1 truncate text-left text-[13px] text-[#3E5067]">{done.link}</span>
                <button type="button" onClick={copy} className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded bg-white px-3 text-[13px] font-semibold text-[#0E7C7B] ring-1 ring-[#D9E3EC] hover:bg-[#F1F9F9]">
                  {copied ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy link</>}
                </button>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a href={done.link} className="flex h-[46px] items-center justify-center gap-2 rounded-md bg-[#0E7C7B] px-6 text-[15px] font-semibold text-white hover:bg-[#0B6766]">View your ticket <ArrowRight className="h-4 w-4" /></a>
                <Link href="/" className="flex h-[46px] items-center justify-center rounded-md border border-[#1FA3A6] px-6 text-[15px] font-medium text-[#0E7C7B] hover:bg-[#F1F9F9]">Back to home</Link>
              </div>
            </div>
          ) : (
            <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-5">
              <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="tk-website">Leave empty</label>
                <input id="tk-website" tabIndex={-1} autoComplete="off" value={form.website_url} onChange={set('website_url')} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="tk-name" className={labelClass}>Name<Req /></label>
                  <input id="tk-name" value={form.name} onChange={set('name')} autoComplete="name" maxLength={120} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="tk-email" className={labelClass}>Email<Req /></label>
                  <input id="tk-email" type="email" value={form.email} onChange={set('email')} autoComplete="email" maxLength={254} placeholder="you@example.com" className={inputClass} />
                </div>
              </div>
              <div>
                <label htmlFor="tk-category" className={labelClass}>Topic<Req /></label>
                <select id="tk-category" value={form.category} onChange={set('category')} className={inputClass}>
                  <option value="">Choose a topic…</option>
                  {TICKET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="tk-subject" className={labelClass}>Subject<Req /></label>
                <input id="tk-subject" value={form.subject} onChange={set('subject')} maxLength={SUBJECT_MAX} placeholder="e.g. My catch photo was rejected" className={inputClass} />
                {tips.length > 0 && (
                  <div className="mt-3 rounded-md border border-[#CFE8E8] bg-[#F1F9F9] p-3">
                    <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0B6564]"><Lightbulb className="h-4 w-4" /> These answers might help</p>
                    <ul className="mt-2 space-y-1.5">
                      {tips.map(({ item }) => (
                        <li key={item.id} className="rounded bg-white">
                          <button type="button" onClick={() => setOpenTip(openTip === item.id ? null : item.id)} aria-expanded={openTip === item.id}
                            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[14px] font-medium text-[#0D1B4C]">
                            {item.q}<ChevronDown className={`h-4 w-4 flex-shrink-0 text-[#5F7896] transition ${openTip === item.id ? 'rotate-180' : ''}`} />
                          </button>
                          {openTip === item.id && (
                            <div className="space-y-2 px-3 pb-3 text-[14px] leading-[21px] text-[#3E5675]">{item.a.map((p, i) => <p key={i}><Rich text={p} /></p>)}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="tk-message" className={labelClass}>How can we help?<Req /></label>
                <textarea id="tk-message" value={form.message} onChange={set('message')} maxLength={MESSAGE_MAX * 2} rows={7}
                  placeholder="What happened, what you expected, and any tournament, club or event names involved."
                  className={inputClass.replace('h-[48px]', 'min-h-[160px] py-3 leading-[22px]')} />
                <p className="mt-1.5 text-right text-[13px] text-[#6B7D93]">{form.message.length}/{MESSAGE_MAX * 2}</p>
              </div>
              <div>
                <label htmlFor="tk-url" className={labelClass}>Link to the page it’s about<Opt /></label>
                <input id="tk-url" value={form.relatedUrl} onChange={set('relatedUrl')} maxLength={500} placeholder="https://hoox.app/tournaments/…" className={inputClass} />
              </div>
              {error && <div role="alert" className="rounded-md border border-[#F5C2BD] bg-[#FEF3F2] px-4 py-3 text-[14px] text-[#B42318]">{error}</div>}
              <div className="border-t border-[#EDF1F5] pt-6">
                <button type="submit" disabled={loading} className="flex h-[50px] w-full items-center justify-center gap-3 rounded-md bg-[#0E7C7B] text-[16px] font-semibold text-white shadow-[0_4px_12px_rgba(14,124,123,0.25)] transition hover:bg-[#0B6766] disabled:opacity-60">
                  {loading ? 'Submitting…' : <>Submit ticket <ArrowRight className="h-5 w-5" strokeWidth={2} /></>}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
