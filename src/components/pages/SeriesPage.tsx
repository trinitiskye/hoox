'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, MapPin, Fish, Trophy, CalendarDays, ChevronDown, ArrowUpDown, ArrowRight, Star, X, Flag, ExternalLink,
} from 'lucide-react';

interface SeriesPageProps {
  onNavigate: (view: string) => void;
}

/* ------------------------------------------------------------------ */
/* /series — "Tournament Series" directory, styled to match /clubs.    */
/* Demo data until series dates, locations and stops are in Supabase.  */
/* ------------------------------------------------------------------ */

type Style = 'Bass' | 'Inshore' | 'Saltwater' | 'Freshwater' | 'Fly Fishing' | 'Kayak' | 'Offshore' | 'Crappie';
type Status = 'In progress' | 'Upcoming' | 'Completed';

interface Stop {
  date: string; // ISO
  name: string;
  place: string;
}

interface SeriesItem {
  id: string;
  name: string;
  sponsor?: string;
  sponsorUrl?: string; // opens in a new tab from "Presented by"
  region: string; // shown on cards
  city: string; // home base / host city
  state: string; // full state name
  country: string;
  states: string[]; // used by the Location filter
  styles: Style[];
  start: string; // ISO
  end: string; // ISO
  image: string;
  about: string;
  stops: Stop[];
  featured?: boolean;
}

