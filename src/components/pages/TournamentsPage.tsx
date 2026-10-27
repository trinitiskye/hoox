'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search, MapPin, Fish, Trophy, CalendarDays, ChevronDown, ArrowUpDown, ArrowRight, Star, Flag, ExternalLink, Users, Ticket,
} from 'lucide-react';
import ClubsMap from '@/components/clubs/ClubsMap';
import {
  STATE_NAMES, INK, CONTROL, type Status, StatusChip, FilterSelect, LocationSelect, ViewToggle, type ListingView,
  statusFor, fmtRange,
} from '@/components/listing/ListingUI';
import { Tournament } from '@/types';

interface TournamentsPageProps {
  /** null while loading; [] falls back to demo tournaments */
  tournaments: Tournament[] | null;
  onNavigate: (view: string) => void;
}

/* ------------------------------------------------------------------ */
/* /tournaments — tournament directory, same UI as /series.            */
/* Real tournaments from Supabase; demo tournaments when there are none.*/
/* ------------------------------------------------------------------ */

export interface TItem {
  id: string;
  href: string;
  name: string;
  sponsor?: string;
  sponsorUrl?: string;
  about: string;
  start: string; // ISO date
  end: string;
  venue?: string; // lake / waterway
  city?: string;
  stateCode?: string;
  state?: string; // full name
  country: string;
  species: string[];
  image: string;
  fee?: string;
  anglers?: number;
  prizePool?: string;
  lat?: number;
  lng?: number;
  completed?: boolean; // director marked it completed
  featured?: boolean;
}

const IMAGES = ['/home/coastal-open.jpg', '/home/pine-creek.jpg', '/home/summer-slam.jpg', '/home/mountain-lake.jpg', '/home/bayou-bash.jpg', '/home/fall-classic.jpg'];
const DEMO_HREF = '/tournaments/lakefront-classic'; // demo cards open the demo event page

