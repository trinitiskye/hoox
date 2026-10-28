'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, MapPin, Fish, Users, User, ChevronDown, ArrowUpDown, ArrowRight, Star, X, LayoutGrid, Map as MapIcon,
} from 'lucide-react';
import ClubsMap from '@/components/clubs/ClubsMap';

interface ClubsPageProps {
  onNavigate: (view: string) => void;
}

/* ------------------------------------------------------------------ */
/* /clubs — "Fishing Clubs" directory (Clubs mock).                    */
/* Demo data until clubs are stored in Supabase.                       */
/* ------------------------------------------------------------------ */

type Level = 'Beginner friendly' | 'All skill levels' | 'Intermediate+';
type Style = 'Saltwater' | 'Freshwater' | 'Fly Fishing' | 'Bass' | 'Offshore' | 'Kayak' | 'Inshore';

export interface Club {
  id: string;
  name: string;
  city: string;
  state: string;
  species: string[]; // not displayed; still matched by search
  styles: Style[]; // used by the Fishing Style filter
  members: number;
  schedule: string;
  level: Level;
  image: string;
  about: string;
  featured?: boolean;
  logo?: string;
  lat: number;
  lng: number;
}

const IMG = '/clubs/demo/';

export const CLUBS: Club[] = [
  {
    id: 'coastal-wave-anglers', lat: 45.8918, lng: -123.9615, name: 'Coastal Wave Anglers', city: 'Oregon Coast', state: 'OR', featured: true,
    species: ['Saltwater', 'Salmon', 'Halibut', 'Rockfish'], styles: ['Saltwater', 'Inshore'], members: 842,
    schedule: 'Weekly outings', level: 'All skill levels', image: `${IMG}featured.jpg`, logo: `${IMG}featured-logo.jpg`,
    about: 'A welcoming club for saltwater anglers who love the Pacific Northwest. From salmon to halibut, we fish together and share the adventure.',
  },
  {
    id: 'bluewater-brotherhood', lat: 32.7157, lng: -117.1611, name: 'Bluewater Brotherhood', city: 'San Diego', state: 'CA',
    species: ['Tuna', 'Marlin', 'Offshore'], styles: ['Saltwater', 'Offshore'], members: 612,
    schedule: 'Monthly trips', level: 'Beginner friendly', image: `${IMG}bluewater-brotherhood.jpg`,
    about: 'Offshore trips out of San Diego chasing tuna and marlin, with experienced captains happy to show newcomers the ropes.',
  },
  {
    id: 'high-country-fly-fishers', lat: 45.677, lng: -111.0429, name: 'High Country Fly Fishers', city: 'Bozeman', state: 'MT', featured: true,
    species: ['Trout', 'Grayling', 'Fly Fishing'], styles: ['Freshwater', 'Fly Fishing'], members: 431,
    schedule: 'Weekly outings', level: 'All skill levels', image: `${IMG}high-country-fly-fishers.jpg`,
    about: 'Fly fishing Montana’s rivers and alpine lakes, with casting clinics, fly-tying nights and weekly outings.',
  },
  {
    id: 'lakeview-bass-club', lat: 30.2672, lng: -97.7431, name: 'Lakeview Bass Club', city: 'Austin', state: 'TX', featured: true,
    species: ['Largemouth Bass', 'Sunfish'], styles: ['Freshwater', 'Bass'], members: 298,
    schedule: 'Bi-weekly', level: 'All skill levels', image: `${IMG}lakeview-bass-club.jpg`,
    about: 'Central Texas bass anglers fishing local lakes every other weekend, with club tournaments throughout the season.',
  },
  {
    id: 'riverbend-anglers', lat: 35.5951, lng: -82.5515, name: 'Riverbend Anglers', city: 'Asheville', state: 'NC',
    species: ['Trout', 'Smallmouth', 'Fly Fishing'], styles: ['Freshwater', 'Fly Fishing'], members: 367,
    schedule: 'Monthly trips', level: 'Intermediate+', image: `${IMG}riverbend-anglers.jpg`,
    about: 'Wading the rivers of the Blue Ridge for trout and smallmouth, with monthly trips for anglers ready to step up their game.',
  },
  {
    id: 'sunsetbend-fishing-club', lat: 26.142, lng: -81.7948, name: 'SunsetBend Fishing Club', city: 'Naples', state: 'FL',
    species: ['Tarpon', 'Snook', 'Inshore'], styles: ['Saltwater', 'Inshore'], members: 523,
    schedule: 'Weekly outings', level: 'All skill levels', image: `${IMG}sunsetbend-fishing-club.jpg`,
    about: 'Inshore fishing along Florida’s Gulf Coast for tarpon and snook, from the beach, the pier and the backcountry.',
  },
  {
    id: 'kayak-anglers-collective', lat: 47.6062, lng: -122.3321, name: 'Kayak Anglers Collective', city: 'Seattle', state: 'WA', featured: true,
    species: ['Salmon', 'Halibut', 'Kayak'], styles: ['Saltwater', 'Kayak'], members: 276,
    schedule: 'Monthly trips', level: 'Beginner friendly', image: `${IMG}kayak-anglers-collective.jpg`,
    about: 'Paddle-powered fishing on Puget Sound and nearby lakes, with safety sessions and gear swaps for new kayak anglers.',
  },
  {
    id: 'deep-sea-explorers', lat: 26.1224, lng: -80.1373, name: 'Deep Sea Explorers', city: 'Fort Lauderdale', state: 'FL',
    species: ['Tuna', 'Mahi Mahi', 'Wahoo'], styles: ['Saltwater', 'Offshore'], members: 689,
    schedule: 'Bi-weekly', level: 'Intermediate+', image: `${IMG}deep-sea-explorers.jpg`,
    about: 'Blue-water trips off South Florida for mahi, wahoo and tuna, running twice a month during the season.',
  },
  {
    id: 'mountain-brook-anglers', lat: 44.0582, lng: -121.3153, name: 'Mountain Brook Anglers', city: 'Bend', state: 'OR',
    species: ['Trout', 'Steelhead', 'Fly Fishing'], styles: ['Freshwater', 'Fly Fishing'], members: 412,
    schedule: 'Monthly trips', level: 'All skill levels', image: `${IMG}mountain-brook-anglers.jpg`,
    about: 'Central Oregon’s rivers for trout and steelhead, with a mentoring program that pairs new members with veterans.',
  },
];

