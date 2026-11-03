// Full tournament standings for /tournaments/<id>/leaderboard.
//
//  • Demo event (Lakefront Classic): a full 200-angler field built around the
//    home page leaderboard's top 10, so the page shows a realistic field.
//  • Real tournaments: every registered angler, ranked by their approved
//    catch submissions (total of submitted sizes, biggest fish as tiebreak).

import { BOARDS } from '@/components/home/LeaderboardSection';
import type { Registration, Submission } from '@/types';

export interface Standing {
  rank: number | null;   // null = no weigh-in yet
  angler: string;
  hometown?: string;
  fish: number;
  bigFish?: number;
  total?: number;
  /** Index into the demo avatar sprite (top 10 only) */
  avatarIndex?: number;
}

export interface StandingsData {
  rows: Standing[];
  unit: 'lb' | 'in';
  metricLabel: string;    // "Total Weight" / "Total Length"
  boardId?: string;       // demo sprite row
  live: boolean;
}

/** Standard competition ranking (1, 2, 2, 4) on total, then big fish */
export function rankRows(rows: Standing[]): Standing[] {
  const scored = rows.filter((r) => r.total !== undefined && r.fish > 0)
    .sort((a, b) => (b.total! - a.total!) || ((b.bigFish ?? 0) - (a.bigFish ?? 0)) || a.angler.localeCompare(b.angler));
  let prev: Standing | null = null;
  scored.forEach((r, i) => {
    r.rank = prev && prev.total === r.total && prev.bigFish === r.bigFish ? prev.rank : i + 1;
    prev = r;
  });
  const rest = rows.filter((r) => !scored.includes(r)).map((r) => ({ ...r, rank: null }))
    .sort((a, b) => a.angler.localeCompare(b.angler));
  return [...scored, ...rest];
}

/* ------------------------------- demo -------------------------------- */

const FIRST = ['Austin', 'Brandon', 'Carter', 'Derek', 'Evan', 'Garrett', 'Hunter', 'Isaac', 'Jake', 'Kevin', 'Logan', 'Mason', 'Nolan', 'Owen', 'Parker', 'Reed', 'Sam', 'Trent', 'Wade', 'Zach',
  'Amanda', 'Brooke', 'Casey', 'Dana', 'Erin', 'Hailey', 'Jenna', 'Kelsey', 'Lauren', 'Megan', 'Rachel', 'Shelby', 'Tara', 'Whitney', 'Grant', 'Bryce', 'Cody', 'Drew', 'Heath', 'Jordan'];
const LAST = ['Adams', 'Barnes', 'Coleman', 'Davis', 'Ellis', 'Fletcher', 'Griffin', 'Harper', 'Ingram', 'Jenkins', 'Knight', 'Lawson', 'Mitchell', 'Nash', 'Owens', 'Price', 'Quinn', 'Russell', 'Stewart', 'Tucker',
  'Underwood', 'Vaughn', 'Walker', 'Young', 'Bishop', 'Crawford', 'Dixon', 'Floyd', 'Gibbs', 'Holloway'];
const TOWNS = ['Hartwell, GA', 'Anderson, SC', 'Lavonia, GA', 'Clemson, SC', 'Toccoa, GA', 'Greenville, SC', 'Athens, GA', 'Gainesville, GA', 'Seneca, SC', 'Royston, GA',
  'Elberton, GA', 'Easley, SC', 'Commerce, GA', 'Pendleton, SC', 'Augusta, GA', 'Spartanburg, SC', 'Cartersville, GA', 'Rock Hill, SC', 'Macon, GA', 'Columbia, SC'];

/** Small seeded PRNG so the demo field is the same on every load */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function demoStandings(boardId = 'lakefront-classic', fieldSize = 200): StandingsData {
  const board = BOARDS.find((b) => b.id === boardId) ?? BOARDS[0];
  const rand = rng(17);
  const top: Standing[] = board.rows.map((r, i) => ({
    rank: null, angler: r.angler, fish: r.fish, total: r.weight,
    bigFish: r.weight !== undefined ? Math.round((r.weight / r.fish) * (1.25 + rand() * 0.35) * 100) / 100 : undefined,
    hometown: TOWNS[i % TOWNS.length], avatarIndex: i,
  }));
  const taken = new Set(top.map((t) => t.angler));
  const names: string[] = [];
  for (let i = 0; names.length < fieldSize - top.length && i < 5000; i++) {
    const n = `${FIRST[Math.floor(rand() * FIRST.length)]} ${LAST[Math.floor(rand() * LAST.length)]}`;
    if (!taken.has(n)) { taken.add(n); names.push(n); }
  }
  const weighed = Math.round((fieldSize - top.length) * 0.92); // the rest haven't weighed in yet
  const floor = top[top.length - 1]?.total ?? 16;
  const rest: Standing[] = names.map((angler, i) => {
    const hometown = TOWNS[Math.floor(rand() * TOWNS.length)];
    if (i >= weighed) return { rank: null, angler, hometown, fish: 0 };
    const t = i / weighed;                                   // 0 → 1 down the field
    const total = Math.max(1.2, Math.round((floor - 0.05 - t * (floor - 3.2) - rand() * 0.12) * 100) / 100);
    const fish = t < 0.6 ? 5 : t < 0.8 ? 4 : t < 0.9 ? 3 : t < 0.96 ? 2 : 1;
    const bigFish = Math.round(Math.min(total, (total / fish) * (1.15 + rand() * 0.45)) * 100) / 100;
    return { rank: null, angler, hometown, fish, total, bigFish };
  });
  return { rows: rankRows([...top, ...rest]), unit: 'lb', metricLabel: 'Total Weight', boardId: board.id, live: board.status === 'live' };
}

/* ------------------------------- real -------------------------------- */

const num = (s: string) => {
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export function realStandings(registrations: Registration[], submissions: Submission[], live: boolean): StandingsData {
  const byName = new Map<string, Standing>();
  const key = (n: string) => n.trim().toLowerCase();
  registrations.forEach((r) => { if (r.angler?.trim()) byName.set(key(r.angler), { rank: null, angler: r.angler.trim(), fish: 0 }); });
  submissions.filter((s) => s.status === 'approved' && s.angler?.trim()).forEach((s) => {
    const k = key(s.angler);
    const row = byName.get(k) ?? { rank: null, angler: s.angler.trim(), fish: 0 };
    const size = num(s.size);
    row.fish += 1;
    row.total = Math.round(((row.total ?? 0) + size) * 100) / 100;
    row.bigFish = Math.max(row.bigFish ?? 0, size);
    byName.set(k, row);
  });
  // Catches are measured on the board, so sizes are lengths
  return { rows: rankRows([...byName.values()]), unit: 'in', metricLabel: 'Total Length', live };
}
