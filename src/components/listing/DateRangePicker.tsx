'use client';

/* ------------------------------------------------------------------ */
/* Date or date-range picker for the search filters.                   */
/* Click one day for a single date, or a second day to make a range.   */
/* Values are ISO dates ("2026-11-07"); empty strings mean "any".      */
/* ------------------------------------------------------------------ */

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { CONTROL, INK } from '@/components/listing/ListingUI';

const pad = (n: number) => String(n).padStart(2, '0');
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (s: string) => new Date(`${s}T12:00:00`);
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);
const sameDay = (a: Date, b: Date) => toISO(a) === toISO(b);
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const short = (iso: string, withYear: boolean) =>
  fromISO(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) });

export function dateLabel(from: string, to: string) {
  if (!from) return 'Any dates';
  if (!to || to === from) return short(from, true);
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  return `${short(from, !sameYear)} – ${short(to, true)}`;
}

function presets(today: Date): { label: string; from: string; to: string }[] {
  const dow = today.getDay();
  const sat = addDays(today, (6 - dow + 7) % 7);
  const weekendStart = dow === 0 ? today : sat; // Sunday counts as "this weekend"
  const weekendEnd = dow === 0 ? today : addDays(sat, 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 12);
  return [
    { label: 'This weekend', from: toISO(weekendStart), to: toISO(weekendEnd) },
    { label: 'Next 7 days', from: toISO(today), to: toISO(addDays(today, 6)) },
    { label: 'Next 30 days', from: toISO(today), to: toISO(addDays(today, 29)) },
    { label: 'This month', from: toISO(today), to: toISO(monthEnd) },
  ];
}

function Month({
  year, month, start, end, hover, onPick, onHover, today,
}: {
  year: number; month: number; start: Date | null; end: Date | null; hover: Date | null;
  onPick: (d: Date) => void; onHover: (d: Date | null) => void; today: Date;
}) {
  const first = new Date(year, month, 1, 12);
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: days }, (_, i) => new Date(year, month, i + 1, 12))];
  const rangeEnd = end ?? (start && hover && hover > start ? hover : null);
  return (
    <div className="w-[252px]">
      <p className={`mb-2 text-center text-[15px] font-semibold ${INK}`}>{first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      <div className="grid grid-cols-7 text-center text-[12px] font-semibold text-[#7A8BA3]">
        {WEEKDAYS.map((w) => <span key={w} className="py-1">{w}</span>)}
      </div>
      <div className="grid grid-cols-7" onMouseLeave={() => onHover(null)}>
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const isStart = !!start && sameDay(d, start);
          const isEnd = !!rangeEnd && sameDay(d, rangeEnd);
          const inRange = !!start && !!rangeEnd && d > start && d < rangeEnd;
          const isToday = sameDay(d, today);
          return (
            <button
              key={toISO(d)}
              type="button"
              onClick={() => onPick(d)}
              onMouseEnter={() => onHover(d)}
              aria-label={d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              aria-pressed={isStart || isEnd}
              className={`relative h-9 text-[14px] transition ${
                isStart || isEnd
                  ? 'z-10 rounded-md bg-[#0E7C7B] font-semibold text-white'
                  : inRange
                    ? 'bg-[#E6F4F5] text-[#0E5A5A]'
                    : 'rounded-md text-[#1F2D3D] hover:bg-[#EEF6F9]'
              } ${isToday && !isStart && !isEnd ? 'font-bold text-[#0E7C7B] underline underline-offset-4' : ''}`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DateRangePicker({
  from, to, onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [hover, setHover] = useState<Date | null>(null);
  const today = new Date();
  const [view, setView] = useState(() => ({ y: today.getFullYear(), m: today.getMonth() }));
  const wrapRef = useRef<HTMLDivElement>(null);

  // Load the current selection when opening
  useEffect(() => {
    if (!open) return;
    const s = from ? fromISO(from) : null;
    setStart(s);
    setEnd(to && to !== from ? fromISO(to) : null);
    const anchor = s ?? new Date();
    setView({ y: anchor.getFullYear(), m: anchor.getMonth() });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (d: Date) => {
    if (!start || end) { setStart(d); setEnd(null); return; }
    if (d < start) { setStart(d); return; }
    if (sameDay(d, start)) { setEnd(null); return; }
    setEnd(d);
  };

  const apply = () => {
    if (!start) onChange('', '');
    else onChange(toISO(start), toISO(end ?? start));
    setOpen(false);
  };

  const shift = (n: number) => setView(({ y, m }) => {
    const d = new Date(y, m + n, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const next = new Date(view.y, view.m + 1, 1);
  const hasValue = !!from;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${CONTROL} flex items-center pl-12 pr-10 text-left font-medium`}
      >
        <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#0D1B4C]" strokeWidth={2} />
        <span className="truncate"><span className="sr-only">Dates: </span>{dateLabel(from, to)}</span>
        <ChevronDown className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0D1B4C] transition ${open ? 'rotate-180' : ''}`} strokeWidth={2.25} />
      </button>
      {hasValue && !open && (
        <button
          type="button"
          onClick={() => onChange('', '')}
          aria-label="Clear dates"
          className="absolute right-9 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#5F7896] hover:bg-[#EEF2F6]"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Choose a date or date range"
          className="absolute left-0 right-0 z-40 mt-1.5 rounded-lg border border-[#D9E3EC] bg-white p-4 shadow-[0_12px_28px_rgba(10,30,60,0.16)] sm:left-auto sm:w-auto"
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Quick picks */}
            <div className="flex flex-wrap gap-2 sm:w-[130px] sm:flex-col sm:flex-nowrap sm:border-r sm:border-[#EDF1F5] sm:pr-4">
              {presets(today).map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => { onChange(p.from, p.to); setOpen(false); }}
                  className="rounded-md bg-[#F2F7FA] px-3 py-1.5 text-left text-[13px] font-medium text-[#1F334E] hover:bg-[#E6F4F5] sm:bg-transparent sm:px-2"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div>
              <div className="relative flex gap-6">
                <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-md text-[#0D1B4C] hover:bg-[#EEF6F9]">
                  <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
                </button>
                <button type="button" onClick={() => shift(1)} aria-label="Next month" className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-md text-[#0D1B4C] hover:bg-[#EEF6F9]">
                  <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
                </button>
                <Month year={view.y} month={view.m} start={start} end={end} hover={hover} onPick={pick} onHover={setHover} today={today} />
                <div className="hidden md:block">
                  <Month year={next.getFullYear()} month={next.getMonth()} start={start} end={end} hover={hover} onPick={pick} onHover={setHover} today={today} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#EDF1F5] pt-3">
                <p className="text-[13px] text-[#5F7896]" aria-live="polite">
                  {!start ? 'Pick a date, or two dates for a range' : end ? dateLabel(toISO(start), toISO(end)) : `${dateLabel(toISO(start), '')} · pick an end date or apply`}
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setStart(null); setEnd(null); }} className="h-[34px] rounded-md px-3 text-[14px] font-medium text-[#5F7896] hover:bg-[#F2F7FA]">
                    Clear
                  </button>
                  <button type="button" onClick={apply} className="h-[34px] rounded-md bg-[#0E7C7B] px-4 text-[14px] font-semibold text-white hover:bg-[#0B6766]">
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
