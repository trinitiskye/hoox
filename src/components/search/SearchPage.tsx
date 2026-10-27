'use client';

/* ------------------------------------------------------------------ */
/* /search — find tournaments or series.                               */
/* Filters: keyword, state, species/style, status, date or date range, */
/* and distance from the visitor (IP location) or a ZIP code.          */
/* Results: card, list or map, sorted by Happening Soon, Start Date,   */
/* Name, or Nearest (when a location is set). Filters live in the URL  */
/* so a search can be bookmarked or shared.                            */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, MapPin, Fish, Trophy, CalendarDays, ChevronDown, ArrowUpDown, ArrowRight, Flag, ExternalLink, Users, Ticket,
  LocateFixed, Navigation, X, Loader2, Layers, Star,
} from 'lucide-react';
import ClubsMap from '@/components/clubs/ClubsMap';
import {
  STATE_NAMES, INK, CONTROL, type Status, StatusChip, FilterSelect, LocationSelect, ViewToggle, type ListingView,
  statusFor, fmtRange,
} from '@/components/listing/ListingUI';
import DateRangePicker from '@/components/listing/DateRangePicker';
import { SERIES, SeriesDialog, type SeriesItem } from '@/components/pages/SeriesPage';
import { DEMO as DEMO_TOURNAMENTS, fromTournament, type TItem } from '@/components/pages/TournamentsPage';
import { fetchTournaments } from '@/lib/storage';
import { toPath } from '@/lib/routes';
import { Tournament } from '@/types';

type Kind = 'tournaments' | 'series';
type Sort = 'soonest' | 'start' | 'name' | 'nearest';
const SORTS: Record<Sort, string> = { soonest: 'Happening Soon', start: 'Start Date', name: 'Name (A–Z)', nearest: 'Nearest' };
const STATUSES: Status[] = ['In progress', 'Upcoming', 'Completed'];
const STATUS_ORDER: Record<Status, number> = { 'In progress': 0, Upcoming: 1, Completed: 2 };
const RADII = [25, 50, 100, 250, 500];

interface Result {
  id: string;
  kind: Kind;
  name: string;
  sponsor?: string;
  sponsorUrl?: string;
  about: string;
  start: string;
  end: string;
  place1: string; // venue (tournament) or region (series)
  place2: string; // city, state, country
  stateCodes: string[];
  tags: string[]; // species (tournaments) or fishing styles (series)
  image: string;
  anglers?: number;
  prizePool?: string;
  fee?: string;
  events?: number;
  lat?: number;
  lng?: number;
  completed?: boolean;
  href?: string; // tournaments
  series?: SeriesItem; // series open in the details window
}

interface Origin { lat: number; lng: number; label: string; source: 'ip' | 'zip'; zip?: string }

/* ------------------------------ mapping ------------------------------ */

const codeFor = (name: string) => Object.keys(STATE_NAMES).find((k) => STATE_NAMES[k] === name);

function fromTItem(t: TItem): Result {
  return {
    id: t.id, kind: 'tournaments', name: t.name, sponsor: t.sponsor, sponsorUrl: t.sponsorUrl, about: t.about,
    start: t.start, end: t.end, place1: t.venue || 'Location to be announced',
    place2: [t.city, t.state, t.country].filter(Boolean).join(', '),
    stateCodes: t.stateCode ? [t.stateCode] : [], tags: t.species, image: t.image,
    anglers: t.anglers, prizePool: t.prizePool, fee: t.fee, lat: t.lat, lng: t.lng, completed: t.completed, href: t.href,
  };
}

function fromSeries(s: SeriesItem): Result {
  const home = codeFor(s.state);
  return {
    id: s.id, kind: 'series', name: s.name, sponsor: s.sponsor, sponsorUrl: s.sponsorUrl, about: s.about,
    start: s.start, end: s.end, place1: s.region, place2: `${s.city}, ${s.state}, ${s.country}`,
    stateCodes: Array.from(new Set([...s.states, ...(home ? [home] : [])])), tags: s.styles, image: s.image,
    events: s.stops.length, lat: s.lat, lng: s.lng, series: s,
  };
}

/** Great-circle distance in miles */
function miles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* ------------------------------ geo lookups ----------------------------- */

