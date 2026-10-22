// src/lib/anglerProfile.ts
// View-model for the public angler profile page (/anglers/<slug>).
// Leaderboards are demo data today, so profiles are built from the same
// demo leaderboard boards. Mike Reynolds has the full profile from the
// design mock; every other angler gets a profile assembled from the
// boards they appear on (results, upcoming events), with no invented bio.
// Swap this for Supabase angler profiles + real standings later.

import { BOARDS } from '@/components/home/LeaderboardSection';
import { anglerSlug } from '@/lib/anglerLinks';

export { anglerSlug, anglerHref } from '@/lib/anglerLinks';

export interface AnglerResult {
  date: string; // ISO
  tournament: string;
  tournamentId?: string; // has an event page when set
  location: string;
  boat: string;
  place: number;
  fish: number;
  weight: number; // lbs
}

export interface AnglerActivity {
  date: string; // ISO
  kind: 'result' | 'registered' | 'live';
  text: string;
  tournamentId?: string;
}

export interface AnglerSponsor {
  name: string;
  tagline?: string;
  logo?: string; // image; otherwise rendered as a wordmark
  style: 'tidal' | 'sonar' | 'volt' | 'amp' | 'stryk' | 'lodge';
}

export interface AnglerProfile {
  slug: string;
  name: string;
  firstName: string;
  isPro: boolean;
  avatar?: string; // photo
  sprite?: { boardId: string; index: number }; // leaderboard avatar sprite fallback
  city?: string;
  country?: string;
  tagline?: string[];
  quote?: string;
  about?: string;
  team?: string;
  social: { kind: 'facebook' | 'instagram' | 'youtube' | 'website'; label: string }[];
  stats: {
    tournaments: number;
    fish: number;
    weight: number;
    top5: number;
    top10: number;
    wins: number;
  };
  awards: string[];
  results: AnglerResult[];
  activity: AnglerActivity[];
  sponsors: AnglerSponsor[];
  photos: string[];
}

/* ------------------------- board → result rows ------------------------ */

function resultsFromBoards(name: string): { results: AnglerResult[]; activity: AnglerActivity[] } {
  const results: AnglerResult[] = [];
  const activity: AnglerActivity[] = [];
  for (const b of BOARDS) {
    const i = b.rows.findIndex((r) => r.angler === name);
    if (i < 0) continue;
    const row = b.rows[i];
    const tournamentId = b.id === 'lakefront-classic' ? b.id : undefined;
    if (b.status === 'upcoming' || row.weight === undefined) {
      activity.push({ date: b.start, kind: 'registered', text: `Registered for ${b.name} (${b.location})`, tournamentId });
      continue;
    }
    results.push({
      date: b.start,
      tournament: b.name,
      tournamentId,
      location: b.location,
      boat: row.boat,
      place: i + 1,
      fish: row.fish,
      weight: row.weight,
    });
    activity.push(
      b.status === 'live'
        ? { date: b.start, kind: 'live', text: `Currently ${ordinal(i + 1)} at ${b.name} with ${row.weight.toFixed(2)} lb`, tournamentId }
        : { date: b.start, kind: 'result', text: `Finished ${ordinal(i + 1)} at ${b.name} with ${row.weight.toFixed(2)} lb`, tournamentId },
    );
  }
  results.sort((a, b) => b.date.localeCompare(a.date));
  activity.sort((a, b) => b.date.localeCompare(a.date));
  return { results, activity };
}

export function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function statsFrom(results: AnglerResult[]) {
  return {
    tournaments: results.length,
    fish: results.reduce((t, r) => t + r.fish, 0),
    weight: Math.round(results.reduce((t, r) => t + r.weight, 0) * 100) / 100,
    top5: results.filter((r) => r.place <= 5).length,
    top10: results.filter((r) => r.place <= 10).length,
    wins: results.filter((r) => r.place === 1).length,
  };
}

/* ------------------------------ demo (mock) ----------------------------- */

const DEMO_SPONSORS: AnglerSponsor[] = [
  { name: 'TidalGear', tagline: 'Outdoor Equipment', logo: '/home/tidalgear-logo.png', style: 'tidal' },
  { name: 'Sonarix', tagline: 'Marine Electronics', style: 'sonar' },
  { name: 'Voltwake', tagline: 'Electric Outboards', style: 'volt' },
  { name: 'Ampfin', tagline: 'Lithium Batteries', style: 'amp' },
  { name: 'Strykor', tagline: 'Rods & Reels', style: 'stryk' },
  { name: 'Lunker Lodge', tagline: 'Baits & Tackle', style: 'lodge' },
];

