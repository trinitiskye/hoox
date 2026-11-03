'use client';

/* ------------------------------------------------------------------ */
/* /events — Fishing Expos & Trade Shows                              */
/* Featured expo hero, filters, and a card grid. Each expo opens its  */
/* detail page at /events/<id>.                                       */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star, CalendarDays, MapPin, ArrowRight, Search, Ticket, Store, Tag, ArrowUpDown, ChevronDown } from 'lucide-react';
import {
  STATE_NAMES, INK, CONTROL, StatusChip, FilterSelect, LocationSelect, statusFor, fmtRange,
} from '@/components/listing/ListingUI';
import { EXPOS, admissionFrom, type Expo, type ExpoType } from '@/lib/demoExpos';

interface EventsPageProps {
  onNavigate?: (view: string) => void;
}

const TYPES: ExpoType[] = ['Expo', 'Boat Show', 'Trade Show', 'Festival'];
type Sort = 'soon' | 'name';
const href = (e: Expo) => `/events/${e.id}`;

function FeaturedSlide({ e, active, index, total }: { e: Expo; active: boolean; index: number; total: number }) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}: ${e.name}`}
      aria-hidden={!active}
      className={`relative col-start-1 row-start-1 transition-opacity duration-700 motion-reduce:transition-none ${active ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={e.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-35 md:left-auto md:right-0 md:w-[56%] md:opacity-100 md:[-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_35%)] md:[mask-image:linear-gradient(90deg,transparent_0%,#000_35%)]"
      />
      <div className="relative z-10 flex h-full flex-col gap-6 px-6 pb-10 pt-16 sm:px-10 sm:pt-7 md:min-h-[292px] md:flex-row md:items-end md:justify-between">
        <div className="max-w-[640px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E4F63] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.02em] text-[#3FD6D0]">
            <Star className="h-3.5 w-3.5" fill="currentColor" strokeWidth={1.5} /> Featured {e.type}
          </span>
          <h2 className="mt-4 font-montserrat text-[26px] font-bold leading-tight text-white sm:text-[32px]">{e.name}</h2>
          <p className="mt-1 text-[16px] font-medium text-[#3FD6D0]">Hosted by {e.organizer}</p>
          <p className="mt-4 max-w-[560px] text-[16px] leading-[26px] text-white/90">{e.about}</p>
          <p className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2 text-[16px] text-white">
            <span className="flex items-center gap-2.5"><CalendarDays className="h-5 w-5" strokeWidth={1.75} />{fmtRange(e.start, e.end)}</span>
            <span className="flex items-center gap-2.5"><MapPin className="h-5 w-5" strokeWidth={1.75} />{e.venue} · {e.city}, {e.state}</span>
            <span className="flex items-center gap-2.5"><Ticket className="h-5 w-5" strokeWidth={1.75} />{admissionFrom(e)}</span>
          </p>
        </div>
        <Link
          href={href(e)}
          tabIndex={active ? 0 : -1}
          className="flex h-[48px] w-fit flex-shrink-0 items-center gap-4 rounded-md bg-[#22B3B5] px-7 text-[17px] font-semibold text-white shadow-[0_4px_12px_rgba(34,179,181,0.35)] transition hover:bg-[#1C9C9E]"
        >
          View event details <ArrowRight className="h-5 w-5" strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}

const ROTATE_MS = 7000;

/** Rotates through every expo marked `featured`. Pauses on hover/focus and for reduced motion.
 *  Also used as the hero on the Event Calendar (/events/calendar). */
export function FeaturedCarousel({ expos, className = 'mt-6' }: { expos: Expo[]; className?: string }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);
  const n = expos.length;
  const go = useCallback((k: number) => setI(((k % n) + n) % n), [n]);

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);
  useEffect(() => {
    if (n < 2 || paused || reduced.current) return;
    const t = setTimeout(() => go(i + 1), ROTATE_MS);
    return () => clearTimeout(t);
  }, [i, n, paused, go]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured events"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`relative grid overflow-hidden rounded-lg bg-[#0A2A47] shadow-[0_6px_20px_rgba(5,30,60,0.18)] ${className}`}
    >
      {expos.map((e, k) => (
        <FeaturedSlide key={e.id} e={e} active={k === i} index={k} total={n} />
      ))}

      {n > 1 && (
        <>
          <div className="absolute right-4 top-4 z-20 flex gap-2 sm:right-6 sm:top-6">
            <button
              onClick={() => go(i - 1)}
              aria-label="Previous featured event"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A2A47]/60 text-white ring-1 ring-white/40 backdrop-blur transition hover:bg-[#0A2A47]/85"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              onClick={() => go(i + 1)}
              aria-label="Next featured event"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A2A47]/60 text-white ring-1 ring-white/40 backdrop-blur transition hover:bg-[#0A2A47]/85"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {expos.map((e, k) => (
              <button
                key={e.id}
                onClick={() => go(k)}
                aria-label={`Show ${e.name}`}
                aria-current={k === i ? 'true' : undefined}
                className={`h-2 rounded-full transition-all ${k === i ? 'w-6 bg-[#22B3B5]' : 'w-2 bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/** Upcoming/in-progress expos marked featured (soonest first); falls back to the next show. */
export function featuredExpos(items: Expo[]) {
  const f = items.filter((e) => e.featured).sort((a, b) => a.start.localeCompare(b.start));
  return f.length ? f : [...items].sort((a, b) => a.start.localeCompare(b.start)).slice(0, 1);
}

export default function EventsPage(_props: EventsPageProps) {
  const [q, setQ] = useState('');
  const [state, setState] = useState('all');
  const [type, setType] = useState<'all' | ExpoType>('all');
  const [sort, setSort] = useState<Sort>('soon');
  const today = useMemo(() => new Date(), []);

  // Past shows drop off the page
  const items = useMemo(() => EXPOS.filter((e) => statusFor(e.start, e.end, today) !== 'Completed'), [today]);
  const featured = useMemo(() => featuredExpos(items), [items]);

  const matchingOtherFilters = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter(
      (e) =>
        (type === 'all' || e.type === type) &&
        (!s || [e.name, e.venue, e.city, e.organizer, STATE_NAMES[e.state] ?? ''].some((v) => v.toLowerCase().includes(s))),
    );
  }, [items, q, type]);

  const states = useMemo(
    () => [...new Set(items.map((e) => e.state))].sort((a, b) => (STATE_NAMES[a] ?? a).localeCompare(STATE_NAMES[b] ?? b)),
    [items],
  );
  const locationOptions = useMemo(
    () => [
      { value: 'all', label: 'All Locations', count: matchingOtherFilters.length },
      ...states.map((code) => ({ value: code, label: STATE_NAMES[code] ?? code, count: matchingOtherFilters.filter((e) => e.state === code).length })),
    ],
    [matchingOtherFilters, states],
  );

  const results = useMemo(
    () =>
      matchingOtherFilters
        .filter((e) => state === 'all' || e.state === state)
        .sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : a.start.localeCompare(b.start))),
    [matchingOtherFilters, state, sort],
  );

  const filtering = q.trim() !== '' || state !== 'all' || type !== 'all';
  const grid = !filtering ? results.filter((e) => !featured.some((f) => f.id === e.id)) : results;
  const reset = () => { setQ(''); setState('all'); setType('all'); };

  return (
    <div className="font-roboto">
      <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-8 sm:px-6 lg:px-[42px] lg:pt-[34px]">
        <header>
          <h1 className={`font-montserrat text-[34px] font-bold leading-tight sm:text-[46px] ${INK}`}>Fishing Expos &amp; Trade Shows</h1>
          <p className="mt-2 max-w-[640px] text-[17px] leading-[24px] text-[#68819B] sm:text-[19px] sm:leading-[27px]">
            Discover the latest gear, boats, techniques and innovations at fishing shows near you.
          </p>
        </header>

        {featured.length > 0 && <FeaturedCarousel expos={featured} />}

        {/* Filters */}
        <div
          className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto_220px] lg:items-center lg:gap-4"
          role="search"
          aria-label="Find expos and trade shows"
        >
          <label className="relative block sm:col-span-2 lg:col-span-1">
            <span className="sr-only">Search expos and trade shows</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5F7896]" strokeWidth={2} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search shows, venues, cities..."
              className={`${CONTROL} pl-12 pr-4 placeholder:text-[#7D8BA0]`}
            />
          </label>
          <LocationSelect value={state} onChange={setState} options={locationOptions} />
          <FilterSelect
            label="Event type"
            icon={<Tag className="h-[18px] w-[18px]" strokeWidth={2} />}
            value={type}
            onChange={setType}
            options={[{ value: 'all' as const, label: 'All Event Types' }, ...TYPES.map((t) => ({ value: t, label: t }))]}
          />
          <p className="flex items-center whitespace-nowrap text-[14px] text-[#7D8BA0] lg:justify-end" aria-live="polite">
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </p>
          <label className="relative block">
            <span className="sr-only">Sort events</span>
            <ArrowUpDown className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0D1B4C]" strokeWidth={2} />
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`${CONTROL} pl-11 pr-9 text-[14px] font-semibold ${INK}`}>
              <option value="soon">Happening Soon</option>
              <option value="name">Name A–Z</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0D1B4C]" strokeWidth={2.25} />
          </label>
        </div>

        {/* Results */}
        {grid.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-lg border border-dashed border-[#C9D8E5] bg-white px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F4F5] text-[#0E7C7B]">
              <Store className="h-7 w-7" strokeWidth={1.75} aria-hidden />
            </span>
            <h2 className={`mt-4 font-montserrat text-[22px] font-bold ${INK}`}>No shows found</h2>
            <p className="mt-2 max-w-[460px] text-[15px] leading-[22px] text-[#536B84]">
              {state !== 'all'
                ? `There are no upcoming shows in ${STATE_NAMES[state] ?? state}${q.trim() || type !== 'all' ? ' that match your filters' : ''} yet. Try a nearby state or check back soon.`
                : 'No shows match your search. Try different filters or check back soon.'}
            </p>
            <button onClick={reset} className="mt-6 h-[42px] rounded-md bg-[#0E7C7B] px-6 text-[15px] font-semibold text-white transition hover:bg-[#0B6766]">
              View all shows
            </button>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-[26px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {grid.map((e) => (
              <li key={e.id} className="flex flex-col overflow-hidden rounded-lg border border-[#E8EEF4] bg-white p-[7px] shadow-[0_2px_10px_rgba(10,30,60,0.06)]">
                <Link href={href(e)} tabIndex={-1} aria-hidden className="relative block aspect-[2.2/1] overflow-hidden rounded-md bg-[#E9F2F7]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]" />
                  <StatusChip status={statusFor(e.start, e.end, today)} className="absolute left-2.5 top-2.5 shadow-sm" />
                </Link>
                <div className="flex flex-1 flex-col px-[12px] pb-[12px] pt-[14px]">
                  <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#0E7C7B]">{e.type}</p>
                  <h3 className={`mt-1 font-montserrat text-[19px] font-bold leading-tight ${INK}`}>{e.name}</h3>
                  <p className="mt-2.5 line-clamp-3 text-[14px] leading-[20px] text-[#536B84]">{e.about}</p>
                  <ul className="mt-3 space-y-1.5 text-[14px] text-[#2E3F5C]">
                    <li className="flex items-start gap-2">
                      <CalendarDays className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#5F7896]" strokeWidth={1.75} />
                      {fmtRange(e.start, e.end)}
                    </li>
                    <li className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#5F7896]" strokeWidth={1.75} />
                      <span>{e.venue}<span className="block text-[#5F7896]">{e.city}, {e.state}</span></span>
                    </li>
                  </ul>
                  <div className="mt-auto pt-[18px]">
                    <p className="mb-2 flex items-center gap-2 text-[13px] text-[#5F7896]">
                      <Ticket className="h-4 w-4" strokeWidth={1.75} />Admission {admissionFrom(e).toLowerCase()}
                    </p>
                    <Link
                      href={href(e)}
                      aria-label={`View event details for ${e.name}`}
                      className="flex h-[38px] w-full items-center justify-center gap-2 rounded-md border border-[#1FA3A6] text-[14px] font-semibold text-[#0E7C7B] transition hover:bg-[#EEF9F8]"
                    >
                      View event details <ArrowRight className="h-4 w-4" strokeWidth={2} />
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
            <h2 className="font-montserrat text-[24px] font-bold leading-tight text-white sm:text-[28px]">Hosting a fishing show?</h2>
            <p className="mt-2 max-w-[560px] text-[16px] leading-[24px] text-white/85">
              List your expo, boat show or festival on HOOX and reach anglers and tournament directors near you.
            </p>
          </div>
          <Link
            href="/events/submit"
            className="flex h-[46px] items-center justify-center gap-3 rounded-md bg-[#22B3B5] px-7 text-[16px] font-semibold text-white shadow-[0_4px_12px_rgba(34,179,181,0.35)] transition hover:bg-[#1C9C9E]"
          >
            Submit your event <ArrowRight className="h-5 w-5" strokeWidth={2} />
          </Link>
        </section>
      </div>
    </div>
  );
}
