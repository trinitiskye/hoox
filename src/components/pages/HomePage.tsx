'use client';

import {
  Trophy, MapPin, CalendarDays, Users, ChevronRight, ArrowRight, ShieldCheck, Mountain, Waves, Navigation,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Tournament, Submission, User, SearchParams, HeroSlide, HomeBanner } from '@/types';
import { getActiveHeroSlides, dbHeroSlideToApp, getActiveHomeBanners, dbHomeBannerToApp } from '@/lib/supabase';
import RecommendedSection from '@/components/home/RecommendedSection';
import HeroCarousel from '@/components/home/HeroCarousel';
import LeaderboardSection from '@/components/home/LeaderboardSection';
import { mapsSearchUrl, mapsDirectionsUrl, mapsEmbedUrl } from '@/lib/eventDetail';

interface HomePageProps {
  tournaments: Tournament[];
  submissions: Submission[];
  users: User[];
  onNavigate: (view: string) => void;
  onSearch: (params: SearchParams) => void;
}

/* ------------------------------------------------------------------ */
/* Placeholder content (matches the Home mock). Real upcoming /        */
/* in-progress tournaments replace it automatically when they exist.   */
/* ------------------------------------------------------------------ */

const SPONSOR = {
  name: 'TidalGear',
  logo: '/home/tidalgear-logo.png',
  image: '/home/sponsor-hero.jpg',
  headline: ['Built for anglers.', 'Trusted by the water.'],
  body: 'TidalGear® is proud to support the fishing community and the tournaments that keep our waters and anglers thriving.',
  cta: 'Visit sponsor',
  features: [
    { icon: ShieldCheck, label: 'Premium Quality' },
    { icon: Mountain, label: 'Outdoor Ready' },
    { icon: Waves, label: 'Angler Approved' },
  ],
};

interface LiveTournament {
  id?: string;
  name: string;
  location: string;
  dates: string;
  anglers: number | string;
  day: string;
  elapsed: string;
  lastUpdate: string;
  /** Google Maps query (same map/links as the event page's Event Location card) */
  mapQuery: string;
  address?: string;
}

const DEMO_LIVE: LiveTournament = {
  name: 'Lakefront Classic',
  location: 'Lake Hartwell, GA',
  dates: 'May 17 – 19, 2025',
  anglers: 156,
  day: 'Day 1 of 3',
  elapsed: '5h 42m',
  lastUpdate: '10:42 AM',
  mapQuery: 'Lake Hartwell, Hartwell, GA 30643',
  address: 'Hartwell, GA 30643',
};

interface UpcomingCard {
  id: string;
  name: string;
  dates: string;
  location: string;
  anglers?: number | string;
  prizePool?: string;
  image: string;
  /** Show the Register button only while registration is open */
  registrationOpen: boolean;
}

const CARD_IMAGES = [
  '/home/coastal-open.jpg',
  '/home/pine-creek.jpg',
  '/home/summer-slam.jpg',
  '/home/mountain-lake.jpg',
  '/home/bayou-bash.jpg',
  '/home/fall-classic.jpg',
];

const DEMO_UPCOMING: UpcomingCard[] = [
  { id: 'd1', name: 'Coastal Open', dates: 'JUN 7 – 8, 2025', location: 'Charleston, SC', anglers: 200, prizePool: '$100,000', image: CARD_IMAGES[0], registrationOpen: true },
  { id: 'd2', name: 'Pine Creek Challenge', dates: 'JUN 21 – 22, 2025', location: 'Toledo Bend, TX', anglers: 180, prizePool: '$75,000', image: CARD_IMAGES[1], registrationOpen: false },
  { id: 'd3', name: 'Summer Slam', dates: 'JUL 12 – 13, 2025', location: 'Lake Okeechobee, FL', anglers: 220, prizePool: '$125,000', image: CARD_IMAGES[2], registrationOpen: true },
  { id: 'd4', name: 'Mountain Lake Invitational', dates: 'AUG 9 – 10, 2025', location: 'Lake Guntersville, AL', anglers: 160, prizePool: '$80,000', image: CARD_IMAGES[3], registrationOpen: true },
  { id: 'd5', name: 'Bayou Bash', dates: 'SEP 6 – 7, 2025', location: 'Toledo Bend, LA', anglers: 175, prizePool: '$70,000', image: CARD_IMAGES[4], registrationOpen: true },
  { id: 'd6', name: 'Fall Classic', dates: 'OCT 18 – 19, 2025', location: 'Lake Murray, SC', anglers: 190, prizePool: '$90,000', image: CARD_IMAGES[5], registrationOpen: true },
];