async function lookupIp(): Promise<Origin> {
  // 1) Cloudflare's location for this request (production)
  try {
    const r = await fetch('/api/geo', { cache: 'no-store' });
    if (r.ok) {
      const g = await r.json();
      return { lat: g.lat, lng: g.lng, label: [g.city, g.region].filter(Boolean).join(', ') || 'your location', source: 'ip' };
    }
  } catch { /* fall through */ }
  // 2) Public IP lookup (local dev, or if the above is unavailable)
  const r = await fetch('https://ipapi.co/json/');
  if (!r.ok) throw new Error('lookup failed');
  const g = await r.json();
  if (typeof g.latitude !== 'number') throw new Error('no location');
  return { lat: g.latitude, lng: g.longitude, label: [g.city, g.region_code].filter(Boolean).join(', ') || 'your location', source: 'ip' };
}

async function lookupZip(zip: string): Promise<Origin> {
  const r = await fetch(`https://api.zippopotam.us/us/${zip}`);
  if (!r.ok) throw new Error('not found');
  const g = await r.json();
  const p = g.places?.[0];
  if (!p) throw new Error('not found');
  return { lat: Number(p.latitude), lng: Number(p.longitude), label: `${p['place name']}, ${p['state abbreviation']} ${zip}`, source: 'zip', zip };
}

/* ------------------------------ pieces ------------------------------- */

function PresentedBy({ r, className }: { r: Result; className: string }) {
  if (!r.sponsor) return null;
  const text = <>Presented by {r.sponsor}</>;
  return r.sponsorUrl ? (
    <a href={r.sponsorUrl} target="_blank" rel="noopener noreferrer sponsored" className={`inline-flex items-center gap-1.5 hover:underline ${className}`}>
      {text}
      <ExternalLink className="h-[0.95em] w-[0.95em] flex-shrink-0" strokeWidth={2} aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  ) : (
    <p className={className}>{text}</p>
  );
}