export const DEMO: TItem[] = [
  {
    id: 'lakefront-classic', href: DEMO_HREF, featured: true, name: 'Lakefront Classic', sponsor: 'TidalGear', sponsorUrl: 'https://example.com',
    about: 'Three days of competitive bass fishing on Lake Hartwell, open to anglers of all skill levels, with a $150,000 total prize pool.',
    start: '2026-11-14', end: '2026-11-16', venue: 'Lake Hartwell', city: 'Hartwell', stateCode: 'GA', state: 'Georgia', country: 'United States',
    species: ['Largemouth Bass', 'Spotted Bass'], image: '/events/demo/hero.jpg', fee: '$250', anglers: 200, prizePool: '$150,000', lat: 34.3529, lng: -82.9321,
  },
  {
    id: 'coastal-open', href: DEMO_HREF, name: 'Coastal Open', sponsor: 'Coastal Outfitters', sponsorUrl: 'https://example.com',
    about: 'Inshore slam on Charleston Harbor — redfish, trout and flounder, with daily weigh-ins at the waterfront park.',
    start: '2026-10-24', end: '2026-10-27', venue: 'Charleston Harbor', city: 'Charleston', stateCode: 'SC', state: 'South Carolina', country: 'United States',
    species: ['Redfish', 'Speckled Trout'], image: IMAGES[0], fee: '$200', anglers: 200, prizePool: '$100,000', lat: 32.7765, lng: -79.9311,
  },
  {
    id: 'pine-creek-challenge', href: DEMO_HREF, name: 'Pine Creek Challenge',
    about: 'A two-day team event on Toledo Bend with a big-bass bonus for the heaviest fish of the weekend.',
    start: '2026-11-21', end: '2026-11-22', venue: 'Toledo Bend Reservoir', city: 'Hemphill', stateCode: 'TX', state: 'Texas', country: 'United States',
    species: ['Largemouth Bass'], image: IMAGES[1], fee: '$180', anglers: 180, prizePool: '$75,000', lat: 31.3402, lng: -93.8463,
  },
  {
    id: 'bayou-bash', href: DEMO_HREF, name: 'Bayou Bash', sponsor: 'Cypress Boats', sponsorUrl: 'https://example.com',
    about: 'Fish the backwaters of the Atchafalaya Basin for bass and crappie, with a fish fry at the final weigh-in.',
    start: '2026-11-07', end: '2026-11-08', venue: 'Atchafalaya Basin', city: 'Morgan City', stateCode: 'LA', state: 'Louisiana', country: 'United States',
    species: ['Largemouth Bass', 'Crappie'], image: IMAGES[4], fee: '$150', anglers: 175, prizePool: '$70,000', lat: 29.6994, lng: -91.2068,
  },
  {
    id: 'mountain-lake-invitational', href: DEMO_HREF, name: 'Mountain Lake Invitational',
    about: 'An invitational on Lake Guntersville for the region’s top-ranked anglers, with live leaderboards in the HOOX app.',
    start: '2026-12-05', end: '2026-12-06', venue: 'Lake Guntersville', city: 'Guntersville', stateCode: 'AL', state: 'Alabama', country: 'United States',
    species: ['Largemouth Bass', 'Smallmouth Bass'], image: IMAGES[3], fee: '$300', anglers: 160, prizePool: '$80,000', lat: 34.3582, lng: -86.2947,
  },
  {
    id: 'big-sky-trout-open', href: DEMO_HREF, name: 'Big Sky Trout Open', sponsor: 'High Country Fly Co.', sponsorUrl: 'https://example.com',
    about: 'Catch-photo-release fly fishing on Hebgen Lake, scored by total length of measured trout.',
    start: '2027-06-12', end: '2027-06-13', venue: 'Hebgen Lake', city: 'West Yellowstone', stateCode: 'MT', state: 'Montana', country: 'United States',
    species: ['Rainbow Trout', 'Brown Trout'], image: '/clubs/demo/high-country-fly-fishers.jpg', fee: '$120', anglers: 90, lat: 44.662, lng: -111.104,
  },
  {
    id: 'catalina-tuna-shootout', href: DEMO_HREF, name: 'Catalina Tuna Shootout', sponsor: 'Bluewater Marine', sponsorUrl: 'https://example.com',
    about: 'Offshore teams chase bluefin and yellowtail around Catalina Island, with weigh-ins at Avalon’s Green Pleasure Pier.',
    start: '2027-07-17', end: '2027-07-18', venue: 'Catalina Island', city: 'Avalon', stateCode: 'CA', state: 'California', country: 'United States',
    species: ['Bluefin Tuna', 'Yellowtail'], image: '/clubs/demo/deep-sea-explorers.jpg', fee: '$500', anglers: 60, prizePool: '$60,000', lat: 33.3428, lng: -118.3282,
  },
  {
    id: 'fall-classic', href: DEMO_HREF, name: 'Fall Classic', sponsor: 'Lakeside Tackle', sponsorUrl: 'https://example.com',
    about: 'Striper season opener on Lake Murray. Two-angler teams, five-fish limits.',
    start: '2026-10-17', end: '2026-10-18', venue: 'Lake Murray', city: 'Lexington', stateCode: 'SC', state: 'South Carolina', country: 'United States',
    species: ['Striped Bass'], image: IMAGES[5], fee: '$175', anglers: 190, prizePool: '$90,000', lat: 33.9815, lng: -81.2362,
  },
  {
    id: 'summer-slam', href: DEMO_HREF, name: 'Summer Slam',
    about: 'Florida’s biggest summer bass event on Lake Okeechobee, with payouts through 30th place.',
    start: '2026-07-11', end: '2026-07-12', venue: 'Lake Okeechobee', city: 'Clewiston', stateCode: 'FL', state: 'Florida', country: 'United States',
    species: ['Largemouth Bass'], image: IMAGES[2], fee: '$225', anglers: 220, prizePool: '$125,000', lat: 26.7542, lng: -80.9337,
  },
];