const MIKE: AnglerProfile = {
  slug: 'mike-reynolds',
  name: 'Mike Reynolds',
  firstName: 'Mike',
  isPro: true,
  avatar: '/anglers/demo/mike-reynolds.jpg',
  city: 'Loganville, GA',
  country: 'United States',
  tagline: [
    'Tournament angler, father, and outdoors advocate.',
    'Passionate about fishing and sharing the experience with the next generation.',
  ],
  quote: 'Tight lines and better days on the water.',
  about:
    'I’m a Georgia-based tournament angler who loves competing on lakes across the Southeast. When I’m not fishing, I’m spending time with my family and working to introduce more people to the sport. Grateful for the opportunities this community provides.',
  team: 'TidalGear Pro Staff',
  social: [
    { kind: 'facebook', label: '@mikereynoldsfishing' },
    { kind: 'instagram', label: '@m.reynoldsfishing' },
    { kind: 'youtube', label: 'Mike Reynolds Fishing' },
    { kind: 'website', label: 'www.mikereynoldsfishing.com' },
  ],
  stats: { tournaments: 28, fish: 126, weight: 412.36, top5: 7, top10: 12, wins: 3 },
  awards: ['Angler of the Year (2024) – Southeast Trail'],
  results: [
    { date: '2025-05-17', tournament: 'Lakefront Classic', tournamentId: 'lakefront-classic', location: 'Lake Hartwell, GA', boat: 'B12', place: 1, fish: 5, weight: 18.24 },
    { date: '2025-04-06', tournament: 'Spring Showdown', location: 'Lake Oconee, GA', boat: 'A07', place: 5, fish: 5, weight: 16.82 },
    { date: '2025-03-22', tournament: 'Southeast Open', location: 'Lake Lanier, GA', boat: 'C18', place: 12, fish: 5, weight: 14.96 },
    { date: '2025-02-15', tournament: 'Winter Classic', location: 'Clarks Hill Lake, SC', boat: 'B03', place: 3, fish: 5, weight: 17.11 },
    { date: '2025-01-25', tournament: 'New Year’s Kickoff', location: 'Lake Seminole, GA', boat: 'D21', place: 8, fish: 5, weight: 13.84 },
  ],
  activity: [
    { date: '2025-05-17', kind: 'live', text: 'Leading the Lakefront Classic after Day 1 with 18.24 lb', tournamentId: 'lakefront-classic' },
    { date: '2025-05-02', kind: 'registered', text: 'Registered for the Lakefront Classic (Lake Hartwell, GA)', tournamentId: 'lakefront-classic' },
    { date: '2025-04-06', kind: 'result', text: 'Finished 5th at the Spring Showdown with 16.82 lb' },
    { date: '2025-03-22', kind: 'result', text: 'Finished 12th at the Southeast Open with 14.96 lb' },
    { date: '2025-02-15', kind: 'result', text: 'Finished 3rd at the Winter Classic with 17.11 lb' },
    { date: '2025-01-25', kind: 'result', text: 'Finished 8th at the New Year’s Kickoff with 13.84 lb' },
  ],
  sponsors: DEMO_SPONSORS,
  photos: [
    '/events/demo/hero.jpg',
    '/home/coastal-open.jpg',
    '/home/summer-slam.jpg',
    '/home/mountain-lake.jpg',
    '/home/fall-classic.jpg',
    '/home/pine-creek.jpg',
  ],
};

/* -------------------------------- lookup -------------------------------- */

export function getAnglerProfile(slug: string): AnglerProfile | null {
  if (slug === MIKE.slug) return MIKE;

  for (const b of BOARDS) {
    const index = b.rows.findIndex((r) => anglerSlug(r.angler) === slug);
    if (index < 0) continue;
    const name = b.rows[index].angler;
    const { results, activity } = resultsFromBoards(name);
    return {
      slug,
      name,
      firstName: name.split(' ')[0],
      isPro: false,
      sprite: { boardId: b.id, index },
      social: [],
      stats: statsFrom(results),
      awards: [],
      results,
      activity,
      sponsors: [],
      photos: [],
    };
  }
  return null;
}

