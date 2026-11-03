'use client';

/* ------------------------------------------------------------------ */
/* /faq — branded FAQ: hero with search, category chips, accordion     */
/* sections and a contact CTA. Content lives in src/lib/faqContent.ts. */
/* Each question has its own link (/faq#question-id) that opens it.    */
/* ------------------------------------------------------------------ */

import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search, X, ChevronDown, Rocket, Fish, Camera, ClipboardList, Users, CalendarDays, Megaphone, LifeBuoy, ArrowRight, Link2, Check,
} from 'lucide-react';
import { FAQ, plain, type FaqItem } from '@/lib/faqContent';

const INK = 'text-[#0D1B4C]';
const ICONS: Record<string, typeof Fish> = {
  'getting-started': Rocket, anglers: Fish, catches: Camera, directors: ClipboardList,
  clubs: Users, events: CalendarDays, advertising: Megaphone, support: LifeBuoy,
};

/** Render "[label](/path)" links inside an answer paragraph */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        return m ? (
          <Link key={i} href={m[2]} className="font-semibold text-[#0E7C7B] underline decoration-[#0E7C7B]/30 underline-offset-2 hover:decoration-[#0E7C7B]">{m[1]}</Link>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        );
      })}
    </>
  );
}

/** Highlight search matches in a question */
function Mark({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark className="rounded bg-[#CDEFEF] px-0.5 text-inherit">{text.slice(i, i + term.length)}</mark>{text.slice(i + term.length)}</>;
}

function Question({ item, open, onToggle, term }: { item: FaqItem; open: boolean; onToggle: () => void; term: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/faq#${item.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked */ }
  };
  return (
    <li id={item.id} className="scroll-mt-[110px]">
      <h3>
        <button
          id={`${item.id}-q`}
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`${item.id}-answer`}
          className={`flex w-full items-start justify-between gap-4 px-5 py-4 text-left text-[16px] font-semibold leading-[24px] transition hover:bg-[#F7FAFC] sm:px-6 sm:text-[17px] ${INK}`}
        >
          <span><Mark text={item.q} term={term} /></span>
          <ChevronDown className={`mt-0.5 h-5 w-5 flex-shrink-0 text-[#5F7896] transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={2} aria-hidden />
        </button>
      </h3>
      <div id={`${item.id}-answer`} role="region" aria-labelledby={`${item.id}-q`} hidden={!open} className="px-5 pb-5 sm:px-6">
        <div className="space-y-3 text-[15.5px] leading-[25px] text-[#3E5675]">
          {item.a.map((para, i) => <p key={i}><Rich text={para} /></p>)}
        </div>
        <button type="button" onClick={copy} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6B7D93] hover:text-[#0E7C7B]">
          {copied ? <><Check className="h-3.5 w-3.5" /> Link copied</> : <><Link2 className="h-3.5 w-3.5" /> Copy link to this answer</>}
        </button>
      </div>
    </li>
  );
}

export default function FaqPage() {
  const [q, setQ] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const term = q.trim();

  // Open the question in the URL hash (e.g. /faq#tournament-code)
  useEffect(() => {
    const openHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id || !FAQ.some((s) => s.items.some((i) => i.id === id))) return;
      setQ('');
      setOpenIds((prev) => new Set(prev).add(id));
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };
    openHash();
    window.addEventListener('hashchange', openHash);
    return () => window.removeEventListener('hashchange', openHash);
  }, []);

  const sections = useMemo(() => {
    if (!term) return FAQ;
    const t = term.toLowerCase();
    return FAQ.map((s) => ({ ...s, items: s.items.filter((i) => [i.q, ...i.a.map(plain)].some((x) => x.toLowerCase().includes(t))) }))
      .filter((s) => s.items.length);
  }, [term]);
  const matchCount = sections.reduce((n, s) => n + s.items.length, 0);

  const toggle = (id: string) => setOpenIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  // While searching, show answers open so matches in the answer text are visible
  const isOpen = (id: string) => (term ? !openIds.has(`closed:${id}`) : openIds.has(id));
  const toggleItem = (id: string) => (term ? toggle(`closed:${id}`) : toggle(id));

  const jump = (id: string) => document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="font-roboto">
      {/* ------------------------------ Hero ------------------------------ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A2A47] via-[#0B3552] to-[#0E5A6E] text-white">
        <svg aria-hidden className="absolute inset-x-0 bottom-0 h-24 w-full text-[#22B3B5] opacity-20" viewBox="0 0 1440 96" preserveAspectRatio="none">
          <path fill="currentColor" d="M0 64 Q180 24 360 64 T720 64 T1080 64 T1440 64 V96 H0Z" />
          <path fill="currentColor" opacity=".6" d="M0 80 Q180 48 360 80 T720 80 T1080 80 T1440 80 V96 H0Z" />
        </svg>
        <div className="relative mx-auto max-w-[920px] px-4 pb-16 pt-14 text-center sm:px-6 sm:pb-20 sm:pt-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E4F63] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.03em] text-[#3FD6D0]">
            <LifeBuoy className="h-3.5 w-3.5" strokeWidth={2.25} /> Help Center
          </span>
          <h1 className="mt-5 font-montserrat text-[34px] font-bold leading-[1.1] sm:text-[48px]">Frequently asked questions</h1>
          <p className="mx-auto mt-4 max-w-[600px] text-[17px] leading-[27px] text-white/90">
            Tournaments, catch submissions, clubs, events and your account, answered.
          </p>
          <label className="relative mx-auto mt-8 block max-w-[620px]">
            <span className="sr-only">Search the FAQ</span>
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5F7896]" strokeWidth={2} />
            <input
              type="search"
              value={q}
              onChange={(e) => { setQ(e.target.value); setOpenIds(new Set()); }}
              placeholder="Search questions, e.g. “tournament code”"
              className="h-[58px] w-full rounded-lg border-0 bg-white pl-14 pr-12 text-[16px] text-[#1F2D3D] shadow-[0_10px_30px_rgba(0,0,0,0.25)] placeholder:text-[#7D8BA0] focus:outline-none focus:ring-4 focus:ring-[#22B3B5]/50 [&::-webkit-search-cancel-button]:hidden"
            />
            {q && (
              <button type="button" onClick={() => setQ('')} aria-label="Clear search" className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#5F7896] hover:bg-[#F2F7FA]">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
          <p className="mt-3 h-5 text-[14px] text-white/80" aria-live="polite">
            {term ? (matchCount ? `${matchCount} answer${matchCount === 1 ? '' : 's'} found` : 'No answers found') : ''}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-[42px]">
        {/* --------------------------- Topic chips --------------------------- */}
        {!term && (
          <nav aria-label="FAQ topics" className="-mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FAQ.map((s) => {
              const Icon = ICONS[s.id] ?? LifeBuoy;
              return (
                <button key={s.id} type="button" onClick={() => jump(s.id)}
                  className="group relative flex items-center gap-3 rounded-lg border border-[#E8EEF4] bg-white p-3.5 text-left shadow-[0_2px_10px_rgba(10,30,60,0.06)] transition hover:border-[#9FD3D3] hover:shadow-[0_6px_18px_rgba(10,30,60,0.1)] sm:p-4">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#E6F4F5] text-[#0E7C7B] transition group-hover:bg-[#0E7C7B] group-hover:text-white">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[14.5px] font-semibold leading-tight sm:text-[15px] ${INK}`}>{s.title}</span>
                    <span className="mt-0.5 block text-[12.5px] text-[#6B7D93]">{s.items.length} questions</span>
                  </span>
                </button>
              );
            })}
          </nav>
        )}

        {/* ------------------------------ Answers ----------------------------- */}
        <div className={`mx-auto max-w-[900px] ${term ? 'pt-10' : 'pt-12'}`}>
          {sections.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#C9D8E5] bg-white px-6 py-12 text-center">
              <p className={`text-[18px] font-semibold ${INK}`}>No answers match “{term}”.</p>
              <p className="mt-2 text-[15px] text-[#536B84]">Try a different word, or ask us directly.</p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <button type="button" onClick={() => setQ('')} className="h-[44px] rounded-md border border-[#1FA3A6] px-5 text-[15px] font-medium text-[#0E7C7B] hover:bg-[#F1F9F9]">Clear search</button>
                <Link href="/contact" className="flex h-[44px] items-center justify-center gap-2 rounded-md bg-[#0E7C7B] px-5 text-[15px] font-semibold text-white hover:bg-[#0B6766]">Contact us <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {sections.map((s) => {
                const Icon = ICONS[s.id] ?? LifeBuoy;
                return (
                  <section key={s.id} id={`section-${s.id}`} aria-labelledby={`h-${s.id}`} className="scroll-mt-[100px]">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A2A47] text-[#3FD6D0]"><Icon className="h-5 w-5" strokeWidth={2} /></span>
                      <div>
                        <h2 id={`h-${s.id}`} className={`font-montserrat text-[22px] font-bold leading-tight sm:text-[26px] ${INK}`}>{s.title}</h2>
                        <p className="text-[14px] text-[#6B7D93]">{s.blurb}</p>
                      </div>
                    </div>
                    <ul className="divide-y divide-[#EDF1F5] overflow-hidden rounded-lg border border-[#E8EEF4] bg-white shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
                      {s.items.map((item) => (
                        <Question key={item.id} item={item} term={term} open={isOpen(item.id)} onToggle={() => toggleItem(item.id)} />
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}

          {/* ---------------------------- Contact CTA --------------------------- */}
          <section className="mt-14 flex flex-col items-start gap-6 rounded-lg bg-gradient-to-r from-[#0A2A47] to-[#0E5A6E] px-6 py-8 shadow-[0_6px_20px_rgba(5,30,60,0.18)] sm:px-10 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-montserrat text-[24px] font-bold leading-tight text-white sm:text-[28px]">Still have a question?</h2>
              <p className="mt-2 max-w-[520px] text-[16px] leading-[24px] text-white/85">Our team is happy to help anglers, directors, clubs and partners.</p>
            </div>
            <Link href="/contact" className="flex h-[46px] items-center justify-center gap-3 rounded-md bg-[#22B3B5] px-7 text-[16px] font-semibold text-white shadow-[0_4px_12px_rgba(34,179,181,0.35)] transition hover:bg-[#1C9C9E]">
              Contact us <ArrowRight className="h-5 w-5" strokeWidth={2} />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
