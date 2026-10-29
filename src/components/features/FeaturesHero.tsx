'use client';

/* ------------------------------------------------------------------ */
/* Features page hero carousel — one slide each for tournament         */
/* directors, anglers and promotional partners. Autoplays, pauses on   */
/* hover/focus, swipes on touch, and respects reduced motion.          */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, ChevronLeft, ChevronRight, Check, ClipboardList, Fish, Handshake, Users, Clock, Eye, MousePointerClick, Trophy, ShieldCheck,
} from 'lucide-react';
import SubmissionIllustration from '@/components/home/SubmissionIllustration';

const AUTOPLAY_MS = 7000;
const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=1400&q=70&auto=format&fit=crop`;

export type Audience = 'directors' | 'anglers' | 'partners';

interface Slide {
  key: Audience;
  tab: string;
  icon: typeof Users;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  cta: { label: string; href: string };
  more: { label: string; href: string };
  image: string; // free Unsplash photos (Jim Crowley)
  card: React.ReactNode; // product preview floating over the photo
}

function PreviewCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`w-[280px] rounded-lg bg-white p-4 text-left shadow-[0_18px_40px_rgba(5,20,40,0.35)] ${className}`}>{children}</div>;
}

const SLIDES: Slide[] = [
  {
    key: 'directors', tab: 'Tournament Directors', icon: ClipboardList,
    eyebrow: 'For Tournament Directors',
    title: 'Run your whole tournament from one place',
    body: 'Set up tournaments and series, take registrations and entry fees, review catches and publish live results without the spreadsheets.',
    points: ['Online registration and payments', 'Catch review with hand-code verification', 'Live leaderboards and payouts'],
    cta: { label: 'Start a tournament', href: '/register/director' },
    more: { label: 'Director features', href: '#directors' },
    image: photo('1763047313317-64acb05314ee'),
    card: (
      <PreviewCard>
        <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#7A8BA3]">Lakefront Classic</p>
        <p className="mt-0.5 font-montserrat text-[16px] font-bold text-[#0D1B4C]">Director dashboard</p>
        <div className="mt-3">
          <div className="flex justify-between text-[13px]"><span className="text-[#536B84]">Registrations</span><span className="font-semibold text-[#0D1B4C]">156 / 200</span></div>
          <div className="mt-1.5 h-2 rounded-full bg-[#E6EEF4]"><div className="h-2 w-[78%] rounded-full bg-[#0E7C7B]" /></div>
        </div>
        <ul className="mt-3 space-y-2 text-[13px]">
          <li className="flex items-center justify-between"><span className="flex items-center gap-2 text-[#536B84]"><Clock className="h-4 w-4 text-[#E08A1E]" />Catches to review</span><span className="rounded-full bg-[#FFF3E0] px-2 py-0.5 text-[12px] font-bold text-[#B5650D]">12</span></li>
          <li className="flex items-center justify-between"><span className="flex items-center gap-2 text-[#536B84]"><ShieldCheck className="h-4 w-4 text-[#0E7C7B]" />Verified today</span><span className="font-semibold text-[#0D1B4C]">48</span></li>
          <li className="flex items-center justify-between"><span className="flex items-center gap-2 text-[#536B84]"><Trophy className="h-4 w-4 text-[#C9962E]" />Prize pool</span><span className="font-semibold text-[#0D1B4C]">$150,000</span></li>
        </ul>
      </PreviewCard>
    ),
  },
  {
    key: 'anglers', tab: 'Anglers', icon: Fish,
    eyebrow: 'For Anglers',
    title: 'Find it. Enter it. Fish it.',
    body: 'Search tournaments and series near you, register in minutes, and submit catches right from the water. Your standings update live.',
    points: ['Search by location, species and date', 'Submit catch photos from your phone', 'Follow live leaderboards and your results'],
    cta: { label: 'Join as an angler', href: '/register/angler' },
    more: { label: 'Angler features', href: '#anglers' },
    image: photo('1763047085182-737f6f21385a'),
    card: (
      <PreviewCard className="p-3">
        <div className="relative aspect-[4/3] overflow-hidden rounded-md">
          <SubmissionIllustration look="largemouth" code="HX-7Q2" inches={21.5} className="absolute inset-0 h-full w-full" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="font-montserrat text-[15px] font-bold text-[#0D1B4C]">Catch approved</p>
            <p className="text-[12.5px] text-[#536B84]">Largemouth Bass · 21.5&quot;</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#E3F6EC] px-2.5 py-1 text-[12px] font-bold text-[#11764A]"><Check className="h-3.5 w-3.5" strokeWidth={3} />Rank #3</span>
        </div>
      </PreviewCard>
    ),
  },
  {
    key: 'partners', tab: 'Promotional Partners', icon: Handshake,
    eyebrow: 'For Promotional Partners',
    title: 'Reach anglers where they fish',
    body: 'Put your brand in front of tournament anglers and directors with banner placements, featured listings and tournament sponsorships.',
    points: ['Hero, banner and menu ad placements', 'Featured tournament, series and club listings', '“Presented by” sponsorships with your link'],
    cta: { label: 'Become a partner', href: '/partner' },
    more: { label: 'Partner features', href: '#partners' },
    image: photo('1763047019742-60edc4233593'),
    card: (
      <PreviewCard>
        <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#7A8BA3]">Campaign · Spring Series</p>
        <p className="mt-0.5 font-montserrat text-[16px] font-bold text-[#0D1B4C]">Presented by TidalGear</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-md bg-[#F2F7FA] p-2.5"><p className="flex items-center gap-1.5 text-[12px] text-[#536B84]"><Eye className="h-3.5 w-3.5" />Impressions</p><p className="mt-0.5 font-montserrat text-[18px] font-bold text-[#0D1B4C]">48.2K</p></div>
          <div className="rounded-md bg-[#F2F7FA] p-2.5"><p className="flex items-center gap-1.5 text-[12px] text-[#536B84]"><MousePointerClick className="h-3.5 w-3.5" />Clicks</p><p className="mt-0.5 font-montserrat text-[18px] font-bold text-[#0D1B4C]">1,964</p></div>
        </div>
        <div className="mt-3 flex items-end gap-1.5" aria-hidden>
          {[34, 46, 40, 58, 52, 70, 64, 82].map((h, i) => <span key={i} className="w-full rounded-sm bg-[#22B3B5]" style={{ height: h * 0.5 }} />)}
        </div>
      </PreviewCard>
    ),
  },
];

export default function FeaturesHero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = SLIDES.length;
  const go = useCallback((i: number) => setIndex(((i % n) + n) % n), [n]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    const t = window.setTimeout(() => document.visibilityState === 'visible' && go(index + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [index, paused, reduced, go]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="HOOX for directors, anglers and partners"
      className="relative overflow-hidden rounded-lg bg-[#0A2A47] shadow-[0_6px_20px_rgba(5,30,60,0.18)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="relative min-h-[660px] sm:min-h-[500px] lg:min-h-[480px]">
        {SLIDES.map((s, i) => {
          const active = i === index;
          return (
            <div
              key={s.key}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${n}: ${s.eyebrow}`}
              aria-hidden={!active}
              className={`absolute inset-0 ${reduced ? '' : 'transition-opacity duration-700'} ${active ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'}`}
            >
              {/* Photo (right side on desktop, faded behind text on mobile) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-[center_30%] opacity-25 lg:left-auto lg:right-0 lg:w-[58%] lg:opacity-100 lg:[-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_32%)] lg:[mask-image:linear-gradient(90deg,transparent_0%,#000_32%)]"
              />
              <div className="relative z-10 flex h-full flex-col gap-8 px-6 pb-24 pt-8 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:pb-20 lg:pt-10">
                <div className="max-w-[560px]">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E4F63] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.03em] text-[#3FD6D0]">
                    <s.icon className="h-3.5 w-3.5" strokeWidth={2.25} /> {s.eyebrow}
                  </span>
                  <h2 className="mt-4 font-montserrat text-[28px] font-bold leading-[1.15] text-white sm:text-[36px]">{s.title}</h2>
                  <p className="mt-3 text-[16px] leading-[25px] text-white/90">{s.body}</p>
                  <ul className="mt-4 space-y-2">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-[15px] text-white">
                        <span className="mt-[3px] flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-[#22B3B5]"><Check className="h-3 w-3" strokeWidth={3} /></span>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={s.cta.href}
                      tabIndex={active ? 0 : -1}
                      className="flex h-[46px] items-center gap-3 rounded-md bg-[#22B3B5] px-6 text-[16px] font-semibold text-white shadow-[0_4px_12px_rgba(34,179,181,0.35)] transition hover:bg-[#1C9C9E]"
                    >
                      {s.cta.label} <ArrowRight className="h-5 w-5" strokeWidth={2} />
                    </Link>
                    <a
                      href={s.more.href}
                      tabIndex={active ? 0 : -1}
                      className="flex h-[46px] items-center rounded-md border border-white/70 px-6 text-[16px] font-medium text-white transition hover:bg-white/10"
                    >
                      {s.more.label}
                    </a>
                  </div>
                </div>
                <div className="hidden flex-shrink-0 lg:mr-6 lg:block">{s.card}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls: audience tabs + arrows */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 px-4 pb-4 sm:px-10 sm:pb-5">
        <div role="tablist" aria-label="Choose an audience" className="flex gap-1.5 sm:flex-wrap sm:gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={i === index}
              onClick={() => go(i)}
              className={`flex h-[34px] items-center gap-2 rounded-full px-3 text-[13px] font-semibold transition sm:px-4 sm:text-[14px] ${
                i === index ? 'bg-white text-[#0D1B4C]' : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <s.icon className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">{s.tab}</span>
              <span className="sm:hidden">{s.tab.split(' ').pop()}</span>
            </button>
          ))}
        </div>
        <div className="hidden gap-2 sm:flex">
          <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide" className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#0A2A47]/70 text-white backdrop-blur-sm hover:bg-[#0A2A47]/90">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => go(index + 1)} aria-label="Next slide" className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#0A2A47]/70 text-white backdrop-blur-sm hover:bg-[#0A2A47]/90">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
