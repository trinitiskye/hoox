'use client';

/* ------------------------------------------------------------------ */
/* /events/calendar — month calendar of expos, trade shows and         */
/* festivals. Unlike the tournament calendar's numbered badges, each   */
/* event is drawn as a named bar across every day it runs (one cell    */
/* for single-day events), wrapping onto the next week when needed.    */
/* A featured-event hero sits on top, and the month's events are       */
/* listed below the grid for easy reading on phones.                   */
/* ------------------------------------------------------------------ */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, CalendarDays, MapPin, ArrowRight, Ticket } from 'lucide-react';
import { INK, fmtRange, statusFor, StatusChip } from '@/components/listing/ListingUI';
import { EXPOS, admissionFrom, type Expo, type ExpoType } from '@/lib/demoExpos';
import { FeaturedCarousel, featuredExpos } from '@/components/pages/EventsPage';
import { useFeaturedPlacements } from '@/lib/useFeaturedPlacements';

const TYPE_STYLE: Record<ExpoType, { bar: string; dot: string; chip: string }> = {
  Expo: { bar: 'bg-[#0E7C7B] hover:bg-[#0B6766] text-white', dot: 'bg-[#0E7C7B]', chip: 'bg-[#E6F4F5] text-[#0B6564]' },
  'Boat Show': { bar: 'bg-[#1048A5] hover:bg-[#0C3A86] text-white', dot: 'bg-[#1048A5]', chip: 'bg-[#E6F0FB] text-[#1048A5]' },
  'Trade Show': { bar: 'bg-[#6B3FA0] hover:bg-[#59338A] text-white', dot: 'bg-[#6B3FA0]', chip: 'bg-[#F1EAFA] text-[#59338A]' },
  Festival: { bar: 'bg-[#C2571A] hover:bg-[#A64912] text-white', dot: 'bg-[#C2571A]', chip: 'bg-[#FCEEE4] text-[#A64912]' },
};
const TYPES = Object.keys(TYPE_STYLE) as ExpoType[];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const at = (s: string) => new Date(`${s}T12:00:00`);
const longDay = (s: string) => at(s).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const monthKey = (y: number, m: number) => `${y}-${pad(m + 1)}`;
const href = (e: Expo) => `/events/${e.id}`;

/** One event's piece within a single week row */
interface Segment {
  e: Expo;
  col: number;        // 0–6
  span: number;       // days in this week
  lane: number;       // stacked row within the week
  fromPrev: boolean;  // continues from the previous week
  toNext: boolean;    // continues into the next week
}

/** Lay out a week's events as bars, stacking overlapping events into lanes. */
function layoutWeek(week: Date[], events: Expo[]): { segments: Segment[]; lanes: number } {
  const first = iso(week[0]);
  const last = iso(week[6]);
  const inWeek = events
    .filter((e) => e.start <= last && (e.end || e.start) >= first)
    .sort((a, b) => a.start.localeCompare(b.start) || (b.end || b.start).localeCompare(a.end || a.start));
  const laneEnds: number[] = []; // last column used in each lane
  const segments: Segment[] = inWeek.map((e) => {
    const s = e.start < first ? first : e.start;
    const end = (e.end || e.start) > last ? last : e.end || e.start;
    const col = week.findIndex((d) => iso(d) === s);
    const endCol = week.findIndex((d) => iso(d) === end);
    let lane = laneEnds.findIndex((c) => c < col);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(endCol); } else laneEnds[lane] = endCol;
    return { e, col, span: endCol - col + 1, lane, fromPrev: e.start < first, toNext: (e.end || e.start) > last };
  });
  return { segments, lanes: laneEnds.length };
}

