// src/lib/eventDetail.ts
// View-model for the Tournament / Event detail page (/tournaments/[id]).
// Real tournaments are mapped from Supabase rows; anything the database
// doesn't store yet (prizes, rules, schedule notes, sponsor) is left empty
// so the page shows a "coming soon" state instead of made-up details.
// `DEMO_EVENT` (slug: lakefront-classic) reproduces the design mock.

import type { Tournament, User } from '@/types';
import { DEFAULT_DETAILS, WATER_LABEL, type WaterType } from './tournamentDetails';
import { DEFAULT_FORMAT, prizeRows, placePrizeTotal, formatSummary, POT_RULE_LABEL } from './tournamentFormat';

export interface ScheduleItem {
  date: string; // ISO yyyy-mm-dd
  title: string;
  time: string;
  place?: string;
}

export interface SpeciesItem {
  name: string;
  note?: string;
  image?: string;
}

export interface PayoutItem {
  place: string;
  amount: string;
}

export interface EventDetail {
  id: string;
  isDemo: boolean;
  badge: string;
  name: string;
  startDate: string; // ISO
  endDate: string; // ISO
  startTime?: string;
  endTime?: string;
  timezone?: string;
  locationName: string; // e.g. "Lake Hartwell, GA"
  address?: string; // e.g. "Hartwell, GA 30643"
  mapQuery: string; // used for Google Maps links / embed
  mapImage?: string; // static map (demo); real events use an embed
  heroImage: string;
  summary: string; // short hero copy
  overview: string; // Event Overview paragraph
  prizePool?: string;
  entries?: number; // boat / angler limit
  primarySpecies?: string;
  vessels?: string[]; // Kayak, Powerboat …
  waterType?: string; // Freshwater / Saltwater
  skillLevel?: string;
  /** Plain-language entry & judging lines (shown above the rules) */
  formatLines?: string[];
  /** Side pots and bonus awards (shown under prize payouts) */
  sidePots?: { name: string; detail: string; prize: string }[];
  schedule: ScheduleItem[];
  species: SpeciesItem[];
  payouts: PayoutItem[];
  payoutNote?: string;
  rules: string[];
  registration: {
    open: boolean;
    filled?: number;
    total?: number;
    closes?: string;
    fee?: string;
    feeNote?: string;
  };
  host?: {
    name: string;
    email?: string;
    phone?: string;
    website?: string;
    logo?: string;
  };
  sponsor?: {
    name: string;
    logo?: string;
    tagline?: string;
    image?: string;
    url?: string;
  };
}

/* ------------------------------ demo ------------------------------ */

export const DEMO_EVENT_ID = 'lakefront-classic';

export const DEMO_EVENT: EventDetail = {
  id: DEMO_EVENT_ID,
  isDemo: true,
  badge: 'Official Tournament',
  name: 'Lakefront Classic',
  startDate: '2025-05-17',
  endDate: '2025-05-19',
  timezone: 'America/New_York',
  locationName: 'Lake Hartwell, GA',
  address: 'Hartwell, GA 30643',
  mapQuery: 'Lake Hartwell, Hartwell, GA 30643',
  mapImage: '/events/demo/map.jpg',
  heroImage: '/events/demo/hero.jpg',
  summary:
    'Join us for the Lakefront Classic, a premier bass fishing tournament on beautiful Lake Hartwell. Open to anglers of all skill levels with a $150,000 total prize pool!',
  overview:
    'The Lakefront Classic brings together top anglers and weekend warriors for three days of competitive bass fishing on Lake Hartwell. With a $150,000 total prize pool and opportunities for both professional and amateur anglers, this event showcases the best fishing one of Georgia’s most iconic lakes has to offer.',
  prizePool: '$150,000',
  entries: 200,
  primarySpecies: 'Largemouth Bass',
  vessels: ['Powerboat'],
  skillLevel: 'All Skill Levels',
  schedule: [
    { date: '2025-05-16', title: 'Registration & Check-In', time: '2:00 PM – 6:00 PM', place: 'Hartwell Marina' },
    { date: '2025-05-17', title: 'Tournament Day 1', time: 'Safe Light – 4:00 PM', place: 'Hartwell Marina' },
    { date: '2025-05-18', title: 'Tournament Day 2', time: 'Safe Light – 4:00 PM', place: 'Hartwell Marina' },
    { date: '2025-05-19', title: 'Final Day & Awards', time: 'Safe Light – 3:00 PM', place: 'Awards at 5:00 PM' },
  ],
  species: [
    { name: 'Largemouth Bass', note: 'Primary Species', image: '/events/demo/largemouth-bass.png' },
    { name: 'Spotted Bass', image: '/events/demo/spotted-bass.png' },
    { name: 'Smallmouth Bass', image: '/events/demo/smallmouth-bass.png' },
    { name: 'Striped Bass', image: '/events/demo/striped-bass.png' },
    { name: 'Crappie (Optional)', image: '/events/demo/crappie.png' },
  ],
  payouts: [
    { place: '1st Place', amount: '$50,000' },
    { place: '2nd Place', amount: '$25,000' },
    { place: '3rd Place', amount: '$15,000' },
    { place: '4th Place', amount: '$10,000' },
    { place: '5th Place', amount: '$7,500' },
    { place: '6th – 10th', amount: '$5,000 each' },
    { place: '11th – 20th', amount: '$2,500 each' },
  ],
  payoutNote: 'Payouts based on 200 boat field. Final amounts subject to change.',
  rules: [
    'Two anglers per boat; both must be registered before the event.',
    'Five-fish limit per boat per day; minimum length 12 inches for all bass.',
    'Artificial lures only. Live bait is not permitted.',
    'All fish must be kept alive; dead-fish penalty of 0.25 lb per fish.',
    'Boats must check in at Hartwell Marina by 4:00 PM (3:00 PM on the final day).',
    'Life jackets must be worn whenever the outboard motor is running.',
    'Catches are verified by tournament judges through the HOOX app.',
  ],
  registration: {
    open: true,
    filled: 156,
    total: 200,
    closes: 'May 10, 2025 at 11:59 PM ET',
    fee: '$350 per boat',
    feeNote: 'Includes 2 anglers per boat',
  },
  host: {
    name: 'Lakefront Fishing Association',
    email: 'info@lakefrontfishing.org',
    phone: '(706) 555-0123',
    website: 'www.lakefrontfishing.org',
  },
  sponsor: {
    name: 'TidalGear',
    logo: '/home/tidalgear-logo.png',
    tagline: 'Built for anglers. Trusted by the water.',
    image: '/events/demo/sponsor-lure.jpg',
    url: '/partner',
  },
};