/** Approximate state centers — map pins for tournaments without exact coordinates */
const STATE_CENTER: Record<string, [number, number]> = {
  AL: [32.8, -86.8], AK: [61.4, -152.3], AZ: [34.2, -111.6], AR: [34.9, -92.4], CA: [36.8, -119.4], CO: [39.0, -105.5], CT: [41.6, -72.7],
  DE: [39.0, -75.5], FL: [28.6, -82.4], GA: [32.7, -83.4], HI: [20.8, -156.3], ID: [44.4, -114.6], IL: [40.0, -89.2], IN: [39.9, -86.3],
  IA: [42.1, -93.5], KS: [38.5, -98.4], KY: [37.5, -85.3], LA: [31.1, -92.0], ME: [45.4, -69.2], MD: [39.0, -76.8], MA: [42.3, -71.8],
  MI: [44.3, -85.4], MN: [46.3, -94.3], MS: [32.7, -89.7], MO: [38.4, -92.5], MT: [47.0, -109.6], NE: [41.5, -99.8], NV: [39.3, -116.6],
  NH: [43.7, -71.6], NJ: [40.2, -74.7], NM: [34.4, -106.1], NY: [42.9, -75.5], NC: [35.6, -79.4], ND: [47.5, -100.5], OH: [40.3, -82.8],
  OK: [35.6, -97.5], OR: [43.9, -120.6], PA: [40.9, -77.8], RI: [41.7, -71.5], SC: [33.9, -80.9], SD: [44.4, -100.2], TN: [35.9, -86.4],
  TX: [31.5, -99.3], UT: [39.3, -111.7], VT: [44.1, -72.7], VA: [37.5, -78.9], WA: [47.4, -120.5], WV: [38.6, -80.6], WI: [44.6, -89.9],
  WY: [43.0, -107.6],
};

function stateCodeOf(s?: string) {
  if (!s) return undefined;
  const up = s.trim().toUpperCase();
  if (STATE_NAMES[up]) return up;
  return Object.keys(STATE_NAMES).find((k) => STATE_NAMES[k].toLowerCase() === s.trim().toLowerCase());
}

export function fromTournament(t: Tournament, i: number): TItem {
  const code = stateCodeOf(t.state);
  const center = code ? STATE_CENTER[code] : undefined;
  const fee = t.entryFee || t.registrationFee;
  const species = t.fishTypes?.length ? t.fishTypes : t.species ? [t.species] : [];
  return {
    id: t.id,
    href: `/tournaments/${encodeURIComponent(t.id)}`,
    name: t.name,
    about: t.description || `Join us for ${t.name}${t.location ? ` on ${t.location}` : ''}.`,
    start: t.startDate,
    end: t.endDate || t.startDate,
    venue: t.location,
    city: t.city,
    stateCode: code,
    state: code ? STATE_NAMES[code] : t.state,
    country: 'United States',
    species,
    image: t.image || IMAGES[i % IMAGES.length],
    fee: fee ? (/^\$/.test(fee) ? fee : `$${fee}`) : undefined,
    anglers: t.maxParticipants ? Number(t.maxParticipants) || undefined : undefined,
    lat: center?.[0],
    lng: center?.[1],
    completed: t.status === 'completed',
  };
}

const cityLine = (t: TItem) => [t.city, t.state, t.country].filter(Boolean).join(', ');

type Sort = 'soonest' | 'start' | 'name';
const SORTS: Record<Sort, string> = { soonest: 'Happening Soon', start: 'Start Date', name: 'Name (A–Z)' };
const STATUSES: Status[] = ['In progress', 'Upcoming', 'Completed'];
const STATUS_ORDER: Record<Status, number> = { 'In progress': 0, Upcoming: 1, Completed: 2 };

/** "Presented by Sponsor ↗" — links out in a new tab when the sponsor has a URL */
function PresentedBy({ t, className }: { t: TItem; className: string }) {
  if (!t.sponsor) return null;
  const text = <>Presented by {t.sponsor}</>;
  return t.sponsorUrl ? (
    <a href={t.sponsorUrl} target="_blank" rel="noopener noreferrer sponsored" className={`inline-flex items-center gap-1.5 hover:underline ${className}`}>
      {text}
      <ExternalLink className="h-[0.95em] w-[0.95em] flex-shrink-0" strokeWidth={2} aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  ) : (
    <p className={className}>{text}</p>
  );
}

