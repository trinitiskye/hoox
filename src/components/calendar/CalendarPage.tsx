'use client';

/* ------------------------------------------------------------------ */
/* /calendar — month calendar of tournaments and series.              */
/* Each day can show two numbered badges:                              */
/*   • Tournaments: tournaments running that day (multi-day events     */
/*     count on every day they run)                                    */
/*   • Series: series with an event (stop) on that day                 */
/* Clicking a badge opens a list of those tournaments or series.       */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Trophy, Layers, X, ArrowRight, MapPin, CalendarDays } from 'lucide-react';
import { INK, fmtRange, type Status } from '@/components/listing/ListingUI';
import { SERIES, SeriesDialog, statusOf, type SeriesItem } from '@/components/pages/SeriesPage';
import { DEMO as DEMO_TOURNAMENTS, fromTournament, type TItem } from '@/components/pages/TournamentsPage';
import { fetchTournaments } from '@/lib/storage';
import FeaturedTournamentHero from '@/components/listing/FeaturedTournamentHero';
import { toPath } from '@/lib/routes';
import { Tournament } from '@/types';

type Kind = 'tournaments' | 'series';

interface Entry {
  key: string;
  kind: Kind;
  title: string;
  subtitle?: string;
  when: string;
  place: string;
  image: string;
  href?: string;
  series?: SeriesItem;
}

