'use client';

// Listings an admin can attach a featured placement to, per type.
// ids match what the public pages use: tournament / series / expo ids, and for
// clubs the club submission id (approved clubs) or "demo:<slug>" (demo clubs).

import { useEffect, useState } from 'react';
import { DEMO as DEMO_TOURNAMENTS } from '@/components/pages/TournamentsPage';
import { SERIES } from '@/components/pages/SeriesPage';
import { CLUBS } from '@/components/pages/ClubsPage';
import { EXPOS } from '@/lib/demoExpos';
import { fetchTournaments } from '@/lib/storage';
import type { ListingType } from '@/lib/featured';

export interface ListingOption { id: string; name: string; sub: string }

const range = (a: string, b?: string) => {
  const f = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return b && b !== a ? `${f(a)} – ${f(b)}` : f(a);
};

export function useListingOptions(type: ListingType) {
  const [options, setOptions] = useState<ListingOption[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let list: ListingOption[] = [];
      if (type === 'tournament') {
        const db = await fetchTournaments().catch(() => []);
        list = [
          ...db.map((t) => ({ id: t.id, name: t.name, sub: [range(t.startDate, t.endDate), [t.city, t.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ') })),
          ...DEMO_TOURNAMENTS.map((t) => ({ id: t.id, name: t.name, sub: `${range(t.start, t.end)} · demo` })),
        ];
      } else if (type === 'series') {
        list = SERIES.map((s) => ({ id: s.id, name: s.name, sub: `${s.stops.length} events · ${s.region} · demo` }));
      } else if (type === 'event') {
        list = EXPOS.map((e) => ({ id: e.id, name: e.name, sub: `${range(e.start, e.end)} · ${e.city}, ${e.state} · demo` }));
      } else {
        const live = await fetch('/api/clubs').then((r) => (r.ok ? r.json() : { clubs: [] })).catch(() => ({ clubs: [] }));
        list = [
          ...((live.clubs || []) as { id: string; name: string; city: string; state: string }[]).map((c) => ({ id: c.id.replace(/^club-/, ''), name: c.name, sub: `${c.city}, ${c.state}` })),
          ...CLUBS.map((c) => ({ id: `demo:${c.id}`, name: c.name, sub: `${c.city}, ${c.state} · demo` })),
        ];
      }
      if (!cancelled) setOptions(list);
    })();
    return () => { cancelled = true; };
  }, [type]);
  return options;
}