export default function EventCalendarPage() {
  const today = useMemo(() => new Date(), []);
  const todayIso = iso(today);
  const events = EXPOS;

  // Start on this month if it has events, otherwise jump to the next month that does
  const [month, setMonth] = useState(() => {
    const now = { y: today.getFullYear(), m: today.getMonth() };
    const key = monthKey(now.y, now.m);
    const hasNow = events.some((e) => e.start.slice(0, 7) <= key && (e.end || e.start).slice(0, 7) >= key);
    if (hasNow) return now;
    const next = [...events].filter((e) => (e.end || e.start) >= iso(today)).sort((a, b) => a.start.localeCompare(b.start))[0];
    return next ? { y: at(next.start).getFullYear(), m: at(next.start).getMonth() } : now;
  });

  const upcoming = useMemo(() => events.filter((e) => statusFor(e.start, e.end, today) !== 'Completed'), [events, today]);
  const placements = useFeaturedPlacements('event');
  const featured = useMemo(() => featuredExpos(upcoming, placements.hero), [upcoming, placements]);

  // Month grid (Sunday-first, padded with neighbouring days)
  const weeks = useMemo(() => {
    const first = new Date(month.y, month.m, 1, 12);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    const lastOfMonth = new Date(month.y, month.m + 1, 0, 12);
    const end = new Date(lastOfMonth);
    end.setDate(lastOfMonth.getDate() + (6 - lastOfMonth.getDay()));
    const days: Date[] = [];
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(new Date(d));
    const out: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
    return out;
  }, [month]);

  const layouts = useMemo(() => weeks.map((w) => layoutWeek(w, events)), [weeks, events]);

  const key = monthKey(month.y, month.m);
  const monthEvents = useMemo(
    () => events
      .filter((e) => e.start.slice(0, 7) <= key && (e.end || e.start).slice(0, 7) >= key)
      .sort((a, b) => a.start.localeCompare(b.start)),
    [events, key],
  );
  const nextAfter = useMemo(() => {
    const lastDay = iso(new Date(month.y, month.m + 1, 0, 12));
    return [...events].filter((e) => e.start > lastDay).sort((a, b) => a.start.localeCompare(b.start))[0];
  }, [events, month]);

  const monthLabel = new Date(month.y, month.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const shift = (n: number) => setMonth(({ y, m }) => {
    const d = new Date(y, m + n, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const goTo = (s: string) => setMonth({ y: at(s).getFullYear(), m: at(s).getMonth() });

  const typeCounts = TYPES.map((t) => ({ t, n: monthEvents.filter((e) => e.type === t).length }));

  return (
    <div className="font-roboto">
      <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-8 sm:px-6 lg:px-[42px] lg:pt-[34px]">
        {featured.length > 0 && <FeaturedCarousel expos={featured} className="mb-8" />}

        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className={`font-montserrat text-[34px] font-bold leading-tight sm:text-[46px] ${INK}`}>Event Calendar</h1>
          <Link href="/events" className="flex items-center gap-1.5 text-[15px] font-semibold text-[#0E7C7B] hover:underline">
            Browse all expos & trade shows <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>

        <section aria-label={`${monthLabel} calendar`} className="mt-6 rounded-lg border border-[#E8EEF4] bg-white p-3 shadow-[0_2px_10px_rgba(10,30,60,0.06)] sm:p-5">
          {/* Month bar */}
          <div className="flex flex-col gap-4 pb-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="flex h-10 w-10 items-center justify-center rounded-md border border-[#D9E3EC] text-[#0D1B4C] hover:bg-[#F2F7FA]">
                <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
              </button>
              <button type="button" onClick={() => shift(1)} aria-label="Next month" className="flex h-10 w-10 items-center justify-center rounded-md border border-[#D9E3EC] text-[#0D1B4C] hover:bg-[#F2F7FA]">
                <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
              </button>
              <h2 className={`ml-1 whitespace-nowrap font-montserrat text-[19px] font-bold sm:ml-2 sm:text-[26px] ${INK}`} aria-live="polite">{monthLabel}</h2>
              <button
                type="button"
                onClick={() => setMonth({ y: today.getFullYear(), m: today.getMonth() })}
                className="ml-auto h-10 rounded-md border border-[#D9E3EC] px-4 text-[14px] font-semibold text-[#0D1B4C] hover:bg-[#F2F7FA] md:ml-3"
              >
                Today
              </button>
            </div>
            {/* Legend */}
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-[#536B84]">
              {typeCounts.map(({ t, n }) => (
                <li key={t} className="flex items-center gap-2">
                  <span className={`h-3 w-5 rounded-sm ${TYPE_STYLE[t].dot}`} aria-hidden />
                  {t === 'Expo' ? 'Expos' : t === 'Festival' ? 'Festivals' : `${t}s`}
                  {n > 0 && <span className="text-[#8A9BB0]">({n})</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Grid */}
          <div role="grid" aria-label={monthLabel} className="overflow-hidden rounded-md border border-[#E3EAF1]">
            <div role="row" className="grid grid-cols-7 bg-[#F5F8FA]">
              {WEEKDAYS.map((w) => (
                <span key={w} role="columnheader" className="py-2 text-center text-[12px] font-semibold uppercase tracking-[0.04em] text-[#5F7896] sm:text-[13px]">
                  <span className="sm:hidden">{w[0]}</span><span className="hidden sm:inline">{w}</span>
                </span>
              ))}
            </div>
            {weeks.map((week, wi) => {
              const { segments, lanes } = layouts[wi];
              // Room for the day number plus one 24px bar (+4px gap) per lane
              const need = { '--need': `${40 + lanes * 28 + 6}px` } as React.CSSProperties;
              return (
                <div key={wi} role="row" className="relative grid grid-cols-7 border-t border-[#E3EAF1]">
                  {week.map((d) => {
                    const day = iso(d);
                    const inMonth = d.getMonth() === month.m;
                    const isToday = day === todayIso;
                    return (
                      <div
                        key={day}
                        role="gridcell"
                        aria-label={longDay(day)}
                        style={need}
                        className={`min-h-[max(74px,var(--need))] border-l border-[#E3EAF1] p-1 first:border-l-0 sm:min-h-[max(110px,var(--need))] sm:p-2 ${inMonth ? 'bg-white' : 'bg-[#FAFBFC]'}`}
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-[13px] sm:h-7 sm:w-7 sm:text-[14px] ${
                            isToday ? 'bg-[#0E7C7B] font-bold text-white' : inMonth ? `font-semibold ${INK}` : 'text-[#B3BFCC]'
                          }`}
                        >
                          {d.getDate()}
                        </span>
                      </div>
                    );
                  })}

                  {/* Event bars, laid over the week */}
                  {segments.length > 0 && (
                    <div
                      className="pointer-events-none absolute inset-x-0 top-[32px] grid grid-cols-7 gap-y-1 sm:top-[40px]"
                      style={{ gridAutoRows: '24px' }}
                    >
                      {segments.map((s) => {
                        const st = TYPE_STYLE[s.e.type];
                        const range = fmtRange(s.e.start, s.e.end);
                        return (
                          <Link
                            key={s.e.id}
                            href={href(s.e)}
                            title={`${s.e.name} · ${range} · ${s.e.city}, ${s.e.state}`}
                            aria-label={`${s.e.name}, ${s.e.type}, ${range}, ${s.e.city}, ${s.e.state}`}
                            style={{ gridColumn: `${s.col + 1} / span ${s.span}`, gridRow: s.lane + 1 }}
                            className={`pointer-events-auto flex min-w-0 items-center overflow-hidden px-1.5 text-[11px] font-semibold leading-none shadow-sm transition sm:px-2 sm:text-[12.5px] ${st.bar}
                              ${s.fromPrev ? 'ml-0 rounded-l-none' : 'ml-0.5 rounded-l-[5px] sm:ml-1'}
                              ${s.toNext ? 'mr-0 rounded-r-none' : 'mr-0.5 rounded-r-[5px] sm:mr-1'}`}
                          >
                            {s.fromPrev && <span aria-hidden className="mr-1 opacity-80">‹</span>}
                            {placements.badge.has(s.e.id) && <span aria-label="Featured" className="mr-1">★</span>}
                            <span className="truncate">{s.e.name}</span>
                            {s.toNext && <span aria-hidden className="ml-auto pl-1 opacity-80">›</span>}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* This month's events */}
        <section aria-labelledby="month-events-heading" className="mt-8">
          <h2 id="month-events-heading" className={`font-montserrat text-[22px] font-bold sm:text-[26px] ${INK}`}>
            {monthEvents.length ? `Events in ${monthLabel}` : `No events in ${monthLabel}`}
          </h2>
          {monthEvents.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-[#C9D8E5] bg-white px-6 py-10 text-center">
              <p className="text-[16px] text-[#536B84]">Nothing scheduled this month yet.</p>
              {nextAfter && (
                <button type="button" onClick={() => goTo(nextAfter.start)} className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#0E7C7B] hover:underline">
                  Next up: {nextAfter.name} ({fmtRange(nextAfter.start, nextAfter.end)}) <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
              )}
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-[#EDF1F5] overflow-hidden rounded-lg border border-[#E8EEF4] bg-white shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
              {monthEvents.map((e) => {
                const st = TYPE_STYLE[e.type];
                return (
                  <li key={e.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={e.image} alt="" loading="lazy" className="h-[64px] w-[88px] flex-shrink-0 rounded-md object-cover" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${st.chip}`}>{e.type}</span>
                          <StatusChip status={statusFor(e.start, e.end, today)} />
                        </div>
                        <p className={`mt-1.5 font-montserrat text-[17px] font-bold leading-tight ${INK}`}>{e.name}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-[#536B84]">
                          <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 flex-shrink-0" strokeWidth={2} />{fmtRange(e.start, e.end)}</span>
                          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 flex-shrink-0" strokeWidth={2} />{e.venue} · {e.city}, {e.state}</span>
                          <span className="flex items-center gap-1.5"><Ticket className="h-4 w-4 flex-shrink-0" strokeWidth={2} />{admissionFrom(e)}</span>
                        </p>
                      </div>
                    </div>
                    <Link href={href(e)} className="flex h-[38px] flex-shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-[#1FA3A6] px-4 text-[14px] font-semibold text-[#0E7C7B] transition hover:bg-[#EEF9F8]">
                      View event <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