const KIND = {
  tournaments: { label: 'Tournaments', one: 'tournament', icon: Trophy, badge: 'bg-[#0E7C7B] text-white hover:bg-[#0B6766]', soft: 'bg-[#E6F4F5] text-[#0E7C7B]' },
  series: { label: 'Series', one: 'series', icon: Layers, badge: 'bg-[#1048A5] text-white hover:bg-[#0C3A86]', soft: 'bg-[#E6F0FB] text-[#1048A5]' },
} as const;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const at = (s: string) => new Date(`${s}T12:00:00`);
const longDay = (s: string) => at(s).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const shortDay = (s: string) => at(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** Every ISO day from start to end (inclusive), capped for bad data */
function daysBetween(start: string, end: string) {
  const out: string[] = [];
  const d = at(start);
  const last = at(end || start);
  for (let i = 0; d <= last && i < 120; i++) {
    out.push(iso(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/* ------------------------------ modal ------------------------------- */

function DayList({
  day, kind, entries, onClose, onSeries,
}: {
  day: string; kind: Kind; entries: Entry[]; onClose: () => void; onSeries: (s: SeriesItem) => void;
}) {
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

  const k = KIND[kind];
  const Icon = k.icon;
  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-list-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-[600px] flex-col overflow-hidden rounded-t-xl bg-white shadow-2xl sm:rounded-xl"
      >
        <div className="flex items-start gap-3 border-b border-[#EDF1F5] px-5 py-4">
          <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${k.soft}`}>
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="day-list-title" className={`font-montserrat text-[20px] font-bold leading-tight ${INK}`}>
              {entries.length} {entries.length === 1 ? k.one : k.label.toLowerCase()}
            </h2>
            <p className="mt-0.5 text-[14px] text-[#5F7896]">{longDay(day)}</p>
          </div>
          <button ref={closeRef} onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full text-[#5F7896] hover:bg-[#F2F7FA]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="divide-y divide-[#EDF1F5] overflow-y-auto">
          {entries.map((e) => {
            const btn = 'flex h-[36px] flex-shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-[#1FA3A6] px-4 text-[14px] font-semibold text-[#0E7C7B] transition hover:bg-[#EEF9F8]';
            return (
              <li key={e.key} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.image} alt="" className="h-[64px] w-[64px] flex-shrink-0 rounded-md object-cover" />
                  <div className="min-w-0">
                    <p className={`font-montserrat text-[16px] font-bold leading-tight ${INK}`}>{e.title}</p>
                    {e.subtitle && <p className="mt-0.5 text-[13px] font-medium text-[#0E7C7B]">{e.subtitle}</p>}
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[#536B84]"><CalendarDays className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />{e.when}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[#536B84]"><MapPin className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />{e.place}</p>
                  </div>
                </div>
                {e.series ? (
                  <button type="button" onClick={() => onSeries(e.series!)} className={btn}>View series <ArrowRight className="h-4 w-4" strokeWidth={2} /></button>
                ) : (
                  <Link href={e.href ?? '/tournaments'} className={btn}>View tournament <ArrowRight className="h-4 w-4" strokeWidth={2} /></Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* -------------------------------- page ------------------------------- */

export default function CalendarPage() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const todayIso = iso(today);
  const [month, setMonth] = useState(() => ({ y: today.getFullYear(), m: today.getMonth() }));
  const [open, setOpen] = useState<{ day: string; kind: Kind } | null>(null);
  const [series, setSeries] = useState<SeriesItem | null>(null);

  const [tournaments, setTournaments] = useState<Tournament[] | null>(null);
  useEffect(() => {
    fetchTournaments().then(setTournaments).catch(() => setTournaments([]));
  }, []);

  // day -> entries, per kind
  const byDay = useMemo(() => {
    const map: Record<string, { tournaments: Entry[]; series: Entry[] }> = {};
    const add = (day: string, e: Entry) => {
      (map[day] ??= { tournaments: [], series: [] })[e.kind].push(e);
    };
    const tItems: TItem[] = tournaments === null ? [] : tournaments.length ? tournaments.map(fromTournament) : DEMO_TOURNAMENTS;
    tItems.forEach((t) => {
      const entry: Entry = {
        key: t.id, kind: 'tournaments', title: t.name, when: fmtRange(t.start, t.end),
        place: [t.venue, [t.city, t.stateCode].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || 'Location to be announced',
        image: t.image, href: t.href,
        subtitle: t.sponsor ? `Presented by ${t.sponsor}` : undefined,
      };
      daysBetween(t.start, t.end).forEach((d) => add(d, entry));
    });
    SERIES.forEach((s) => {
      s.stops.forEach((st, i) => {
        add(st.date, {
          key: `${s.id}-${i}`, kind: 'series', title: s.name,
          subtitle: `Event ${i + 1} of ${s.stops.length}: ${st.name}`,
          when: shortDay(st.date), place: st.place, image: s.image, series: s,
        });
      });
    });
    return map;
  }, [tournaments]);

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

  const monthLabel = new Date(month.y, month.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const shift = (n: number) => setMonth(({ y, m }) => {
    const d = new Date(y, m + n, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  // Distinct tournaments / series this month, for the legend
  const monthTotals = useMemo(() => {
    const t = new Set<string>();
    const s = new Set<string>();
    Object.entries(byDay).forEach(([day, v]) => {
      const d = at(day);
      if (d.getFullYear() !== month.y || d.getMonth() !== month.m) return;
      v.tournaments.forEach((e) => t.add(e.key));
      v.series.forEach((e) => s.add(e.series!.id));
    });
    return { tournaments: t.size, series: s.size };
  }, [byDay, month]);

  const seriesStatus: Status | undefined = series ? statusOf(series, today) : undefined;

  return (
    <div className="font-roboto">
      <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-8 sm:px-6 lg:px-[42px] lg:pt-[34px]">
        <FeaturedTournamentHero tournaments={tournaments} className="mb-8" />

        <h1 className={`font-montserrat text-[34px] font-bold leading-tight sm:text-[46px] ${INK}`}>Tournament Calendar</h1>

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
              {(['tournaments', 'series'] as Kind[]).map((kind) => {
                const k = KIND[kind];
                const Icon = k.icon;
                return (
                  <li key={kind} className="flex items-center gap-2">
                    <span className={`flex h-6 min-w-6 items-center justify-center gap-1 rounded-full px-2 text-[12px] font-bold ${k.badge}`}>
                      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                    </span>
                    {k.label}
                    <span className="text-[#8A9BB0]">({monthTotals[kind]} this month)</span>
                  </li>
                );
              })}
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
            {weeks.map((week, wi) => (
              <div key={wi} role="row" className="grid grid-cols-7 border-t border-[#E3EAF1]">
                {week.map((d) => {
                  const day = iso(d);
                  const inMonth = d.getMonth() === month.m;
                  const isToday = day === todayIso;
                  const v = inMonth ? byDay[day] : undefined;
                  return (
                    <div
                      key={day}
                      role="gridcell"
                      className={`flex min-h-[74px] flex-col gap-1 border-l border-[#E3EAF1] p-1 first:border-l-0 sm:min-h-[104px] sm:p-2 xl:min-h-[118px] ${inMonth ? 'bg-white' : 'bg-[#FAFBFC]'}`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[13px] sm:h-7 sm:w-7 sm:text-[14px] ${
                          isToday ? 'bg-[#0E7C7B] font-bold text-white' : inMonth ? `font-semibold ${INK}` : 'text-[#B3BFCC]'
                        }`}
                        aria-label={isToday ? `Today, ${longDay(day)}` : undefined}
                      >
                        {d.getDate()}
                      </span>
                      {v && (
                        <div className="flex flex-col items-start gap-1">
                          {(['tournaments', 'series'] as Kind[]).map((kind) => {
                            const list = v[kind];
                            if (!list.length) return null;
                            const k = KIND[kind];
                            const Icon = k.icon;
                            return (
                              <button
                                key={kind}
                                type="button"
                                onClick={() => setOpen({ day, kind })}
                                aria-label={`${list.length} ${list.length === 1 ? k.one : k.label.toLowerCase()} on ${longDay(day)}`}
                                className={`flex h-[22px] min-w-[22px] items-center justify-center gap-1 rounded-full px-1.5 text-[12px] font-bold shadow-sm transition sm:h-6 sm:px-2 sm:text-[13px] ${k.badge}`}
                              >
                                <Icon className="hidden h-3.5 w-3.5 sm:block" strokeWidth={2.25} aria-hidden />
                                {list.length}
                                <span className="hidden font-semibold xl:inline">{list.length === 1 ? (kind === 'series' ? 'Series' : 'Tournament') : k.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </div>

      {open && byDay[open.day] && (
        <DayList
          day={open.day}
          kind={open.kind}
          entries={byDay[open.day][open.kind]}
          onClose={() => setOpen(null)}
          onSeries={(s) => { setOpen(null); setSeries(s); }}
        />
      )}
      {series && seriesStatus && (
        <SeriesDialog s={series} status={seriesStatus} onClose={() => setSeries(null)} onNavigate={(v) => router.push(toPath(v))} />
      )}
    </div>
  );
}