/* --------------------------- real events --------------------------- */

function fmtMoney(v?: string) {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : v;
}

function dayList(start: string, end: string) {
  const out: string[] = [];
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return [start];
  for (let d = new Date(s); d <= e && out.length < 14; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function to12h(t?: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  if (!Number.isFinite(h)) return t;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, '0')} ${ampm}`;
}

const TZ_ABBR: Record<string, string> = { 'America/Los_Angeles': 'PT', 'America/Denver': 'MT', 'America/Phoenix': 'MST', 'America/Chicago': 'CT', 'America/New_York': 'ET', 'America/Anchorage': 'AKT', 'Pacific/Honolulu': 'HT' };
const usd = (n: number) => `$${n.toLocaleString('en-US', Number.isInteger(n) ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function eventFromTournament(t: Tournament, host?: User | null, registrations?: number): EventDetail {
  const d = t.details ?? DEFAULT_DETAILS;
  const f = t.format ?? DEFAULT_FORMAT;
  const place = [t.city, [t.state, d.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const locationName = t.location ? (t.state ? `${t.location}, ${t.state}` : t.location) : [t.city, t.state].filter(Boolean).join(', ');
  const now = new Date();
  const end = new Date(`${t.endDate}T23:59:59`);
  const closes = d.registrationCloses ? new Date(d.registrationCloses) : null;
  const days = dayList(t.startDate, t.endDate);
  const fishes = t.fishTypes?.length ? t.fishTypes : t.species ? [t.species] : [];
  const fee = fmtMoney(t.entryFee || t.registrationFee);
  const total = t.maxParticipants ? Number(t.maxParticipants) : undefined;
  const per = f.entryType === 'team' ? (f.feeBasis === 'per_angler' ? 'per angler' : 'per team') : 'per angler';
  const pool = d.prizePool || (placePrizeTotal(f) > 0 ? usd(placePrizeTotal(f)) : undefined);
  const water = t.waterType && t.waterType in WATER_LABEL ? WATER_LABEL[t.waterType as WaterType] : undefined;

  return {
    id: t.id,
    isDemo: false,
    badge: d.badge || 'Official Tournament',
    name: t.name,
    startDate: t.startDate,
    endDate: t.endDate,
    startTime: t.startTime,
    endTime: t.endTime,
    timezone: t.timezone,
    locationName: locationName || 'Location to be announced',
    address: [d.address, place].filter(Boolean).join(', ') || undefined,
    mapQuery: [t.location, d.address, t.city, t.state, d.zip].filter(Boolean).join(', '),
    heroImage: t.image || DEMO_EVENT.heroImage,
    summary: d.summary || t.description || `Join us for ${t.name}${locationName ? ` on ${locationName}` : ''}.`,
    overview: t.description || 'More details about this tournament will be posted by the tournament director.',
    prizePool: pool,
    entries: total,
    primarySpecies: fishes[0],
    vessels: t.vesselTypes ?? [],
    waterType: water,
    skillLevel: d.skillLevel || undefined,
    formatLines: formatSummary(f),
    schedule: d.schedule.length
      ? d.schedule.map((x) => ({ date: x.date, title: x.title, time: x.time, place: x.place || undefined }))
      : days.map((day, i) => ({
          date: day,
          title: days.length === 1 ? 'Tournament Day' : i === days.length - 1 ? 'Final Day' : `Tournament Day ${i + 1}`,
          time: [to12h(t.startTime), to12h(t.endTime)].filter(Boolean).join(' – '),
          place: t.location,
        })),
    species: fishes.map((name, i) => ({ name, note: d.speciesNotes[name] || (i === 0 ? 'Primary Species' : undefined) })),
    payouts: prizeRows(f),
    payoutNote: d.payoutNote || undefined,
    sidePots: f.sidePots.map((p) => ({
      name: p.name,
      detail: [p.kind === 'pot' ? `Optional buy-in ${usd(p.fee)}` : 'Free bonus award', POT_RULE_LABEL[p.rule] + (p.species ? ` (${p.species})` : '')].join(' · '),
      prize: p.payout === 'share' ? p.splits.map((x, i) => `${i + 1}${['st', 'nd', 'rd'][i] || 'th'} ${x}%`).join(', ') + ' of the pot' : [p.amount !== null ? usd(p.amount) : '', p.description].filter(Boolean).join(' + '),
    })),
    rules: d.rules,
    registration: {
      open: now < end && t.status !== 'completed' && !(closes && !isNaN(closes.getTime()) && now > closes),
      filled: registrations,
      total,
      closes: closes && !isNaN(closes.getTime())
        ? `${closes.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${closes.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}${t.timezone && TZ_ABBR[t.timezone] ? ` ${TZ_ABBR[t.timezone]}` : ''}`
        : undefined,
      fee: fee ? `${fee} ${per}` : undefined,
      feeNote: d.feeNote || undefined,
    },
    host: d.host.name || d.host.email || d.host.phone || d.host.website
      ? { name: d.host.name || host?.profileOrganization || host?.organization || host?.name || 'Tournament host', email: d.host.email || undefined, phone: d.host.phone || undefined, website: d.host.website || undefined, logo: d.host.logo || undefined }
      : host
        ? {
            name: host.profileOrganization || host.organization || host.profileDisplayName || host.name,
            email: host.profileEmail || host.email,
            phone: host.profilePhone || host.phone,
            website: host.profileWebsite || host.website,
          }
        : undefined,
    sponsor: d.sponsor.name
      ? { name: d.sponsor.name, logo: d.sponsor.logo || undefined, tagline: d.sponsor.tagline || undefined, image: d.sponsor.image || undefined, url: d.sponsor.url || undefined }
      : undefined,
  };
}

/* ------------------------------ helpers ----------------------------- */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function parseISO(d: string) {
  const x = new Date(`${d}T00:00:00`);
  return isNaN(x.getTime()) ? null : x;
}

/** "May 17 – 19, 2025" */
export function formatDateRange(start: string, end: string) {
  const a = parseISO(start);
  const b = parseISO(end) ?? a;
  if (!a || !b) return start;
  if (a.getTime() === b.getTime()) return `${MONTHS[a.getMonth()]} ${a.getDate()}, ${a.getFullYear()}`;
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${MONTHS[a.getMonth()]} ${a.getDate()} – ${b.getDate()}, ${b.getFullYear()}`;
  }
  return `${MONTHS[a.getMonth()]} ${a.getDate()} – ${MONTHS[b.getMonth()]} ${b.getDate()}, ${b.getFullYear()}`;
}

export function monthDay(d: string) {
  const x = parseISO(d);
  return x ? { month: MONTHS[x.getMonth()].toUpperCase(), day: String(x.getDate()) } : { month: '', day: d };
}

export function mapsSearchUrl(q: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function mapsDirectionsUrl(q: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
}

export function mapsEmbedUrl(q: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=11&output=embed`;
}

export function websiteHref(w: string) {
  return /^https?:\/\//i.test(w) ? w : `https://${w}`;
}

/** Builds an all-day .ics calendar file for the event and triggers a download. */
export function downloadIcs(e: EventDetail) {
  const ymd = (d: string) => d.replace(/-/g, '');
  const endExclusive = (() => {
    const x = parseISO(e.endDate);
    if (!x) return ymd(e.endDate);
    x.setDate(x.getDate() + 1);
    return `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, '0')}${String(x.getDate()).padStart(2, '0')}`;
  })();
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HOOX//Tournament//EN',
    'BEGIN:VEVENT',
    `UID:${e.id}@hoox.app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART;VALUE=DATE:${ymd(e.startDate)}`,
    `DTEND;VALUE=DATE:${endExclusive}`,
    `SUMMARY:${esc(e.name)}`,
    `LOCATION:${esc(e.mapQuery || e.locationName)}`,
    `DESCRIPTION:${esc(`${e.summary}\n\n${url}`)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${e.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