const STATE_NAMES: Record<string, string> = {
  CA: 'California', FL: 'Florida', MT: 'Montana', NC: 'North Carolina', OR: 'Oregon', TX: 'Texas', WA: 'Washington',
};
const STYLES: Style[] = ['Saltwater', 'Freshwater', 'Fly Fishing', 'Bass', 'Offshore', 'Inshore', 'Kayak'];
const LEVELS: Level[] = ['Beginner friendly', 'All skill levels', 'Intermediate+'];
type Sort = 'members' | 'fewest' | 'name';
const SORTS: Record<Sort, string> = { members: 'Most Members', fewest: 'Fewest Members', name: 'Name (A–Z)' };

const INK = 'text-[#0D1B4C]';
const CONTROL =
  'h-[50px] w-full appearance-none rounded-md border border-[#D9E3EC] bg-white text-[15px] text-[#1F2D3D] shadow-[0_1px_3px_rgba(10,30,60,0.04)] focus:border-hoox-ui focus:outline-none focus:ring-2 focus:ring-hoox-ui/40';

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

function FishGlyph({ className = '' }: { className?: string }) {
  return <Fish className={`h-[18px] w-[18px] flex-shrink-0 ${className}`} strokeWidth={2} />;
}

/* ------------------------------ card ------------------------------- */