/* ------------------------------ helpers ------------------------------ */

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function parseDate(s: string) {
  const d = new Date(s.length <= 10 ? `${s}T00:00:00` : s);
  return isNaN(d.getTime()) ? null : d;
}

/** "JUN 7 – 8, 2025" / "JUN 30 – JUL 2, 2025" */
function formatRange(start: string, end: string, upper = true) {
  const a = parseDate(start);
  const b = parseDate(end) ?? a;
  if (!a || !b) return start;
  const m = (d: Date) => (upper ? MONTHS[d.getMonth()] : MONTHS[d.getMonth()][0] + MONTHS[d.getMonth()].slice(1).toLowerCase());
  if (a.toDateString() === b.toDateString()) return `${m(a)} ${a.getDate()}, ${a.getFullYear()}`;
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${m(a)} ${a.getDate()} – ${b.getDate()}, ${b.getFullYear()}`;
  }
  return `${m(a)} ${a.getDate()} – ${m(b)} ${b.getDate()}, ${b.getFullYear()}`;
}

function place(t: Tournament) {
  const cityState = [t.city, t.state].filter(Boolean).join(', ');
  return cityState || t.location || '';
}

function toUpcomingCards(tournaments: Tournament[]): UpcomingCard[] {
  const now = new Date();
  const upcoming = tournaments
    .filter((t) => {
      const d = parseDate(t.startDate);
      return d && d > now;
    })
    .sort((x, y) => (parseDate(x.startDate)!.getTime() - parseDate(y.startDate)!.getTime()))
    .slice(0, 6);
  return upcoming.map((t, i) => ({
    id: t.id,
    name: t.name,
    dates: formatRange(t.startDate, t.endDate),
    location: place(t),
    anglers: t.maxParticipants || undefined,
    image: t.image || CARD_IMAGES[i % CARD_IMAGES.length],
    // Same rule as the event page: open until the event ends, unless marked completed.
    // (Upcoming cards only list events that haven't started yet.)
    registrationOpen: t.status !== 'completed',
  }));
}

function toLive(tournaments: Tournament[]): LiveTournament | null {
  const now = new Date();
  const t = tournaments.find((x) => {
    const s = parseDate(x.startDate);
    const e = parseDate(x.endDate);
    if (!s || !e) return false;
    e.setHours(23, 59, 59);
    return now >= s && now <= e;
  });
  if (!t) return null;
  const s = parseDate(t.startDate)!;
  const e = parseDate(t.endDate)!;
  const totalDays = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
  const dayNum = Math.min(totalDays, Math.floor((now.getTime() - s.getTime()) / 86400000) + 1);
  const mins = Math.max(0, Math.floor((now.getTime() - s.getTime()) / 60000) % (24 * 60));
  return {
    id: t.id,
    name: t.name,
    location: place(t),
    dates: formatRange(t.startDate, t.endDate, false),
    anglers: t.maxParticipants || '—',
    day: `Day ${dayNum} of ${totalDays}`,
    elapsed: `${Math.floor(mins / 60)}h ${mins % 60}m`,
    lastUpdate: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    mapQuery: [t.location, t.city, t.state].filter(Boolean).join(', '),
    address: [t.city, t.state].filter(Boolean).join(', ') || undefined,
  };
}

/* ----------------------------- sections ------------------------------ */

function SponsorHero({ onVisit }: { onVisit: () => void }) {
  return (
    <section
      aria-label={`Featured sponsor: ${SPONSOR.name}`}
      className="relative overflow-hidden rounded-lg bg-hoox-deep min-h-[482px] shadow-[0_2px_10px_rgba(10,30,60,0.12)]"
    >
      {/* Photo — right side on desktop, full-bleed on mobile */}
      <img
        src={SPONSOR.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[70%_center] md:left-auto md:right-0 md:w-auto md:max-w-[62%] md:object-left md:[-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_24%)] md:[mask-image:linear-gradient(90deg,transparent_0%,#000_24%)]"
      />
      {/* Water/dusk glow behind the copy */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 60% at 38% 62%, rgba(46,98,128,0.55) 0%, rgba(0,38,59,0) 70%), radial-gradient(ellipse 40% 35% at 30% 20%, rgba(40,80,110,0.35) 0%, rgba(0,38,59,0) 70%)',
        }}
      />
      {/* Blend into photo */}
      <div className="absolute inset-0 bg-hoox-deep/80 md:hidden" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#001B2C]/80 to-transparent" />

      <div className="relative z-10 flex h-full min-h-[482px] flex-col px-6 sm:px-8 pt-[74px] pb-[14px]">
        <img src={SPONSOR.logo} alt={`${SPONSOR.name} Outdoor Equipment`} className="w-[300px] sm:w-[456px] max-w-full h-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]" />

        <h2 className="mt-[22px] text-[28px] sm:text-[33px] font-bold leading-[1.16] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
          {SPONSOR.headline[0]}
          <br />
          {SPONSOR.headline[1]}
        </h2>
        <p className="mt-[14px] max-w-[330px] text-[17px] leading-[1.45] text-white/95">{SPONSOR.body}</p>

        <button
          onClick={onVisit}
          className="mt-[18px] inline-flex w-fit items-center gap-7 rounded-md bg-gradient-to-b from-[#F7AE2C] to-[#EE9A1A] px-[34px] h-[44px] text-[19px] font-semibold text-[#11173A] shadow-[0_3px_10px_rgba(238,154,26,0.35)] hover:brightness-105 transition"
        >
          {SPONSOR.cta} <ArrowRight className="h-5 w-5" strokeWidth={2.25} />
        </button>

        <ul className="mt-auto flex flex-wrap items-center gap-x-14 gap-y-3 pt-6">
          {SPONSOR.features.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-white">
              <Icon className="h-7 w-7" strokeWidth={1.4} />
              <span className="text-[13px] font-medium uppercase tracking-[0.02em]">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function LiveNow({ live, onLeaderboard }: { live: LiveTournament; onLeaderboard: () => void }) {
  return (
    <section aria-label="Live tournament" className="flex flex-col rounded-lg border border-hoox-line bg-white p-[14px] pt-[16px] shadow-[0_2px_10px_rgba(10,30,60,0.06)]">
      <div className="flex items-start justify-between px-[2px]">
        <h2 className="flex items-center gap-2.5 text-[20px] font-bold leading-none text-hoox-ink">
          <span className="relative flex h-[11px] w-[11px]">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hoox-teal opacity-60" />
            <span className="relative inline-flex h-[11px] w-[11px] rounded-full bg-hoox-teal" />
          </span>
          LIVE NOW
        </h2>
        <span className="pt-1 text-[13px] text-hoox-muted">Last update: {live.lastUpdate}</span>
      </div>

      <span className="mt-[13px] inline-flex w-fit items-center gap-2 rounded-md bg-[#F7A924] px-3.5 py-[6px] text-[12px] font-semibold uppercase text-[#161C36]">
        <Trophy className="h-4 w-4" fill="currentColor" strokeWidth={1.5} /> Featured Tournament
      </span>

      <div className="mt-2.5 flex items-start gap-4 pl-[2px]">
        <img src="/home/live-fish.png" alt="" className="mt-1 h-[58px] w-[74px] flex-shrink-0 object-contain" />
        <div className="min-w-0">
          <h3 className="text-[23px] font-bold leading-tight text-hoox-ink">{live.name}</h3>
          <p className="mt-1.5 flex items-center gap-3 text-[16px] text-[#5884E1]">
            <CalendarDays className="h-5 w-5 text-hoox-ink" strokeWidth={1.75} /> {live.dates}
          </p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-3 rounded-md bg-hoox-chip py-2.5 text-center">
        {[
          { v: live.anglers, l: 'Anglers', c: 'text-[#477CD3]' },
          { v: live.day, l: 'In Progress', c: 'text-[#14869A]' },
          { v: live.elapsed, l: 'Elapsed', c: 'text-[#477CD3]' },
        ].map((s, i) => (
          <div key={s.l} className={i > 0 ? 'border-l border-[#B9D4E6]' : ''}>
            <dd className="text-[21px] font-bold leading-tight text-hoox-ink">{s.v}</dd>
            <dt className={`mt-0.5 text-[14px] ${s.c}`}>{s.l}</dt>
          </div>
        ))}
      </dl>

      {/* Event location — same Google Maps embed, View Larger Map and Get Directions as the event page */}
      {live.mapQuery && (
        <div className="mt-[10px]">
          <div className="flex items-center justify-between px-[2px]">
            <h4 className="text-[15px] font-bold text-hoox-ink">Event Location</h4>
            <a
              href={mapsSearchUrl(live.mapQuery)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#0B6068] hover:text-hoox-brand"
            >
              View Larger Map <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </a>
          </div>
          <iframe
            title={`Map of ${live.location}`}
            src={mapsEmbedUrl(live.mapQuery)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="mt-2 h-[145px] w-full rounded-md border-0 bg-hoox-chip"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <MapPin className="mt-[2px] h-[20px] w-[20px] flex-shrink-0 text-hoox-ink" strokeWidth={2} />
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold text-hoox-ink">{live.location}</div>
                {live.address && <div className="truncate text-[12.5px] text-[#6586A8]">{live.address}</div>}
              </div>
            </div>
            <a
              href={mapsDirectionsUrl(live.mapQuery)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[36px] flex-shrink-0 items-center gap-2.5 rounded-md border border-[#177E84] px-4 text-[13px] font-medium text-[#076869] transition hover:bg-[#EEF9F8]"
            >
              <Navigation className="h-[16px] w-[16px]" strokeWidth={2} /> Get Directions
            </a>
          </div>
        </div>
      )}

      <button
        onClick={onLeaderboard}
        className="mt-3 flex h-[46px] w-full items-center justify-center gap-4 rounded-md bg-gradient-to-r from-[#00253F] via-[#03304F] to-[#00253F] text-[18px] font-medium text-white hover:brightness-125 transition"
      >
        View leaderboard <ArrowRight className="h-5 w-5" strokeWidth={2} />
      </button>
    </section>
  );
}

function TournamentCard({ t, onOpen, onRegister }: { t: UpcomingCard; onOpen: () => void; onRegister: () => void }) {
  return (
    <div className="group relative flex w-full flex-col sm:flex-row gap-4 rounded-md border border-hoox-line bg-white p-[13px] text-left transition hover:border-hoox-ui hover:shadow-md focus-within:border-hoox-ui">
      <img src={t.image} alt="" className="h-[180px] w-full sm:h-[134px] sm:w-[40%] sm:max-w-[166px] flex-shrink-0 rounded-md object-cover" />
      <div className="flex min-w-0 flex-1 flex-col pt-[4px]">
        <div className="flex items-start justify-between gap-2 pr-6">
          <div className="flex flex-nowrap items-center gap-2">
            <span className="inline-flex h-[27px] items-center whitespace-nowrap rounded bg-hoox-chip px-[10px] text-[13px] font-medium text-[#1A2C9F]">{t.dates}</span>
            {t.registrationOpen && (
              <button
                type="button"
                onClick={onRegister}
                aria-label={`Register for ${t.name}`}
                className="relative z-10 inline-flex h-[27px] flex-shrink-0 items-center rounded bg-gradient-to-b from-[#F7C23C] to-[#F2AE24] px-3 text-[13px] font-semibold text-[#0B1636] shadow-sm transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-hoox-ui"
              >
                Register
              </button>
            )}
          </div>
          <ChevronRight className="absolute bottom-4 right-3 h-6 w-6 text-hoox-ink transition group-hover:translate-x-0.5 sm:bottom-auto sm:top-[62px]" strokeWidth={2} aria-hidden />
        </div>
        <h3 className="mt-2 pr-7 text-[20px] font-bold leading-[1.15] tracking-[-0.01em] text-hoox-ink line-clamp-2">
          {/* Stretched link: the whole card opens the event page */}
          <button type="button" onClick={onOpen} className="text-left after:absolute after:inset-0 after:content-[''] focus:outline-none">
            {t.name}
          </button>
        </h3>
        {t.location && (
          <p className="mt-2 flex items-center gap-2.5 text-[15px] text-[#5884E1]">
            <MapPin className="h-[17px] w-[17px] flex-shrink-0 text-hoox-ink" strokeWidth={1.75} />
            <span className="truncate">{t.location}</span>
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-3 text-[12.5px] tracking-[-0.01em]">
          {t.anglers !== undefined && (
            <span className="flex items-center gap-1.5 text-hoox-muted">
              <Users className="h-4 w-4 text-hoox-ink" strokeWidth={1.75} /> {t.anglers} Anglers
            </span>
          )}
          {t.prizePool && (
            <span className="flex items-center gap-1 text-[#7E91E7]">
              <Trophy className="h-[18px] w-[18px] text-[#FD9C00]" fill="#FDB52A" strokeWidth={1.5} />
              <b className="font-bold text-hoox-ink">{t.prizePool}</b> Prize Pool
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- page ------------------------------- */

export default function HomePage({ tournaments, onNavigate }: HomePageProps) {
  // Hero carousel slides (Admin → Advertising → Hero Carousel). Falls back to
  // the built-in sponsor hero when none are active or the table isn't set up.
  const [heroSlides, setHeroSlides] = useState<HeroSlide[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    getActiveHeroSlides()
      .then(({ data, error }) => {
        if (!cancelled) setHeroSlides(error || !data ? [] : data.map(dbHeroSlideToApp));
      })
      .catch(() => {
        if (!cancelled) setHeroSlides([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // "We recommend" banners (Admin → Advertising → Home Page Banners).
  // The section hides itself when none are active or the table isn't set up.
  const [banners, setBanners] = useState<HomeBanner[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    getActiveHomeBanners()
      .then(({ data, error }) => {
        if (!cancelled) setBanners(error || !data ? [] : data.map(dbHomeBannerToApp));
      })
      .catch(() => {
        if (!cancelled) setBanners([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const realUpcoming = toUpcomingCards(tournaments);
  const upcoming = realUpcoming.length ? realUpcoming : DEMO_UPCOMING;
  const live = toLive(tournaments) ?? DEMO_LIVE;

  return (
    <div className="font-roboto bg-hoox-mist">
      <div className="mx-auto max-w-[1440px] px-4 md:px-[23px] pt-[18px] pb-6 space-y-[14px]">
        {/* Sponsor hero + Live now */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_428px] gap-4">
          <HeroCarousel
            slides={heroSlides}
            fallback={<SponsorHero onVisit={() => onNavigate('sponsors')} />}
          />
          <LiveNow live={live} onLeaderboard={() => onNavigate(`tournaments/${live.id ?? 'lakefront-classic'}#leaderboard`)} />
        </div>

        {/* We recommend (sponsor banners) */}
        <RecommendedSection banners={banners} onNavigate={onNavigate} />

        {/* Leaderboards */}
        <LeaderboardSection onNavigate={onNavigate} />

        {/* Upcoming tournaments */}
        <section aria-labelledby="upcoming-heading" className="rounded-lg bg-white px-3 sm:px-[12px] pt-[12px] pb-[12px] shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
          <div className="flex flex-wrap items-end justify-between gap-2 px-2 pb-[13px]">
            <div>
              <h2 id="upcoming-heading" className="text-[28px] font-bold leading-tight text-hoox-ink">Upcoming Tournaments</h2>
              <p className="text-[16px] font-light text-[#869FE6]">Discover upcoming events and get ready to compete.</p>
            </div>
            <button
              onClick={() => onNavigate('tournaments')}
              className="mb-4 flex items-center gap-2 text-[17px] font-medium text-[#016F8C] hover:text-hoox-brand transition"
            >
              View all tournaments <ArrowRight className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[13px]">
            {upcoming.map((t) => (
              <TournamentCard
                key={t.id}
                t={t}
                onOpen={() => onNavigate(`tournaments/${/^d\d+$/.test(t.id) ? 'lakefront-classic' /* demo cards open the demo event */ : t.id}`)}
                onRegister={() => onNavigate('register-angler')}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