const SERIES: SeriesItem[] = [
  {
    id: 'hoox-pro-bass', featured: true, name: 'HOOX Pro Bass Series', sponsor: 'TidalGear', sponsorUrl: 'https://example.com',
    city: 'Guntersville', state: 'Alabama', country: 'United States',
    region: 'Tennessee, Alabama & Georgia', states: ['TN', 'AL', 'GA'], styles: ['Bass'],
    start: '2026-03-14', end: '2026-11-15', image: '/home/summer-slam.jpg',
    about: 'Eight stops across the Southeast’s best bass lakes, with points carrying through to a championship weigh-in on Lake Guntersville.',
    stops: [
      { date: '2026-03-14', name: 'Season Opener', place: 'Chickamauga Lake, TN' },
      { date: '2026-04-18', name: 'Spring Shootout', place: 'Lake Eufaula, AL' },
      { date: '2026-05-16', name: 'Lanier Classic', place: 'Lake Lanier, GA' },
      { date: '2026-06-20', name: 'Summer Slam', place: 'Kentucky Lake, TN' },
      { date: '2026-07-18', name: 'Night Bite', place: 'Lake Martin, AL' },
      { date: '2026-08-22', name: 'Dog Days Open', place: 'West Point Lake, GA' },
      { date: '2026-09-26', name: 'Fall Transition', place: 'Pickwick Lake, AL' },
      { date: '2026-11-13', name: 'Championship', place: 'Lake Guntersville, AL' },
    ],
  },
  {
    id: 'gulf-coast-inshore', name: 'Gulf Coast Inshore Trail', sponsor: 'Coastal Outfitters', sponsorUrl: 'https://example.com',
    city: 'Galveston', state: 'Texas', country: 'United States',
    region: 'Texas, Louisiana & Florida', states: ['TX', 'LA', 'FL'], styles: ['Inshore', 'Saltwater'],
    start: '2026-04-04', end: '2026-10-10', image: '/home/coastal-open.jpg',
    about: 'Redfish and speckled trout from Galveston to the Florida Panhandle. Two-angler teams, total-weight format.',
    stops: [
      { date: '2026-04-04', name: 'Galveston Bay Open', place: 'Galveston, TX' },
      { date: '2026-05-30', name: 'Marsh Madness', place: 'Venice, LA' },
      { date: '2026-07-11', name: 'Panhandle Reds', place: 'Pensacola, FL' },
      { date: '2026-08-29', name: 'Lake Calcasieu Classic', place: 'Lake Charles, LA' },
      { date: '2026-10-10', name: 'Trail Finale', place: 'Port Aransas, TX' },
    ],
  },
  {
    id: 'pine-creek-kayak', name: 'Pine Creek Kayak Series',
    city: 'Mooresville', state: 'North Carolina', country: 'United States',
    region: 'North Carolina', states: ['NC'], styles: ['Kayak', 'Freshwater'],
    start: '2026-08-01', end: '2026-12-05', image: '/home/pine-creek.jpg',
    about: 'Catch-photo-release kayak events on Carolina rivers and reservoirs, judged in the HOOX app.',
    stops: [
      { date: '2026-08-01', name: 'Pine Creek Kickoff', place: 'Lake Norman, NC' },
      { date: '2026-09-12', name: 'River Run', place: 'Neuse River, NC' },
      { date: '2026-10-17', name: 'Fall Paddle Classic', place: 'Jordan Lake, NC' },
      { date: '2026-12-05', name: 'Series Final', place: 'High Rock Lake, NC' },
    ],
  },
  {
    id: 'fall-classic-crappie', name: 'Fall Classic Crappie Circuit', sponsor: 'Lakeside Tackle', sponsorUrl: 'https://example.com',
    city: 'Warsaw', state: 'Missouri', country: 'United States',
    region: 'Missouri, Arkansas & Oklahoma', states: ['MO', 'AR', 'OK'], styles: ['Crappie', 'Freshwater'],
    start: '2026-10-03', end: '2026-12-12', image: '/home/fall-classic.jpg',
    about: 'A short fall circuit for crappie teams, with seven-fish limits and a big-fish side pot at every stop.',
    stops: [
      { date: '2026-10-03', name: 'Truman Lake Opener', place: 'Warsaw, MO' },
      { date: '2026-11-07', name: 'Greers Ferry Shootout', place: 'Heber Springs, AR' },
      { date: '2026-12-12', name: 'Grand Lake Final', place: 'Grove, OK' },
    ],
  },
  {
    id: 'bayou-bass-classic', name: 'Bayou Bass Classic Series',
    city: 'Morgan City', state: 'Louisiana', country: 'United States',
    region: 'Louisiana', states: ['LA'], styles: ['Bass'],
    start: '2026-11-07', end: '2027-02-20', image: '/home/bayou-bash.jpg',
    about: 'Winter bass fishing in the Atchafalaya Basin and Louisiana’s big reservoirs. Open to solo anglers and teams.',
    stops: [
      { date: '2026-11-07', name: 'Bayou Bash', place: 'Atchafalaya Basin, LA' },
      { date: '2026-12-12', name: 'Toledo Bend Open', place: 'Many, LA' },
      { date: '2027-01-16', name: 'Caney Creek Classic', place: 'Chatham, LA' },
      { date: '2027-02-20', name: 'Bayou Championship', place: 'Lake D’Arbonne, LA' },
    ],
  },
  {
    id: 'mountain-lakes-trout', name: 'Mountain Lakes Trout Series',
    city: 'Bozeman', state: 'Montana', country: 'United States',
    region: 'Montana & Idaho', states: ['MT', 'ID'], styles: ['Fly Fishing', 'Freshwater'],
    start: '2026-05-16', end: '2026-09-26', image: '/home/mountain-lake.jpg',
    about: 'High-country lake and river events for fly anglers, scored by total length of measured trout.',
    stops: [
      { date: '2026-05-16', name: 'Spring Hatch', place: 'Hebgen Lake, MT' },
      { date: '2026-06-27', name: 'Henry’s Fork Challenge', place: 'Island Park, ID' },
      { date: '2026-08-08', name: 'Big Sky Open', place: 'Bozeman, MT' },
      { date: '2026-09-26', name: 'Season Final', place: 'Coeur d’Alene, ID' },
    ],
  },
  {
    id: 'pacific-offshore', name: 'Pacific Offshore Challenge', sponsor: 'Bluewater Marine', sponsorUrl: 'https://example.com',
    city: 'San Diego', state: 'California', country: 'United States',
    region: 'California', states: ['CA'], styles: ['Offshore', 'Saltwater'],
    start: '2027-03-20', end: '2027-09-11', image: '/clubs/demo/deep-sea-explorers.jpg',
    about: 'Tuna, yellowtail and dorado off the Southern California coast, with live leaderboards for every stop.',
    stops: [
      { date: '2027-03-20', name: 'Yellowtail Opener', place: 'San Diego, CA' },
      { date: '2027-05-15', name: 'Catalina Classic', place: 'Avalon, CA' },
      { date: '2027-07-17', name: 'Tuna Shootout', place: 'Dana Point, CA' },
      { date: '2027-09-11', name: 'Challenge Final', place: 'Oxnard, CA' },
    ],
  },
];

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AR: 'Arkansas', CA: 'California', FL: 'Florida', GA: 'Georgia', ID: 'Idaho', LA: 'Louisiana',
  MO: 'Missouri', MT: 'Montana', NC: 'North Carolina', OK: 'Oklahoma', TN: 'Tennessee', TX: 'Texas',
};
const STYLES: Style[] = ['Bass', 'Crappie', 'Freshwater', 'Fly Fishing', 'Inshore', 'Kayak', 'Offshore', 'Saltwater'];
const STATUSES: Status[] = ['In progress', 'Upcoming', 'Completed'];
type Sort = 'season' | 'start' | 'name' | 'events';
const SORTS: Record<Sort, string> = { season: 'Current Season', start: 'Start Date', name: 'Name (A–Z)', events: 'Most Events' };

