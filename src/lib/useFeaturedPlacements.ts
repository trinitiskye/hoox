'use client';

// Live featured placements for one listing type, from /api/featured.
//   hero  — ids shown in that page's hero banner
//   badge — ids shown with a Featured badge, sorted to the top
// Ids are the listing ids the public pages use (clubs: submission id, or
// "demo:<slug>" for demo clubs).

import { useEffect, useState } from 'react';
import type { ListingType } from './featured';

export interface Placements { hero: Set<string>; badge: Set<string> }
const EMPTY: Placements = { hero: new Set(), badge: new Set() };
const cache: Partial<Record<ListingType, Promise<Placements>>> = {};

function load(type: ListingType) {
  return (cache[type] ??= fetch(`/api/featured?type=${type}`)
    .then((r) => (r.ok ? r.json() : { hero: [], badge: [] }))
    .then((j: { hero?: string[]; badge?: string[] }) => ({ hero: new Set(j.hero || []), badge: new Set(j.badge || []) }))
    .catch(() => EMPTY));
}

export function useFeaturedPlacements(type: ListingType): Placements {
  const [p, setP] = useState<Placements>(EMPTY);
  useEffect(() => {
    let cancelled = false;
    load(type).then((v) => { if (!cancelled) setP(v); });
    return () => { cancelled = true; };
  }, [type]);
  return p;
}

/** Pick one hero for today from several (rotates daily) */
export function dailyPick<T>(list: T[]): T | undefined {
  if (!list.length) return undefined;
  return list[Math.floor(Date.now() / 86_400_000) % list.length];
}
