'use client';

/* ------------------------------------------------------------------ */
/* Shared UI for the public directory pages (Series, Tournaments):     */
/* filter controls, Location menu with counts, status badges, and the  */
/* Grid / List / Map switch.                                           */
/* ------------------------------------------------------------------ */

import { useEffect, useRef, useState } from 'react';
import { MapPin, ChevronDown, LayoutGrid, List as ListIcon, Map as MapIcon } from 'lucide-react';

export type Status = 'In progress' | 'Upcoming' | 'Completed';
export type ListingView = 'grid' | 'list' | 'map';

/** All 50 U.S. states, for the Location filter */
export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan',
  MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
  WI: 'Wisconsin', WY: 'Wyoming',
};

export const INK = 'text-[#0D1B4C]';
export const CONTROL =
  'h-[50px] w-full appearance-none rounded-md border border-[#D9E3EC] bg-white text-[15px] text-[#1F2D3D] shadow-[0_1px_3px_rgba(10,30,60,0.04)] focus:border-hoox-ui focus:outline-none focus:ring-2 focus:ring-hoox-ui/40';

/* ------------------------------ dates ------------------------------- */

export const day = (iso: string) => new Date(`${iso}T12:00:00`);

export function statusFor(start: string, end: string, today: Date): Status {
  if (today < day(start)) return 'Upcoming';
  if (today > new Date(`${end}T23:59:59`)) return 'Completed';
  return 'In progress';
}

export function fmtRange(a: string, b: string) {
  const x = day(a);
  const y = day(b);
  const md = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return x.getFullYear() === y.getFullYear()
    ? `${md(x)} – ${md(y)}, ${y.getFullYear()}`
    : `${md(x)}, ${x.getFullYear()} – ${md(y)}, ${y.getFullYear()}`;
}

export const fmtDay = (iso: string) => day(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/* ------------------------------ controls ----------------------------- */

const STATUS_CHIP: Record<Status, string> = {
  'In progress': 'bg-[#E3F6EC] text-[#11764A]',
  Upcoming: 'bg-[#E6F0FB] text-[#1048A5]',
  Completed: 'bg-[#EEF1F5] text-[#5F7896]',
};

export function StatusChip({ status, className = '' }: { status: Status; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[12px] font-semibold ${STATUS_CHIP[status]} ${className}`}>
      {status === 'In progress' && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {status}
    </span>
  );
}

export function FilterSelect<T extends string>({
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

/* --------------------------- location menu --------------------------- */

/** Custom dropdown so each state can show its series count on the right. */
export function LocationSelect({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; count: number }[];
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // On open, highlight the selected option and focus the list
  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    listRef.current?.focus();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the highlighted option in view
  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const choose = (i: number) => {
    onChange(options[i].value);
    setOpen(false);
    btnRef.current?.focus();
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(options.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
    else if (e.key === 'Escape' || e.key === 'Tab') { setOpen(false); if (e.key === 'Escape') btnRef.current?.focus(); }
    else if (/^[a-z]$/i.test(e.key)) {
      // Type a letter to jump to the next state starting with it
      const k = e.key.toLowerCase();
      const n = options.length;
      for (let step = 1; step <= n; step++) {
        const i = (active + step) % n;
        if (options[i].value !== 'all' && options[i].label.toLowerCase().startsWith(k)) { setActive(i); break; }
      }
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Location: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); } }}
        className={`${CONTROL} flex items-center pl-12 pr-10 text-left font-medium`}
      >
        <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#0D1B4C]" strokeWidth={2} />
        <span className="truncate">{current.label}</span>
        <ChevronDown className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0D1B4C] transition ${open ? 'rotate-180' : ''}`} strokeWidth={2.25} />
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-label="Location"
          aria-activedescendant={`loc-opt-${active}`}
          onKeyDown={onListKey}
          className="absolute left-0 z-30 mt-1.5 max-h-[340px] w-full min-w-[240px] overflow-y-auto rounded-md border border-[#D9E3EC] bg-white py-1.5 shadow-[0_12px_28px_rgba(10,30,60,0.16)] focus:outline-none"
        >
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value}
                id={`loc-opt-${i}`}
                data-i={i}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2 text-[15px] ${i === active ? 'bg-[#EEF6F9]' : ''} ${selected ? `font-semibold ${INK}` : o.count === 0 ? 'text-[#7D8BA0]' : 'text-[#1F2D3D]'} ${o.value === 'all' ? 'border-b border-[#EDF1F5] pb-2.5 mb-1' : ''}`}
              >
                <span className="truncate">{o.label}</span>
                <span
                  aria-label={`${o.count} series`}
                  className={`min-w-[26px] rounded-full px-2 py-[1px] text-center text-[12px] font-semibold ${o.count > 0 ? 'bg-[#E6F4F5] text-[#0E7C7B]' : 'bg-[#F1F4F7] text-[#9AA8B8]'}`}
                >
                  {o.count}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ----------------------------- view switch ---------------------------- */

export function ViewToggle({ view, onChange }: { view: ListingView; onChange: (v: ListingView) => void }) {
  return (
    <div role="group" aria-label="Choose view" className="flex h-[50px] rounded-md border border-[#D9E3EC] bg-white p-1 shadow-[0_1px_3px_rgba(10,30,60,0.04)]">
      {([
        { key: 'grid', label: 'Grid', icon: <LayoutGrid className="h-[18px] w-[18px]" strokeWidth={2} /> },
        { key: 'list', label: 'List', icon: <ListIcon className="h-[18px] w-[18px]" strokeWidth={2} /> },
        { key: 'map', label: 'Map', icon: <MapIcon className="h-[18px] w-[18px]" strokeWidth={2} /> },
      ] as const).map((b) => {
        const active = view === b.key;
        return (
          <button
            key={b.key}
            type="button"
            aria-pressed={active}
            title={`${b.label} view`}
            onClick={() => onChange(b.key)}
            className={`flex h-full flex-1 items-center justify-center gap-2 rounded px-3 text-[14px] font-semibold transition min-[1440px]:w-[42px] min-[1440px]:flex-none min-[1440px]:px-0 ${
              active ? 'bg-[#0E7C7B] text-white shadow-sm' : 'text-[#0D1B4C] hover:bg-[#EEF9F8]'
            }`}
          >
            {b.icon}
            <span className="min-[1440px]:sr-only">{b.label}<span className="sr-only"> view</span></span>
          </button>
        );
      })}
    </div>
  );
}