function Meta({ t, size = 'card' }: { t: TItem; size?: 'card' | 'list' }) {
  const ic = size === 'card' ? 'h-[17px] w-[17px]' : 'h-[16px] w-[16px]';
  return (
    <ul className={`space-y-[6px] ${size === 'card' ? 'text-[14.5px]' : 'text-[14px]'}`}>
      <li className={`flex items-center gap-3 font-medium ${INK}`}><CalendarDays className={`${ic} flex-shrink-0 text-[#0D1B4C]`} strokeWidth={2} />{fmtRange(t.start, t.end)}</li>
      <li className="flex items-start gap-3 text-[#5F7896]">
        <MapPin className={`mt-[2px] ${ic} flex-shrink-0 text-[#0D1B4C]`} fill="currentColor" stroke="white" strokeWidth={1.5} />
        <span>{t.venue || 'Location to be announced'}{cityLine(t) && <span className="block">{cityLine(t)}</span>}</span>
      </li>
      {t.species.length > 0 && (
        <li className="flex items-center gap-3 text-[#5F7896]"><Fish className={`${ic} flex-shrink-0 text-[#0D1B4C]`} strokeWidth={2} />{t.species.join(' • ')}</li>
      )}
      {(t.anglers || t.prizePool) && (
        <li className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[#5F7896]">
          {t.anglers && <span className="flex items-center gap-3"><Users className={`${ic} flex-shrink-0 text-[#0D1B4C]`} fill="currentColor" strokeWidth={1.5} />{t.anglers.toLocaleString()} anglers</span>}
          {t.prizePool && <span className="flex items-center gap-2"><Trophy className={`${ic} flex-shrink-0 text-[#0D1B4C]`} strokeWidth={2} />{t.prizePool}</span>}
        </li>
      )}
    </ul>
  );
}

/* -------------------------------- page ------------------------------- */

export default function TournamentsPage({ tournaments, onNavigate }: TournamentsPageProps) {
  const [q, setQ] = useState('');
  const [state, setState] = useState('all');
  const [species, setSpecies] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState<Sort>('soonest');
  const [view, setView] = useState<ListingView>('grid');

  // Deep link: /tournaments?view=map or ?view=list
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('view');
    if (v === 'map' || v === 'list') setView(v);
  }, []);

  const loading = tournaments === null;
  const items = useMemo(() => (tournaments && tournaments.length ? tournaments.map(fromTournament) : DEMO), [tournaments]);
  const today = useMemo(() => new Date(), []);
  const statusById = useMemo(
    () => Object.fromEntries(items.map((t) => [t.id, t.completed ? 'Completed' : statusFor(t.start, t.end, today)])) as Record<string, Status>,
    [items, today],
  );
  const speciesList = useMemo(() => Array.from(new Set(items.flatMap((t) => t.species))).sort(), [items]);
  const states = useMemo(() => Object.keys(STATE_NAMES).sort((a, b) => STATE_NAMES[a].localeCompare(STATE_NAMES[b])), []);

  // Everything except the Location filter (also drives the per-state counts)
  const matchingOtherFilters = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((t) => {
      if (species !== 'all' && !t.species.includes(species)) return false;
      if (status !== 'all' && statusById[t.id] !== status) return false;
      if (!term) return true;
      return [t.name, t.sponsor ?? '', t.about, t.venue ?? '', t.city ?? '', t.state ?? '', ...t.species].some((v) => v.toLowerCase().includes(term));
    });
  }, [items, q, species, status, statusById]);

  const locationOptions = useMemo(
    () => [
      { value: 'all', label: 'All Locations', count: matchingOtherFilters.length },
      ...states.map((code) => ({ value: code, label: STATE_NAMES[code], count: matchingOtherFilters.filter((t) => t.stateCode === code).length })),
    ],
    [matchingOtherFilters, states],
  );

  const results = useMemo(() => {
    const list = matchingOtherFilters.filter((t) => state === 'all' || t.stateCode === state);
    return list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'start') return a.start.localeCompare(b.start);
      const sa = statusById[a.id];
      const sb = statusById[b.id];
      if (sa !== sb) return STATUS_ORDER[sa] - STATUS_ORDER[sb];
      // Completed: most recent first; otherwise soonest first
      return sa === 'Completed' ? b.end.localeCompare(a.end) : a.start.localeCompare(b.start);
    });
  }, [matchingOtherFilters, state, sort, statusById]);

  const filtering = q.trim() !== '' || state !== 'all' || species !== 'all' || status !== 'all';
  const featured = items.find((t) => t.featured);
  const grid = featured && !filtering ? results.filter((t) => t.id !== featured.id) : results;
  const reset = () => { setQ(''); setState('all'); setSpecies('all'); setStatus('all'); };
  const mapped = results.filter((t) => t.lat !== undefined && t.lng !== undefined);

  return (
    <div className="font-roboto">
      <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-8 sm:px-6 lg:px-[42px] lg:pt-[34px]">
        <header>
          <h1 className={`font-montserrat text-[34px] font-bold leading-tight sm:text-[46px] ${INK}`}>Fishing Tournaments</h1>
          <p className="mt-2 max-w-[600px] text-[17px] leading-[24px] text-[#68819B] sm:text-[19px] sm:leading-[27px]">
            Find tournaments near you, check the details, and register to compete.
          </p>
        </header>

        {/* Featured tournament */}
        {featured && !loading && (
          <section aria-labelledby="featured-tournament" className="relative mt-6 overflow-hidden rounded-lg bg-[#0A2A47] shadow-[0_6px_20px_rgba(5,30,60,0.18)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featured.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-35 md:left-auto md:right-0 md:w-[56%] md:opacity-100 md:[-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_35%)] md:[mask-image:linear-gradient(90deg,transparent_0%,#000_35%)]"
            />
            <div className="relative z-10 flex flex-col gap-6 px-6 py-7 sm:px-10 md:min-h-[292px] md:flex-row md:items-end md:justify-between">
              <div className="max-w-[640px]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E4F63] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.02em] text-[#3FD6D0]">
                  <Star className="h-3.5 w-3.5" fill="currentColor" strokeWidth={1.5} /> Featured Tournament
                </span>
                <h2 id="featured-tournament" className="mt-4 font-montserrat text-[26px] font-bold leading-tight text-white sm:text-[32px]">{featured.name}</h2>
                <PresentedBy t={featured} className="mt-1 text-[16px] font-medium text-[#3FD6D0]" />
                <p className="mt-4 max-w-[560px] text-[16px] leading-[26px] text-white/90">{featured.about}</p>
                <p className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2 text-[16px] text-white">
                  <span className="flex items-center gap-2.5"><CalendarDays className="h-5 w-5" strokeWidth={1.75} />{fmtRange(featured.start, featured.end)}</span>
                  {featured.prizePool && <span className="flex items-center gap-2.5"><Trophy className="h-5 w-5" strokeWidth={1.75} />{featured.prizePool} prize pool</span>}
                  <span className="flex items-center gap-2.5"><MapPin className="h-5 w-5" strokeWidth={1.75} />{[featured.venue, featured.city && featured.stateCode ? `${featured.city}, ${featured.stateCode}` : ''].filter(Boolean).join(' · ')}</span>
                </p>
              </div>
              <Link
                href={featured.href}
                className="flex h-[48px] w-fit flex-shrink-0 items-center gap-4 rounded-md bg-[#22B3B5] px-7 text-[17px] font-semibold text-white shadow-[0_4px_12px_rgba(34,179,181,0.35)] transition hover:bg-[#1C9C9E]"
              >
                View tournament <ArrowRight className="h-5 w-5" strokeWidth={2} />
              </Link>
            </div>
          </section>
        )}

        {/* Filters */}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 min-[1440px]:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)_auto_220px_auto] min-[1440px]:items-center min-[1440px]:gap-[16px]" role="search" aria-label="Find tournaments">
          <label className="relative block sm:col-span-2 lg:col-span-3 min-[1440px]:col-span-1">
            <span className="sr-only">Search tournaments</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5F7896]" strokeWidth={2} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tournaments, lakes..."
              className={`${CONTROL} pl-12 pr-4 placeholder:text-[#7D8BA0]`}
            />
          </label>
          <LocationSelect value={state} onChange={setState} options={locationOptions} />
          <FilterSelect
            label="Species"
            icon={<Fish className="h-[18px] w-[18px]" strokeWidth={2} />}
            value={species}
            onChange={setSpecies}
            options={[{ value: 'all', label: 'All Species' }, ...speciesList.map((s) => ({ value: s, label: s }))]}
          />
          <FilterSelect
            label="Status"
            icon={<Flag className="h-[18px] w-[18px]" strokeWidth={2} />}
            value={status}
            onChange={setStatus}
            options={[{ value: 'all', label: 'Any Status' }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
          />
          <p className="flex items-center whitespace-nowrap text-[14px] text-[#7D8BA0] lg:justify-end" aria-live="polite">
            {loading ? 'Loading…' : `${results.length} ${results.length === 1 ? 'result' : 'results'}`}
          </p>
          <label className="relative block">
            <span className="sr-only">Sort tournaments</span>
            <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-2 text-[14px] text-[#5F7896]">
              <ArrowUpDown className="h-4 w-4 text-[#0D1B4C]" strokeWidth={2} /> <span className="min-[1440px]:sr-only">Sort by</span>
            </span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`${CONTROL} pl-[100px] pr-9 text-[14px] font-semibold min-[1440px]:pl-11 ${INK}`}>
              {(Object.keys(SORTS) as Sort[]).map((k) => <option key={k} value={k}>{SORTS[k]}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0D1B4C]" strokeWidth={2.25} />
          </label>
          <ViewToggle view={view} onChange={setView} />
        </div>

        {/* Tournaments: loading, map, empty, list or grid */}
        {loading ? (
          <ul className="mt-6 grid grid-cols-1 gap-[26px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="h-[420px] animate-pulse rounded-lg border border-[#E8EEF4] bg-white p-[7px]">
                <div className="aspect-[2.2/1] rounded-md bg-[#EEF2F6]" />
              </li>
            ))}
          </ul>
        ) : view === 'map' && results.length > 0 ? (
          <div className="mt-6">
            <ClubsMap
              clubs={mapped.map((t) => ({
                id: t.id,
                name: t.name,
                place: [t.city, t.stateCode].filter(Boolean).join(', ') || t.venue || '',
                meta: fmtRange(t.start, t.end),
                lat: t.lat!,
                lng: t.lng!,
              }))}
              onSelect={(id) => {
                const t = items.find((x) => x.id === id);
                if (t) window.location.assign(t.href);
              }}
              noun="tournament"
              emptyText="No tournaments found."
              cta="View tournament"
            />
            {mapped.length < results.length && (
              <p className="mt-2 text-[13px] text-[#7D8BA0]">{results.length - mapped.length} tournament{results.length - mapped.length === 1 ? '' : 's'} without a location aren’t shown on the map.</p>
            )}
          </div>
        ) : grid.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-lg border border-dashed border-[#C9D8E5] bg-white px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F4F5] text-[#0E7C7B]">
              <Trophy className="h-7 w-7" strokeWidth={1.75} aria-hidden />
            </span>
            <h2 className={`mt-4 font-montserrat text-[22px] font-bold ${INK}`}>No tournaments found</h2>
            <p className="mt-2 max-w-[460px] text-[15px] leading-[22px] text-[#536B84]">
              {state !== 'all'
                ? `There are no tournaments in ${STATE_NAMES[state]}${q.trim() || species !== 'all' || status !== 'all' ? ' that match your filters' : ''} yet. Try a nearby state or check back soon.`
                : 'No tournaments match your search. Try different filters or check back soon.'}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={reset} className="h-[42px] rounded-md bg-[#0E7C7B] px-6 text-[15px] font-semibold text-white transition hover:bg-[#0B6766]">
                View all tournaments
              </button>
              <button
                onClick={() => onNavigate('series')}
                className="h-[42px] rounded-md border border-[#1FA3A6] bg-white px-6 text-[15px] font-semibold text-[#0E7C7B] transition hover:bg-[#EEF9F8]"
              >
                Browse series
              </button>
            </div>
          </div>
        ) : view === 'list' ? (
          <ul className="mt-6 divide-y divide-[#EDF1F5] overflow-hidden rounded-lg border border-[#E8EEF4] bg-white shadow-[0_2px_10px_rgba(10,30,60,0.06)]">
            {grid.map((t) => (
              <li key={t.id} className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-4 gap-y-3 p-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4 lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,300px)_auto] lg:items-center lg:gap-6">
                <div className="relative aspect-square overflow-hidden rounded-md bg-[#E9F2F7] sm:aspect-[2.2/1]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <StatusChip status={statusById[t.id]} />
                  <h3 className={`mt-1.5 font-montserrat text-[18px] font-bold leading-tight ${INK}`}>{t.name}</h3>
                  <PresentedBy t={t} className="mt-1 w-fit text-[14px] font-medium text-[#0E7C7B]" />
                  <p className="mt-1.5 hidden text-[14px] leading-[20px] text-[#536B84] sm:line-clamp-2">{t.about}</p>
                </div>
                <p className="col-span-2 line-clamp-2 text-[14px] leading-[20px] text-[#536B84] sm:hidden">{t.about}</p>
                <div className="col-span-2 sm:col-span-1 sm:col-start-2 lg:col-start-auto"><Meta t={t} size="list" /></div>
                <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1 sm:col-start-2 sm:w-fit lg:col-start-auto lg:items-center">
                  <Link
                    href={t.href}
                    aria-label={`View tournament ${t.name}`}
                    className="flex h-[38px] items-center justify-center gap-2 whitespace-nowrap rounded-md border border-[#1FA3A6] px-5 text-[14px] font-semibold text-[#0E7C7B] transition hover:bg-[#EEF9F8]"
                  >
                    View tournament <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </Link>
                  {t.fee && <span className="flex items-center justify-center gap-1.5 text-[13px] text-[#5F7896]"><Ticket className="h-4 w-4" strokeWidth={1.75} />Entry {t.fee}</span>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-[26px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {grid.map((t) => (
              <li key={t.id} className="flex flex-col overflow-hidden rounded-lg border border-[#E8EEF4] bg-white p-[7px] shadow-[0_2px_10px_rgba(10,30,60,0.06)]">
                <div className="relative aspect-[2.2/1] overflow-hidden rounded-md bg-[#E9F2F7]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                  <StatusChip status={statusById[t.id]} className="absolute left-2.5 top-2.5 shadow-sm" />
                </div>
                <div className="flex flex-1 flex-col px-[12px] pb-[12px] pt-[14px]">
                  <h3 className={`font-montserrat text-[19px] font-bold leading-tight ${INK}`}>{t.name}</h3>
                  <PresentedBy t={t} className="mt-1 w-fit text-[14px] font-medium text-[#0E7C7B]" />
                  <p className="mt-2.5 line-clamp-3 text-[14px] leading-[20px] text-[#536B84]">{t.about}</p>
                  <div className="mt-3"><Meta t={t} /></div>
                  <div className="mt-auto pt-[18px]">
                    {t.fee && <p className="mb-2 flex items-center gap-2 text-[13px] text-[#5F7896]"><Ticket className="h-4 w-4" strokeWidth={1.75} />Entry fee {t.fee}</p>}
                    <Link
                      href={t.href}
                      aria-label={`View tournament ${t.name}`}
                      className="flex h-[38px] w-full items-center justify-center gap-2 rounded-md border border-[#1FA3A6] text-[14px] font-semibold text-[#0E7C7B] transition hover:bg-[#EEF9F8]"
                    >
                      View tournament <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Call to action */}
        <section className="mt-12 flex flex-col items-start gap-6 rounded-lg bg-gradient-to-r from-[#0A2A47] to-[#0E5A6E] px-6 py-8 shadow-[0_6px_20px_rgba(5,30,60,0.18)] sm:px-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-montserrat text-[24px] font-bold leading-tight text-white sm:text-[28px]">Ready to compete?</h2>
            <p className="mt-2 max-w-[560px] text-[16px] leading-[24px] text-white/85">
              Create a free HOOX account to register for tournaments, submit catches and follow live leaderboards.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              onClick={() => onNavigate('register')}
              className="flex h-[46px] items-center justify-center gap-3 rounded-md bg-[#22B3B5] px-7 text-[16px] font-semibold text-white shadow-[0_4px_12px_rgba(34,179,181,0.35)] transition hover:bg-[#1C9C9E]"
            >
              Get Hoox! <ArrowRight className="h-5 w-5" strokeWidth={2} />
            </button>
            <button onClick={() => onNavigate('login')} className="h-[46px] rounded-md border border-white/70 px-7 text-[16px] font-medium text-white transition hover:bg-white/10">
              Sign In
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
