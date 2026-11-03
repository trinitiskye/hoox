'use client';

// Species names for the public Species filters, from the admin-managed list
// (Admin → Tournaments → Fish Species). Returns null until loaded, or if the
// list isn't available, so callers can fall back to species found in the data.

import { useEffect, useState } from 'react';
import { sortSpecies } from './species';

let cache: Promise<string[] | null> | null = null;

function load() {
  if (!cache) {
    cache = fetch('/api/species')
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { species?: { name: string }[] } | null) => {
        const list = j?.species;
        return Array.isArray(list) && list.length ? sortSpecies(list).map((s) => s.name) : null;
      })
      .catch(() => null);
  }
  return cache;
}

export function useSpeciesList(): string[] | null {
  const [list, setList] = useState<string[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    load().then((l) => { if (!cancelled) setList(l); });
    return () => { cancelled = true; };
  }, []);
  return list;
}