/** Club card — used in the Clubs directory and the home page's Featured Clubs row */
export function ClubCard({ c, onOpen, showFeatured = false }: { c: Club; onOpen: () => void; showFeatured?: boolean }) {
  return (
    <li className="flex flex-col overflow-hidden rounded-lg border border-[#E8EEF4] bg-white p-[7px] shadow-[0_2px_10px_rgba(10,30,60,0.06)]">
      <div className="relative aspect-[2.85/1] overflow-hidden rounded-md bg-[#E9F2F7]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover" />
        {showFeatured && (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#0A2A47]/90 px-2.5 py-[4px] text-[11.5px] font-bold uppercase tracking-[0.03em] text-[#3FD6D0] shadow-sm">
            <Star className="h-3 w-3" fill="currentColor" strokeWidth={1.5} /> Featured
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-[12px] pb-[12px] pt-[14px]">
        <h3 className={`font-montserrat text-[19px] font-bold leading-tight ${INK}`}>{c.name}</h3>
        <ul className="mt-2 space-y-[6px] text-[14.5px]">
          <li className="flex items-center gap-3 text-[#5F7896]"><MapPin className="h-[17px] w-[17px] flex-shrink-0 text-[#0D1B4C]" fill="currentColor" stroke="white" strokeWidth={1.5} />{c.city}, {c.state}</li>
          <li className={`flex items-center gap-3 font-medium ${INK}`}><FishGlyph className="text-[#0D1B4C]" />{c.styles.join(' • ')}</li>
          <li className="flex items-center gap-3 text-[#5F7896]"><User className="h-[17px] w-[17px] flex-shrink-0 text-[#0D1B4C]" fill="currentColor" strokeWidth={1.5} />{c.members.toLocaleString()} members</li>
        </ul>
        <div className="mt-auto pt-[18px]">
          <button
            onClick={onOpen}
            aria-label={`View details for ${c.name}`}
            className="flex h-[38px] w-full items-center justify-center gap-2 rounded-md border border-[#1FA3A6] text-[14px] font-semibold text-[#0E7C7B] transition hover:bg-[#EEF9F8]"
          >
            View details <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </li>
  );
}

/* ------------------------------ details ----------------------------- */

export function ClubDialog({ club, onClose, onNavigate }: { club: Club; onClose: () => void; onNavigate: (v: string) => void }) {
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

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="club-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-[640px] overflow-y-auto rounded-t-xl bg-white shadow-2xl sm:rounded-xl"
      >
        <div className="relative aspect-[3/1] w-full overflow-hidden bg-[#E9F2F7]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={club.image} alt="" className="h-full w-full object-cover" />
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
          <h2 id="club-dialog-title" className={`font-montserrat text-[24px] font-bold ${INK}`}>{club.name}</h2>
          <p className="mt-1 flex items-center gap-2 text-[15px] text-[#5F7896]"><MapPin className="h-4 w-4" strokeWidth={2} />{club.city}, {STATE_NAMES[club.state] ?? club.state}</p>
          <p className="mt-4 text-[15px] leading-[22px] text-[#3E5675]">{club.about}</p>
          <dl className="mt-5 grid grid-cols-2 gap-4 rounded-md bg-[#F2F7FA] p-4 text-[14px] sm:grid-cols-3">
            <div><dt className="text-[#5F7896]">Members</dt><dd className={`font-semibold ${INK}`}>{club.members.toLocaleString()}</dd></div>
            <div><dt className="text-[#5F7896]">Skill level</dt><dd className={`font-semibold ${INK}`}>{club.level}</dd></div>
            <div><dt className="text-[#5F7896]">Fishing style</dt><dd className={`font-semibold ${INK}`}>{club.styles.join(', ')}</dd></div>
          </dl>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => onNavigate('register-angler')}
              className="flex h-[46px] flex-1 items-center justify-center gap-3 rounded-md bg-[#0E7C7B] text-[16px] font-semibold text-white transition hover:bg-[#0B6766]"
            >
              Join HOOX to connect <ArrowRight className="h-5 w-5" strokeWidth={2} />
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

export default function ClubsPage({ onNavigate }: ClubsPageProps) {
  const [q, setQ] = useState('');
  const [state, setState] = useState('all');
  const [style, setStyle] = useState('all');
  const [level, setLevel] = useState('all');
  const [sort, setSort] = useState<Sort>('members');
  const [open, setOpen] = useState<Club | null>(null);
  const [view, setView] = useState<'grid' | 'map'>('grid');

  // Deep link from the menu: /clubs?view=map opens the map
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('view') === 'map') setView('map');
  }, []);

  const states = useMemo(() => Array.from(new Set(CLUBS.map((c) => c.state))).sort((a, b) => (STATE_NAMES[a] ?? a).localeCompare(STATE_NAMES[b] ?? b)), []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = CLUBS.filter((c) => {
      if (state !== 'all' && c.state !== state) return false;
      if (style !== 'all' && !c.styles.includes(style as Style)) return false;
      if (level !== 'all' && c.level !== level) return false;
      if (!term) return true;
      return [c.name, c.city, c.state, STATE_NAMES[c.state] ?? '', ...c.species, ...c.styles, c.about].some((s) => s.toLowerCase().includes(term));
    });
    return list.sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'fewest' ? a.members - b.members : b.members - a.members));
  }, [q, state, style, level, sort]);

  const filtering = q.trim() !== '' || state !== 'all' || style !== 'all' || level !== 'all';
  const featured = !filtering ? results.find((c) => c.featured) : undefined;
  const grid = featured ? results.filter((c) => c.id !== featured.id) : results;
  const reset = () => { setQ(''); setState('all'); setStyle('all'); setLevel('all'); };

  return (
    <div className="font-roboto">
      <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-8 sm:px-6 lg:px-[42px] lg:pt-[34px]">
        <header>
          <h1 className={`font-montserrat text-[34px] font-bold leading-tight sm:text-[46px] ${INK}`}>Fishing Clubs</h1>
          <p className="mt-2 max-w-[560px] text-[17px] leading-[24px] text-[#68819B] sm:text-[19px] sm:leading-[27px]">
            Discover every fishing club in the system. Find your people, explore new waters, and get involved.
          </p>
        </header>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 min-[1440px]:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_auto_250px] min-[1440px]:items-center min-[1440px]:gap-[16px]" role="search" aria-label="Find clubs">
          <label className="relative block sm:col-span-2 lg:col-span-3 min-[1440px]:col-span-1">
            <span className="sr-only">Search clubs</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5F7896]" strokeWidth={2} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search clubs by name, location, or keyword..."
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
            icon={<FishGlyph />}
            value={style}
            onChange={setStyle}
            options={[{ value: 'all', label: 'All Fishing Styles' }, ...STYLES.map((s) => ({ value: s, label: s }))]}
          />
          <FilterSelect
            label="Membership"
            icon={<Users className="h-5 w-5" fill="currentColor" strokeWidth={1.5} />}
            value={level}
            onChange={setLevel}
            options={[{ value: 'all', label: 'All Memberships' }, ...LEVELS.map((s) => ({ value: s, label: s }))]}
          />
          <p className="flex items-center whitespace-nowrap text-[14px] text-[#7D8BA0] sm:col-span-1 lg:col-span-2 lg:justify-end min-[1440px]:col-span-1" aria-live="polite">
            {results.length} {results.length === 1 ? 'club' : 'clubs'} found
          </p>
          <label className="relative block">
            <span className="sr-only">Sort clubs</span>
            <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-2 text-[14px] text-[#5F7896]">
              <ArrowUpDown className="h-4 w-4 text-[#0D1B4C]" strokeWidth={2} /> Sort by
            </span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`${CONTROL} pl-[100px] pr-9 text-[14px] font-semibold ${INK}`}>
              {(Object.keys(SORTS) as Sort[]).map((k) => <option key={k} value={k}>{SORTS[k]}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0D1B4C]" strokeWidth={2.25} />
          </label>
        </div>

        {/* Featured club */}
        {featured && (
          <section aria-labelledby="featured-club" className="relative mt-8 overflow-hidden rounded-lg bg-[#0A2A47] shadow-[0_6px_20px_rgba(5,30,60,0.18)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featured.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-35 md:left-auto md:right-0 md:w-[56%] md:opacity-100 md:[-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_35%)] md:[mask-image:linear-gradient(90deg,transparent_0%,#000_35%)]"
            />
            <div className="relative z-10 flex flex-col gap-6 px-6 py-7 sm:px-10 md:min-h-[292px] md:flex-row md:items-end md:justify-between">
              <div className="max-w-[640px]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E4F63] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.02em] text-[#3FD6D0]">
                  <Star className="h-3.5 w-3.5" fill="currentColor" strokeWidth={1.5} /> Featured Club
                </span>
                <div className="mt-4 flex items-start gap-5">
                  {featured.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featured.logo} alt="" className="hidden h-[90px] w-[90px] flex-shrink-0 rounded-full sm:block" />
                  )}
                  <div>
                    <h2 id="featured-club" className="font-montserrat text-[26px] font-bold leading-tight text-white sm:text-[32px]">{featured.name}</h2>
                    <p className="mt-1.5 flex items-center gap-2 text-[16px] text-white/95"><MapPin className="h-[18px] w-[18px]" fill="currentColor" stroke="#0A2A47" strokeWidth={1.5} />{featured.city}, {featured.state}</p>
                    <p className="mt-4 max-w-[560px] text-[16px] leading-[26px] text-white/90">{featured.about}</p>
                  </div>
                </div>
                <p className="mt-5 flex flex-wrap items-center gap-x-10 gap-y-2 text-[16px] text-white">
                  <span className="flex items-center gap-2.5"><Users className="h-5 w-5" fill="currentColor" strokeWidth={1.5} />{featured.members.toLocaleString()} members</span>
                  <span className="flex items-center gap-2.5"><FishGlyph className="h-5 w-5" />{featured.styles.join('  •  ')}</span>
                </p>
              </div>
              <button
                onClick={() => setOpen(featured)}
                className="flex h-[48px] w-fit flex-shrink-0 items-center gap-4 rounded-md bg-[#22B3B5] px-7 text-[17px] font-semibold text-white shadow-[0_4px_12px_rgba(34,179,181,0.35)] transition hover:bg-[#1C9C9E]"
              >
                View club <ArrowRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </section>
        )}

        {/* Grid / Map toggle — under the featured club, right-aligned */}
        <div className="mt-6 flex justify-end">
          <div role="group" aria-label="Choose view" className="inline-flex rounded-md border border-[#D9E3EC] bg-white p-1 shadow-[0_1px_3px_rgba(10,30,60,0.04)]">
            {([
              { key: 'grid', label: 'Grid view', icon: <LayoutGrid className="h-4 w-4" strokeWidth={2} /> },
              { key: 'map', label: 'Map view', icon: <MapIcon className="h-4 w-4" strokeWidth={2} /> },
            ] as const).map((b) => {
              const active = view === b.key;
              return (
                <button
                  key={b.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setView(b.key)}
                  className={`flex h-[36px] items-center gap-2 rounded px-4 text-[14px] font-semibold transition ${
                    active ? 'bg-[#0E7C7B] text-white shadow-sm' : 'text-[#0D1B4C] hover:bg-[#EEF9F8]'
                  }`}
                >
                  {b.icon}
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Club cards (grid) or club map */}
        {view === 'map' ? (
          <div className="mt-4">
            <ClubsMap
              clubs={results.map((c) => ({ id: c.id, name: c.name, place: `${c.city}, ${c.state}`, members: c.members, lat: c.lat, lng: c.lng }))}
              onSelect={(id) => setOpen(CLUBS.find((c) => c.id === id) ?? null)}
            />
          </div>
        ) : grid.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-[#C9D8E5] bg-white px-6 py-14 text-center">
            <p className={`text-[17px] font-semibold ${INK}`}>No clubs match your filters.</p>
            <button onClick={reset} className="mt-3 text-[15px] font-semibold text-[#0E7C7B] hover:underline">Clear filters</button>
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-[26px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {grid.map((c) => (
              <ClubCard key={c.id} c={c} onOpen={() => setOpen(c)} showFeatured={!!c.featured} />
            ))}
          </ul>
        )}
      </div>

      {open && <ClubDialog club={open} onClose={() => setOpen(null)} onNavigate={onNavigate} />}
    </div>
  );
}