const INK = 'text-[#0D1B4C]';
const CONTROL =
  'h-[50px] w-full appearance-none rounded-md border border-[#D9E3EC] bg-white text-[15px] text-[#1F2D3D] shadow-[0_1px_3px_rgba(10,30,60,0.04)] focus:border-hoox-ui focus:outline-none focus:ring-2 focus:ring-hoox-ui/40';

/* ------------------------------ helpers ------------------------------ */

const day = (iso: string) => new Date(`${iso}T12:00:00`);

function statusOf(s: SeriesItem, today: Date): Status {
  if (today < day(s.start)) return 'Upcoming';
  if (today > day(s.end)) return 'Completed';
  return 'In progress';
}

function fmtRange(a: string, b: string) {
  const x = day(a);
  const y = day(b);
  const md = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return x.getFullYear() === y.getFullYear()
    ? `${md(x)} – ${md(y)}, ${y.getFullYear()}`
    : `${md(x)}, ${x.getFullYear()} – ${md(y)}, ${y.getFullYear()}`;
}

const fmtDay = (iso: string) => day(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const STATUS_CHIP: Record<Status, string> = {
  'In progress': 'bg-[#E3F6EC] text-[#11764A]',
  Upcoming: 'bg-[#E6F0FB] text-[#1048A5]',
  Completed: 'bg-[#EEF1F5] text-[#5F7896]',
};

function StatusChip({ status, className = '' }: { status: Status; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[12px] font-semibold ${STATUS_CHIP[status]} ${className}`}>
      {status === 'In progress' && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {status}
    </span>
  );
}

function FilterSelect<T extends string>({
  label, icon, value, onChange, options,
}: {
  label: string;
  icon: React.ReactNode;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#0D1B4C]">{icon}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className={`${CONTROL} pl-12 pr-10 font-medium`}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0D1B4C]" strokeWidth={2.25} />
    </label>
  );
}

/** "Presented by Sponsor ↗" — links out in a new tab when the sponsor has a URL */
function PresentedBy({ s, className }: { s: SeriesItem; className: string }) {
  if (!s.sponsor) return null;
  const text = <>Presented by {s.sponsor}</>;
  return s.sponsorUrl ? (
    <a
      href={s.sponsorUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`inline-flex items-center gap-1.5 hover:underline ${className}`}
    >
      {text}
      <ExternalLink className="h-[0.95em] w-[0.95em] flex-shrink-0" strokeWidth={2} aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  ) : (
    <p className={className}>{text}</p>
  );
}

const place = (s: SeriesItem) => `${s.city}, ${s.state}, ${s.country}`;

/* ------------------------------ details ----------------------------- */

function SeriesDialog({ s, status, onClose, onNavigate }: { s: SeriesItem; status: Status; onClose: () => void; onNavigate: (v: string) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const today = new Date();
  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="series-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-[680px] overflow-y-auto rounded-t-xl bg-white shadow-2xl sm:rounded-xl"
      >
        <div className="relative aspect-[3/1] w-full overflow-hidden bg-[#E9F2F7]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.image} alt="" className="h-full w-full object-cover" />
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 pb-6 pt-5">
          <StatusChip status={status} />
          <h2 id="series-dialog-title" className={`mt-2 font-montserrat text-[24px] font-bold leading-tight ${INK}`}>{s.name}</h2>
          <PresentedBy s={s} className="mt-1 text-[15px] font-medium text-[#0E7C7B]" />
          <p className="mt-4 text-[15px] leading-[22px] text-[#3E5675]">{s.about}</p>
          <dl className="mt-5 grid grid-cols-2 gap-4 rounded-md bg-[#F2F7FA] p-4 text-[14px]">
            <div><dt className="text-[#5F7896]">Season</dt><dd className={`font-semibold ${INK}`}>{fmtRange(s.start, s.end)}</dd></div>
            <div><dt className="text-[#5F7896]">Events</dt><dd className={`font-semibold ${INK}`}>{s.stops.length}</dd></div>
            <div><dt className="text-[#5F7896]">Location</dt><dd className={`font-semibold ${INK}`}>{s.region}<span className="block font-normal text-[#536B84]">{place(s)}</span></dd></div>
            <div><dt className="text-[#5F7896]">Fishing style</dt><dd className={`font-semibold ${INK}`}>{s.styles.join(', ')}</dd></div>
          </dl>

          <h3 className={`mt-6 font-montserrat text-[17px] font-bold ${INK}`}>Schedule</h3>
          <ol className="mt-2 divide-y divide-[#EDF1F5] rounded-md border border-[#E3EAF1]">
            {s.stops.map((st, i) => {
              const done = day(st.date) < today;
              return (
                <li key={st.date + st.name} className="flex items-center gap-4 px-4 py-3 text-[14px]">
                  <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${done ? 'bg-[#EEF1F5] text-[#7A8BA3]' : 'bg-[#E6F4F5] text-[#0E7C7B]'}`}>{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate font-semibold ${INK}`}>{st.name}</span>
                    <span className="block truncate text-[13px] text-[#5F7896]">{st.place}</span>
                  </span>
                  <span className="whitespace-nowrap text-[13px] text-[#536B84]">{fmtDay(st.date)}</span>
                </li>
              );
            })}
          </ol>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => onNavigate('register-angler')}
              className="flex h-[46px] flex-1 items-center justify-center gap-3 rounded-md bg-[#0E7C7B] text-[16px] font-semibold text-white transition hover:bg-[#0B6766]"
            >
              Join HOOX to compete <ArrowRight className="h-5 w-5" strokeWidth={2} />
            </button>
            <button onClick={onClose} className="h-[46px] rounded-md border border-[#D9E3EC] px-6 text-[15px] font-medium text-[#1F2D3D] hover:bg-[#F2F7FA]">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- page ------------------------------- */

const STATUS_ORDER: Record<Status, number> = { 'In progress': 0, Upcoming: 1, Completed: 2 };

export default function SeriesPage({ onNavigate }: SeriesPageProps) {
  const [q, setQ] = useState('');
  const [state, setState] = useState('all');
  const [style, setStyle] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState<Sort>('season');
  const [open, setOpen] = useState<SeriesItem | null>(null);

  const today = useMemo(() => new Date(), []);
  const statusById = useMemo(() => Object.fromEntries(SERIES.map((s) => [s.id, statusOf(s, today)])) as Record<string, Status>, [today]);
  const states = useMemo(
    () => Array.from(new Set(SERIES.flatMap((s) => s.states))).sort((a, b) => (STATE_NAMES[a] ?? a).localeCompare(STATE_NAMES[b] ?? b)),
    [],
  );

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = SERIES.filter((s) => {
      if (state !== 'all' && !s.states.includes(state)) return false;
      if (style !== 'all' && !s.styles.includes(style as Style)) return false;
      if (status !== 'all' && statusById[s.id] !== status) return false;
      if (!term) return true;
      return [s.name, s.sponsor ?? '', s.region, s.about, ...s.styles, s.city, s.state, s.country, ...s.states.map((x) => STATE_NAMES[x] ?? x), ...s.stops.flatMap((st) => [st.name, st.place])]
        .some((v) => v.toLowerCase().includes(term));
    });
    return list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'events') return b.stops.length - a.stops.length;
      if (sort === 'start') return a.start.localeCompare(b.start);
      return STATUS_ORDER[statusById[a.id]] - STATUS_ORDER[statusById[b.id]] || a.start.localeCompare(b.start);
    });
  }, [q, state, style, status, sort, statusById]);

  const filtering = q.trim() !== '' || state !== 'all' || style !== 'all' || status !== 'all';
  const featured = !filtering ? results.find((s) => s.featured) : undefined;
  const grid = featured ? results.filter((s) => s.id !== featured.id) : results;
  const reset = () => { setQ(''); setState('all'); setStyle('all'); setStatus('all'); };

  return (
    <div className="font-roboto">
      <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-8 sm:px-6 lg:px-[42px] lg:pt-[34px]">
        <header>
          <h1 className={`font-montserrat text-[34px] font-bold leading-tight sm:text-[46px] ${INK}`}>Tournament Series</h1>
          <p className="mt-2 max-w-[600px] text-[17px] leading-[24px] text-[#68819B] sm:text-[19px] sm:leading-[27px]">
            Follow a full season of competition. Find a series near you, see every stop, and chase the points title.
          </p>
        </header>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 min-[1440px]:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)_auto_250px] min-[1440px]:items-center min-[1440px]:gap-[16px]" role="search" aria-label="Find series">
          <label className="relative block sm:col-span-2 lg:col-span-3 min-[1440px]:col-span-1">
            <span className="sr-only">Search series</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5F7896]" strokeWidth={2} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search series, lakes, sponsors..."
              className={`${CONTROL} pl-12 pr-4 placeholder:text-[#7D8BA0]`}
            />
          </label>
          <FilterSelect
            label="Location"
            icon={<MapPin className="h-5 w-5" strokeWidth={2} />}
            value={state}
            onChange={setState}
            options={[{ value: 'all', label: 'All Locations' }, ...states.map((s) => ({ value: s, label: STATE_NAMES[s] ?? s }))]}
          />
          <FilterSelect
            label="Fishing style"
            icon={<Fish className="h-[18px] w-[18px]" strokeWidth={2} />}
            value={style}
            onChange={setStyle}
            options={[{ value: 'all', label: 'All Fishing Styles' }, ...STYLES.map((s) => ({ value: s, label: s }))]}
          />
          <FilterSelect
            label="Status"
            icon={<Flag className="h-[18px] w-[18px]" strokeWidth={2} />}
            value={status}
            onChange={setStatus}
            options={[{ value: 'all', label: 'All Seasons' }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
          />
          <p className="flex items-center whitespace-nowrap text-[14px] text-[#7D8BA0] sm:col-span-1 lg:col-span-2 lg:justify-end min-[1440px]:col-span-1" aria-live="polite">
            {results.length} series found
          </p>
          <label className="relative block">
            <span className="sr-only">Sort series</span>
            <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-2 text-[14px] text-[#5F7896]">
              <ArrowUpDown className="h-4 w-4 text-[#0D1B4C]" strokeWidth={2} /> Sort by
            </span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`${CONTROL} pl-[100px] pr-9 text-[14px] font-semibold ${INK}`}>
              {(Object.keys(SORTS) as Sort[]).map((k) => <option key={k} value={k}>{SORTS[k]}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0D1B4C]" strokeWidth={2.25} />
          </label>
        </div>

        {/* Featured series */}
        {featured && (
          <section aria-labelledby="featured-series" className="relative mt-8 overflow-hidden rounded-lg bg-[#0A2A47] shadow-[0_6px_20px_rgba(5,30,60,0.18)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featured.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-35 md:left-auto md:right-0 md:w-[56%] md:opacity-100 md:[-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_35%)] md:[mask-image:linear-gradient(90deg,transparent_0%,#000_35%)]"
            />
            <div className="relative z-10 flex flex-col gap-6 px-6 py-7 sm:px-10 md:min-h-[292px] md:flex-row md:items-end md:justify-between">
              <div className="max-w-[640px]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E4F63] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.02em] text-[#3FD6D0]">
                  <Star className="h-3.5 w-3.5" fill="currentColor" strokeWidth={1.5} /> Featured Series
                </span>
                <h2 id="featured-series" className="mt-4 font-montserrat text-[26px] font-bold leading-tight text-white sm:text-[32px]">{featured.name}</h2>
                <PresentedBy s={featured} className="mt-1 text-[16px] font-medium text-[#3FD6D0]" />
                <p className="mt-4 max-w-[560px] text-[16px] leading-[26px] text-white/90">{featured.about}</p>
                <p className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2 text-[16px] text-white">
                  <span className="flex items-center gap-2.5"><CalendarDays className="h-5 w-5" strokeWidth={1.75} />{fmtRange(featured.start, featured.end)}</span>
                  <span className="flex items-center gap-2.5"><Trophy className="h-5 w-5" strokeWidth={1.75} />{featured.stops.length} events</span>
                  <span className="flex items-center gap-2.5"><MapPin className="h-5 w-5" strokeWidth={1.75} />{featured.city}, {featured.state}, {featured.country}</span>
                </p>
              </div>
              <button
                onClick={() => setOpen(featured)}
                className="flex h-[48px] w-fit flex-shrink-0 items-center gap-4 rounded-md bg-[#22B3B5] px-7 text-[17px] font-semibold text-white shadow-[0_4px_12px_rgba(34,179,181,0.35)] transition hover:bg-[#1C9C9E]"
              >
                View series <ArrowRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </section>
        )}

        {/* Series cards */}
        {grid.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-[#C9D8E5] bg-white px-6 py-14 text-center">
            <p className={`text-[17px] font-semibold ${INK}`}>No series match your filters.</p>
            <button onClick={reset} className="mt-3 text-[15px] font-semibold text-[#0E7C7B] hover:underline">Clear filters</button>
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-[26px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {grid.map((s) => (
              <li key={s.id} className="flex flex-col overflow-hidden rounded-lg border border-[#E8EEF4] bg-white p-[7px] shadow-[0_2px_10px_rgba(10,30,60,0.06)]">
                <div className="relative aspect-[2.2/1] overflow-hidden rounded-md bg-[#E9F2F7]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                  <StatusChip status={statusById[s.id]} className="absolute left-2.5 top-2.5 shadow-sm" />
                </div>
                <div className="flex flex-1 flex-col px-[12px] pb-[12px] pt-[14px]">
                  <h3 className={`font-montserrat text-[19px] font-bold leading-tight ${INK}`}>{s.name}</h3>
                  <PresentedBy s={s} className="mt-1 w-fit text-[14px] font-medium text-[#0E7C7B]" />
                  <p className="mt-2.5 line-clamp-3 text-[14px] leading-[20px] text-[#536B84]">{s.about}</p>
                  <ul className="mt-3 space-y-[6px] text-[14.5px]">
                    <li className={`flex items-center gap-3 font-medium ${INK}`}><CalendarDays className="h-[17px] w-[17px] flex-shrink-0 text-[#0D1B4C]" strokeWidth={2} />{fmtRange(s.start, s.end)}</li>
                    <li className="flex items-start gap-3 text-[#5F7896]">
                      <MapPin className="mt-[2px] h-[17px] w-[17px] flex-shrink-0 text-[#0D1B4C]" fill="currentColor" stroke="white" strokeWidth={1.5} />
                      <span>{s.region}<span className="block">{place(s)}</span></span>
                    </li>
                    <li className="flex items-center gap-3 text-[#5F7896]"><Fish className="h-[17px] w-[17px] flex-shrink-0 text-[#0D1B4C]" strokeWidth={2} />{s.styles.join(' • ')}</li>
                    <li className="flex items-center gap-3 text-[#5F7896]"><Trophy className="h-[17px] w-[17px] flex-shrink-0 text-[#0D1B4C]" strokeWidth={2} />{s.stops.length} events</li>
                  </ul>
                  <div className="mt-auto pt-[18px]">
                    <button
                      onClick={() => setOpen(s)}
                      aria-label={`View series ${s.name}`}
                      className="flex h-[38px] w-full items-center justify-center gap-2 rounded-md border border-[#1FA3A6] text-[14px] font-semibold text-[#0E7C7B] transition hover:bg-[#EEF9F8]"
                    >
                      View series <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    </button>
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
              Create a free HOOX account to register for series events, submit catches and track your standings all season.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              onClick={() => onNavigate('register')}
              className="flex h-[46px] items-center justify-center gap-3 rounded-md bg-[#22B3B5] px-7 text-[16px] font-semibold text-white shadow-[0_4px_12px_rgba(34,179,181,0.35)] transition hover:bg-[#1C9C9E]"
            >
              Get Hoox! <ArrowRight className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="h-[46px] rounded-md border border-white/70 px-7 text-[16px] font-medium text-white transition hover:bg-white/10"
            >
              Sign In
            </button>
          </div>
        </section>
      </div>

      {open && <SeriesDialog s={open} status={statusById[open.id]} onClose={() => setOpen(null)} onNavigate={onNavigate} />}
    </div>
  );
}