function Meta({ r, distance, size = 'card' }: { r: Result; distance?: number; size?: 'card' | 'list' }) {
  const ic = size === 'card' ? 'h-[17px] w-[17px]' : 'h-[16px] w-[16px]';
  return (
    <ul className={`space-y-[6px] ${size === 'card' ? 'text-[14.5px]' : 'text-[14px]'}`}>
      <li className={`flex items-center gap-3 font-medium ${INK}`}><CalendarDays className={`${ic} flex-shrink-0 text-[#0D1B4C]`} strokeWidth={2} />{fmtRange(r.start, r.end)}</li>
      <li className="flex items-start gap-3 text-[#5F7896]">
        <MapPin className={`mt-[2px] ${ic} flex-shrink-0 text-[#0D1B4C]`} fill="currentColor" stroke="white" strokeWidth={1.5} />
        <span>{r.place1}{r.place2 && <span className="block">{r.place2}</span>}</span>
      </li>
      {distance !== undefined && (
        <li className="flex items-center gap-3 font-medium text-[#0E7C7B]"><Navigation className={`${ic} flex-shrink-0`} strokeWidth={2} />{distance < 1 ? 'Under 1 mi away' : `${Math.round(distance).toLocaleString()} mi away`}</li>
      )}
      {r.tags.length > 0 && (
        <li className="flex items-center gap-3 text-[#5F7896]"><Fish className={`${ic} flex-shrink-0 text-[#0D1B4C]`} strokeWidth={2} />{r.tags.join(' • ')}</li>
      )}
      {(r.anglers || r.prizePool || r.events) && (
        <li className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[#5F7896]">
          {r.events && <span className="flex items-center gap-3"><Trophy className={`${ic} flex-shrink-0 text-[#0D1B4C]`} strokeWidth={2} />{r.events} events</span>}
          {r.anglers && <span className="flex items-center gap-3"><Users className={`${ic} flex-shrink-0 text-[#0D1B4C]`} fill="currentColor" strokeWidth={1.5} />{r.anglers.toLocaleString()} anglers</span>}
          {r.prizePool && <span className="flex items-center gap-2"><Trophy className={`${ic} flex-shrink-0 text-[#0D1B4C]`} strokeWidth={2} />{r.prizePool}</span>}
        </li>
      )}
    </ul>
  );
}

function OpenButton({ r, onSeries, className }: { r: Result; onSeries: (s: SeriesItem) => void; className: string }) {
  const content = <>{r.kind === 'series' ? 'View series' : 'View tournament'} <ArrowRight className="h-4 w-4" strokeWidth={2} /></>;
  return r.kind === 'series' && r.series ? (
    <button type="button" onClick={() => onSeries(r.series!)} aria-label={`View series ${r.name}`} className={className}>{content}</button>
  ) : (
    <Link href={r.href ?? '/tournaments'} aria-label={`View tournament ${r.name}`} className={className}>{content}</Link>
  );
}

/* -------------------------------- page ------------------------------- */

export default function SearchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const get = (k: string) => params.get(k) ?? '';

  // Clubs have their own directory + search
  const rawType = get('type').toLowerCase();
  useEffect(() => {
    if (rawType === 'clubs') router.replace('/clubs');
  }, [rawType, router]);

  const [kind, setKind] = useState<Kind>(rawType === 'series' ? 'series' : 'tournaments');
  const [q, setQ] = useState(get('q'));
  const [state, setState] = useState(get('state') && STATE_NAMES[get('state')] ? get('state') : 'all');
  const [species, setSpecies] = useState(get('species') || 'all');
  const [status, setStatus] = useState(STATUSES.includes(get('status') as Status) ? get('status') : 'all');
  const [from, setFrom] = useState(/^\d{4}-\d{2}-\d{2}$/.test(get('from')) ? get('from') : '');
  const [to, setTo] = useState(/^\d{4}-\d{2}-\d{2}$/.test(get('to')) ? get('to') : '');
  const [radius, setRadius] = useState(RADII.includes(Number(get('radius'))) ? Number(get('radius')) : 100);
  const [sort, setSort] = useState<Sort>((Object.keys(SORTS) as Sort[]).includes(get('sort') as Sort) ? (get('sort') as Sort) : 'soonest');
  const [view, setView] = useState<ListingView>(['list', 'map'].includes(get('view')) ? (get('view') as ListingView) : 'grid');

  const [origin, setOrigin] = useState<Origin | null>(null);
  const [zipInput, setZipInput] = useState(get('zip'));
  const [geoBusy, setGeoBusy] = useState<'ip' | 'zip' | null>(null);
  const [geoError, setGeoError] = useState('');
  const [openSeries, setOpenSeries] = useState<SeriesItem | null>(null);

  // Results stay hidden until the visitor runs a search (or opens a shared search link)
  const [searched, setSearched] = useState(() => ['search', 'q', 'state', 'species', 'status', 'from', 'zip'].some((k) => params.get(k)));
  const resultsRef = useRef<HTMLDivElement>(null);
  const runSearch = () => {
    setSearched(true);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const [tournaments, setTournaments] = useState<Tournament[] | null>(null);
  useEffect(() => {
    fetchTournaments().then(setTournaments).catch(() => setTournaments([]));
  }, []);

  // ZIP from a shared link
  const initialZip = useRef(get('zip'));
  useEffect(() => {
    if (/^\d{5}$/.test(initialZip.current)) applyZip(initialZip.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the URL in step with the filters (no coordinates stored)
  useEffect(() => {
    if (rawType === 'clubs') return; // redirecting to /clubs
    const p = new URLSearchParams();
    p.set('type', kind);
    if (q.trim()) p.set('q', q.trim());
    if (state !== 'all') p.set('state', state);
    if (species !== 'all') p.set('species', species);
    if (status !== 'all') p.set('status', status);
    if (from) p.set('from', from);
    if (to && to !== from) p.set('to', to);
    if (origin?.source === 'zip' && origin.zip) { p.set('zip', origin.zip); p.set('radius', String(radius)); }
    if (origin?.source === 'ip') p.set('radius', String(radius));
    if (searched) p.set('search', '1');
    if (sort !== 'soonest') p.set('sort', sort);
    if (view !== 'grid') p.set('view', view);
    const next = `/search?${p.toString()}`;
    if (next !== `/search?${params.toString()}`) router.replace(next, { scroll: false });
  }, [kind, q, state, species, status, from, to, origin, radius, sort, view, searched]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyZip = async (zip: string) => {
    if (!/^\d{5}$/.test(zip)) { setGeoError('Enter a 5-digit ZIP code.'); return; }
    setGeoBusy('zip'); setGeoError('');
    try {
      const o = await lookupZip(zip);
      setOrigin(o);
      setSort('nearest');
      runSearch();
    } catch {
      setGeoError(`We couldn’t find ZIP code ${zip}.`);
    } finally {
      setGeoBusy(null);
    }
  };

  const locateMe = async () => {
    setGeoBusy('ip'); setGeoError('');
    try {
      const o = await lookupIp();
      setOrigin(o);
      setZipInput('');
      setSort('nearest');
      runSearch();
    } catch {
      setGeoError('We couldn’t detect your location. Enter a ZIP code instead.');
    } finally {
      setGeoBusy(null);
    }
  };

  const clearOrigin = () => {
    setOrigin(null);
    setZipInput('');
    setGeoError('');
    if (sort === 'nearest') setSort('soonest');
  };

  /* ---------- data ---------- */
  const loading = kind === 'tournaments' && tournaments === null;

  // Featured tournament hero: a featured listing, otherwise the next one coming up
  const featured = useMemo(() => {
    if (tournaments === null) return null;
    const list = tournaments.length ? tournaments.map(fromTournament) : DEMO_TOURNAMENTS;
    const now = new Date();
    const pick =
      list.find((t) => t.featured) ??
      list.filter((t) => !t.completed && new Date(`${t.end}T23:59:59`) >= now).sort((a, b) => a.start.localeCompare(b.start))[0];
    return pick ? fromTItem(pick) : null;
  }, [tournaments]);
  const items = useMemo<Result[]>(() => {
    if (kind === 'series') return SERIES.map(fromSeries);
    const list = tournaments && tournaments.length ? tournaments.map(fromTournament) : DEMO_TOURNAMENTS;
    return list.map(fromTItem);
  }, [kind, tournaments]);

  const today = useMemo(() => new Date(), []);
  const statusById = useMemo(
    () => Object.fromEntries(items.map((r) => [r.id, r.completed ? 'Completed' : statusFor(r.start, r.end, today)])) as Record<string, Status>,
    [items, today],
  );
  const distById = useMemo(() => {
    const m: Record<string, number> = {};
    if (origin) items.forEach((r) => { if (r.lat !== undefined && r.lng !== undefined) m[r.id] = miles(origin, { lat: r.lat, lng: r.lng }); });
    return m;
  }, [items, origin]);
  const tagList = useMemo(() => Array.from(new Set(items.flatMap((r) => r.tags))).sort(), [items]);
  const states = useMemo(() => Object.keys(STATE_NAMES).sort((a, b) => STATE_NAMES[a].localeCompare(STATE_NAMES[b])), []);

  // Every filter except Location (drives the per-state counts too)
  const matchingOtherFilters = useMemo(() => {
    const term = q.trim().toLowerCase();
    const end = to || from;
    return items.filter((r) => {
      if (species !== 'all' && !r.tags.includes(species)) return false;
      if (status !== 'all' && statusById[r.id] !== status) return false;
      if (from && !(r.start <= end && r.end >= from)) return false; // overlaps the chosen dates
      if (origin && !(distById[r.id] !== undefined && distById[r.id] <= radius)) return false;
      if (!term) return true;
      return [r.name, r.sponsor ?? '', r.about, r.place1, r.place2, ...r.tags, ...(r.series?.stops.flatMap((s) => [s.name, s.place]) ?? [])]
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [items, q, species, status, from, to, origin, radius, statusById, distById]);

  const locationOptions = useMemo(
    () => [
      { value: 'all', label: 'All Locations', count: matchingOtherFilters.length },
      ...states.map((code) => ({ value: code, label: STATE_NAMES[code], count: matchingOtherFilters.filter((r) => r.stateCodes.includes(code)).length })),
    ],
    [matchingOtherFilters, states],
  );

  const results = useMemo(() => {
    const list = matchingOtherFilters.filter((r) => state === 'all' || r.stateCodes.includes(state));
    return list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'start') return a.start.localeCompare(b.start);
      if (sort === 'nearest' && origin) return (distById[a.id] ?? Infinity) - (distById[b.id] ?? Infinity);
      const sa = statusById[a.id];
      const sb = statusById[b.id];
      if (sa !== sb) return STATUS_ORDER[sa] - STATUS_ORDER[sb];
      return sa === 'Completed' ? b.end.localeCompare(a.end) : a.start.localeCompare(b.start);
    });
  }, [matchingOtherFilters, state, sort, origin, statusById, distById]);

  const filtering = q.trim() !== '' || state !== 'all' || species !== 'all' || status !== 'all' || !!from || !!origin;
  const resetAll = () => { setQ(''); setState('all'); setSpecies('all'); setStatus('all'); setFrom(''); setTo(''); clearOrigin(); };
  const noun = kind === 'series' ? 'series' : results.length === 1 ? 'tournament' : 'tournaments';
  const mapped = results.filter((r) => r.lat !== undefined && r.lng !== undefined);
  const switchKind = (k: Kind) => { setKind(k); setSpecies('all'); };

  const sortOptions = (Object.keys(SORTS) as Sort[]).filter((k) => k !== 'nearest' || origin);

  if (rawType === 'clubs') return <div className="py-24" />;

  return (
    <div className="font-roboto">
      <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-8 sm:px-6 lg:px-[42px] lg:pt-[34px]">
        {/* Featured tournament */}
        {featured ? (
          <section aria-labelledby="featured-tournament" className="relative mb-8 overflow-hidden rounded-lg bg-[#0A2A47] shadow-[0_6px_20px_rgba(5,30,60,0.18)]">
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
                <PresentedBy r={featured} className="mt-1 text-[16px] font-medium text-[#3FD6D0]" />
                <p className="mt-4 max-w-[560px] text-[16px] leading-[26px] text-white/90">{featured.about}</p>
                <p className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2 text-[16px] text-white">
                  <span className="flex items-center gap-2.5"><CalendarDays className="h-5 w-5" strokeWidth={1.75} />{fmtRange(featured.start, featured.end)}</span>
                  {featured.prizePool && <span className="flex items-center gap-2.5"><Trophy className="h-5 w-5" strokeWidth={1.75} />{featured.prizePool} prize pool</span>}
                  <span className="flex items-center gap-2.5"><MapPin className="h-5 w-5" strokeWidth={1.75} />{[featured.place1, featured.place2.replace(/, United States$/, '')].filter(Boolean).join(' · ')}</span>
                </p>
              </div>
              <Link
                href={featured.href ?? '/tournaments'}
                className="flex h-[48px] w-fit flex-shrink-0 items-center gap-4 rounded-md bg-[#22B3B5] px-7 text-[17px] font-semibold text-white shadow-[0_4px_12px_rgba(34,179,181,0.35)] transition hover:bg-[#1C9C9E]"
              >
                View tournament <ArrowRight className="h-5 w-5" strokeWidth={2} />
              </Link>
            </div>
          </section>
        ) : tournaments === null ? (
          <div className="mb-8 h-[292px] animate-pulse rounded-lg bg-[#DCE6EE]" aria-hidden />
        ) : null}

        <header>
          <h1 className={`font-montserrat text-[34px] font-bold leading-tight sm:text-[46px] ${INK}`}>Search</h1>
          <p className="mt-2 max-w-[640px] text-[17px] leading-[24px] text-[#68819B] sm:text-[19px] sm:leading-[27px]">
            Find tournaments and series by location, species, date, or distance from you.
          </p>
        </header>

        {/* Search form */}
        <section aria-label="Search filters" className="mt-6 rounded-lg border border-[#E8EEF4] bg-white p-4 shadow-[0_2px_10px_rgba(10,30,60,0.06)] sm:p-5">
          <form onSubmit={(e) => { e.preventDefault(); runSearch(); }} role="search" className="space-y-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[auto_minmax(0,1fr)]">
              {/* Tournaments / Series */}
              <div role="radiogroup" aria-label="Search for" className="flex h-[50px] rounded-md border border-[#D9E3EC] bg-[#F5F8FA] p-1">
                {([
                  { key: 'tournaments', label: 'Tournaments', icon: <Trophy className="h-[18px] w-[18px]" strokeWidth={2} /> },
                  { key: 'series', label: 'Series', icon: <Layers className="h-[18px] w-[18px]" strokeWidth={2} /> },
                ] as const).map((t) => {
                  const active = kind === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => switchKind(t.key)}
                      className={`flex h-full flex-1 items-center justify-center gap-2 rounded px-5 text-[15px] font-semibold transition ${
                        active ? 'bg-[#0E7C7B] text-white shadow-sm' : 'text-[#0D1B4C] hover:bg-white'
                      }`}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <label className="relative block">
                <span className="sr-only">Keyword</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5F7896]" strokeWidth={2} />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={kind === 'series' ? 'Series name, lake, or sponsor...' : 'Tournament name, lake, or sponsor...'}
                  className={`${CONTROL} pl-12 pr-4 placeholder:text-[#7D8BA0]`}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <LocationSelect value={state} onChange={setState} options={locationOptions} />
              <FilterSelect
                label={kind === 'series' ? 'Fishing style' : 'Species'}
                icon={<Fish className="h-[18px] w-[18px]" strokeWidth={2} />}
                value={species}
                onChange={setSpecies}
                options={[{ value: 'all', label: kind === 'series' ? 'All Fishing Styles' : 'All Species' }, ...tagList.map((s) => ({ value: s, label: s }))]}
              />
              <FilterSelect
                label="Status"
                icon={<Flag className="h-[18px] w-[18px]" strokeWidth={2} />}
                value={status}
                onChange={setStatus}
                options={[{ value: 'all', label: 'Any Status' }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
              />
              <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
            </div>

            {/* Near me / ZIP */}
            <div className="flex flex-col gap-3 border-t border-[#EDF1F5] pt-4 md:flex-row md:flex-wrap md:items-center">
              <button
                type="button"
                onClick={locateMe}
                disabled={geoBusy !== null}
                className="flex h-[46px] items-center justify-center gap-2 rounded-md border border-[#1FA3A6] bg-white px-5 text-[15px] font-semibold text-[#0E7C7B] transition hover:bg-[#EEF9F8] disabled:opacity-60"
              >
                {geoBusy === 'ip' ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <LocateFixed className="h-[18px] w-[18px]" strokeWidth={2} />}
                Near me
              </button>
              <span className="hidden text-[14px] text-[#7D8BA0] md:inline">or</span>
              <div className="flex gap-2">
                <label className="relative block flex-1 md:w-[170px] md:flex-none">
                  <span className="sr-only">ZIP code</span>
                  <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#5F7896]" strokeWidth={2} />
                  <input
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={5}
                    value={zipInput}
                    onChange={(e) => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyZip(zipInput); } }}
                    placeholder="ZIP code"
                    className="h-[46px] w-full rounded-md border border-[#D9E3EC] bg-white pl-10 pr-3 text-[15px] text-[#1F2D3D] placeholder:text-[#7D8BA0] focus:border-hoox-ui focus:outline-none focus:ring-2 focus:ring-hoox-ui/40"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => applyZip(zipInput)}
                  disabled={geoBusy !== null}
                  className="flex h-[46px] items-center gap-2 rounded-md bg-[#0E7C7B] px-5 text-[15px] font-semibold text-white transition hover:bg-[#0B6766] disabled:opacity-60"
                >
                  {geoBusy === 'zip' && <Loader2 className="h-4 w-4 animate-spin" />}
                  Go
                </button>
              </div>
              <label className="relative block md:w-[170px]">
                <span className="sr-only">Distance</span>
                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="h-[46px] w-full appearance-none rounded-md border border-[#D9E3EC] bg-white pl-4 pr-9 text-[15px] font-medium text-[#1F2D3D] focus:border-hoox-ui focus:outline-none focus:ring-2 focus:ring-hoox-ui/40"
                >
                  {RADII.map((r) => <option key={r} value={r}>Within {r} miles</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0D1B4C]" strokeWidth={2.25} />
              </label>

              {origin && (
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#E6F4F5] py-1.5 pl-3 pr-1.5 text-[14px] font-medium text-[#0E5A5A]">
                  <Navigation className="h-4 w-4" strokeWidth={2} />
                  Near {origin.label}{origin.source === 'ip' ? ' (approx.)' : ''}
                  <button type="button" onClick={clearOrigin} aria-label="Clear location" className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/70">
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </span>
              )}
              {geoError && <p role="alert" className="text-[14px] text-[#B42318]">{geoError}</p>}

              <button
                type="submit"
                className="flex h-[50px] items-center justify-center gap-2.5 rounded-md bg-[#22B3B5] px-8 text-[16px] font-semibold text-white shadow-[0_4px_12px_rgba(34,179,181,0.3)] transition hover:bg-[#1C9C9E] md:ml-auto"
              >
                <Search className="h-5 w-5" strokeWidth={2.25} /> Search
              </button>
            </div>
          </form>
        </section>

        {searched && (
          <div ref={resultsRef} className="scroll-mt-24">
            {/* Results bar */}
            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-[15px] text-[#5F7896]" aria-live="polite">
                {loading ? 'Loading…' : <><span className={`font-semibold ${INK}`}>{results.length}</span> {noun} found</>}
                {filtering && !loading && (
                  <button type="button" onClick={resetAll} className="ml-3 font-semibold text-[#0E7C7B] hover:underline">Clear all filters</button>
                )}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative block sm:w-[250px]">
                  <span className="sr-only">Sort results</span>
                  <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-2 text-[14px] text-[#5F7896]">
                    <ArrowUpDown className="h-4 w-4 text-[#0D1B4C]" strokeWidth={2} /> Sort by
                  </span>
                  <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`${CONTROL} pl-[100px] pr-9 text-[14px] font-semibold ${INK}`}>
                    {sortOptions.map((k) => <option key={k} value={k}>{SORTS[k]}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0D1B4C]" strokeWidth={2.25} />
                </label>
                <ViewToggle view={view} onChange={setView} />
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <ul className="mt-4 grid grid-cols-1 gap-[26px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
                {Array.from({ length: 8 }).map((_, i) => (
                  <li key={i} className="h-[420px] animate-pulse rounded-lg border border-[#E8EEF4] bg-white p-[7px]"><div className="aspect-[2.2/1] rounded-md bg-[#EEF2F6]" /></li>
                ))}
              </ul>
            ) : results.length === 0 ? (
              <div className="mt-4 flex flex-col items-center rounded-lg border border-dashed border-[#C9D8E5] bg-white px-6 py-16 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F4F5] text-[#0E7C7B]">
                  <Search className="h-7 w-7" strokeWidth={1.75} aria-hidden />
                </span>
                <h2 className={`mt-4 font-montserrat text-[22px] font-bold ${INK}`}>No {kind === 'series' ? 'series' : 'tournaments'} found</h2>
                <p className="mt-2 max-w-[480px] text-[15px] leading-[22px] text-[#536B84]">
                  {origin
                    ? `Nothing matches within ${radius} miles of ${origin.label}. Try a larger distance or fewer filters.`
                    : state !== 'all'
                      ? `There are no ${kind === 'series' ? 'series' : 'tournaments'} in ${STATE_NAMES[state]} that match your search yet.`
                      : 'Try a different keyword, date range, or fewer filters.'}
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button type="button" onClick={resetAll} className="h-[42px] rounded-md bg-[#0E7C7B] px-6 text-[15px] font-semibold text-white transition hover:bg-[#0B6766]">
                    Clear all filters
                  </button>
                  {origin && radius < 500 && (
                    <button
                      type="button"
                      onClick={() => setRadius(RADII.find((r) => r > radius) ?? 500)}
                      className="h-[42px] rounded-md border border-[#1FA3A6] bg-white px-6 text-[15px] font-semibold text-[#0E7C7B] transition hover:bg-[#EEF9F8]"
                    >
                      Search within {RADII.find((r) => r > radius)} miles
                    </button>
                  )}
                </div>
              </div>
            ) : view === 'map' ? (
              <div className="mt-4">
                <ClubsMap
                  clubs={mapped.map((r) => ({
                    id: r.id,
                    name: r.name,
                    place: r.place2.replace(/, United States$/, ''),
                    meta: distById[r.id] !== undefined ? `${fmtRange(r.start, r.end)} · ${Math.round(distById[r.id])} mi` : fmtRange(r.start, r.end),
                    lat: r.lat!,
                    lng: r.lng!,
                  }))}
                  onSelect={(id) => {
                    const r = results.find((x) => x.id === id);
                    if (!r) return;
                    if (r.series) setOpenSeries(r.series);
                    else if (r.href) router.push(r.href);
                  }}
                  noun={kind === 'series' ? 'series' : 'tournament'}
                  nounPlural={kind === 'series' ? 'series' : 'tournaments'}
                  emptyText={`No ${kind === 'series' ? 'series' : 'tournaments'} found.`}
                  cta={kind === 'series' ? 'View series' : 'View tournament'}
                />
                {mapped.length < results.length && (
                  <p className="mt-2 text-[13px] text-[#7D8BA0]">{results.length - mapped.length} without a location aren’t shown on the map.</p>
                )}
              </div>
            ) : view === 'list' ? (
              <ul className="mt-4 divide-y divide-[#EDF1F5] overflow-hidden rounded-lg border border-[#E8EEF4] bg-white shadow-[0_2px_10px_rgba(10,30,60,0.06)]">
                {results.map((r) => (
                  <li key={r.id} className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-4 gap-y-3 p-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4 lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,300px)_auto] lg:items-center lg:gap-6">
                    <div className="relative aspect-square overflow-hidden rounded-md bg-[#E9F2F7] sm:aspect-[2.2/1]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <StatusChip status={statusById[r.id]} />
                      <h3 className={`mt-1.5 font-montserrat text-[18px] font-bold leading-tight ${INK}`}>{r.name}</h3>
                      <PresentedBy r={r} className="mt-1 w-fit text-[14px] font-medium text-[#0E7C7B]" />
                      <p className="mt-1.5 hidden text-[14px] leading-[20px] text-[#536B84] sm:line-clamp-2">{r.about}</p>
                    </div>
                    <p className="col-span-2 line-clamp-2 text-[14px] leading-[20px] text-[#536B84] sm:hidden">{r.about}</p>
                    <div className="col-span-2 sm:col-span-1 sm:col-start-2 lg:col-start-auto"><Meta r={r} distance={distById[r.id]} size="list" /></div>
                    <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1 sm:col-start-2 sm:w-fit lg:col-start-auto lg:items-center">
                      <OpenButton r={r} onSeries={setOpenSeries} className="flex h-[38px] items-center justify-center gap-2 whitespace-nowrap rounded-md border border-[#1FA3A6] px-5 text-[14px] font-semibold text-[#0E7C7B] transition hover:bg-[#EEF9F8]" />
                      {r.fee && <span className="flex items-center justify-center gap-1.5 text-[13px] text-[#5F7896]"><Ticket className="h-4 w-4" strokeWidth={1.75} />Entry {r.fee}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-[26px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {results.map((r) => (
                  <li key={r.id} className="flex flex-col overflow-hidden rounded-lg border border-[#E8EEF4] bg-white p-[7px] shadow-[0_2px_10px_rgba(10,30,60,0.06)]">
                    <div className="relative aspect-[2.2/1] overflow-hidden rounded-md bg-[#E9F2F7]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                      <StatusChip status={statusById[r.id]} className="absolute left-2.5 top-2.5 shadow-sm" />
                    </div>
                    <div className="flex flex-1 flex-col px-[12px] pb-[12px] pt-[14px]">
                      <h3 className={`font-montserrat text-[19px] font-bold leading-tight ${INK}`}>{r.name}</h3>
                      <PresentedBy r={r} className="mt-1 w-fit text-[14px] font-medium text-[#0E7C7B]" />
                      <p className="mt-2.5 line-clamp-3 text-[14px] leading-[20px] text-[#536B84]">{r.about}</p>
                      <div className="mt-3"><Meta r={r} distance={distById[r.id]} /></div>
                      <div className="mt-auto pt-[18px]">
                        {r.fee && <p className="mb-2 flex items-center gap-2 text-[13px] text-[#5F7896]"><Ticket className="h-4 w-4" strokeWidth={1.75} />Entry fee {r.fee}</p>}
                        <OpenButton r={r} onSeries={setOpenSeries} className="flex h-[38px] w-full items-center justify-center gap-2 rounded-md border border-[#1FA3A6] text-[14px] font-semibold text-[#0E7C7B] transition hover:bg-[#EEF9F8]" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {openSeries && (
        <SeriesDialog
          s={openSeries}
          status={statusById[openSeries.id] ?? 'Upcoming'}
          onClose={() => setOpenSeries(null)}
          onNavigate={(v) => router.push(toPath(v))}
        />
      )}
    </div>
  );
}
