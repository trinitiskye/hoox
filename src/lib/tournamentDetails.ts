// Tournament page details (client + server safe): everything the tournament
// page shows that isn't a core column: badge, hero summary, skill level,
// schedule, species notes, rules, registration deadline and fee note,
// prize pool and payout note, host contact, presenting sponsor, address.
// Stored in public.tournaments.details (jsonb). Water type is its own column
// (water_type) so it can be filtered.

export const WATER_TYPES = ['freshwater', 'saltwater'] as const;
export type WaterType = (typeof WATER_TYPES)[number];
export const WATER_LABEL: Record<WaterType, string> = { freshwater: 'Freshwater', saltwater: 'Saltwater' };

export const SKILL_LEVELS = ['All Skill Levels', 'Beginner Friendly', 'Amateur', 'Semi-Pro', 'Pro', 'Youth', 'Seniors'] as const;

export interface ScheduleEntry { date: string; title: string; time: string; place: string }
export interface TournamentDetails {
  badge: string;                 // "Official Tournament"
  summary: string;               // short hero copy
  skillLevel: string;
  address: string;               // street address
  zip: string;
  schedule: ScheduleEntry[];     // empty = built from the tournament dates
  speciesNotes: Record<string, string>; // e.g. { "Crappie": "Optional" }
  rules: string[];
  registrationCloses: string;    // "YYYY-MM-DDTHH:MM" local to the tournament's time zone
  feeNote: string;               // "Includes 2 anglers per boat"
  prizePool: string;             // display override; blank = add up the place prizes
  payoutNote: string;
  host: { name: string; email: string; phone: string; website: string };
  sponsor: { name: string; url: string; logo: string; tagline: string; image: string };
}

export const DEFAULT_DETAILS: TournamentDetails = {
  badge: 'Official Tournament', summary: '', skillLevel: 'All Skill Levels', address: '', zip: '',
  schedule: [], speciesNotes: {}, rules: [], registrationCloses: '', feeNote: '', prizePool: '', payoutNote: '',
  host: { name: '', email: '', phone: '', website: '' },
  sponsor: { name: '', url: '', logo: '', tagline: '', image: '' },
};

const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const urlOk = (u: string) => !u || /^https?:\/\//i.test(u) || u.startsWith('/');

/** Read details from a row, filling in defaults (never throws) */
export function detailsFromRow(raw: unknown): TournamentDetails {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const parsed = parseDetails(r, true);
  return parsed.value ?? DEFAULT_DETAILS;
}

/** Validate details from the editor. `lenient` skips errors (for reading stored rows). */
export function parseDetails(input: Record<string, unknown>, lenient = false): { value: TournamentDetails | null; error: string | null } {
  const fail = (error: string) => (lenient ? null : { value: null, error });
  const host = (input.host || {}) as Record<string, unknown>;
  const sp = (input.sponsor || {}) as Record<string, unknown>;
  const out: TournamentDetails = {
    badge: s(input.badge, 40) || DEFAULT_DETAILS.badge,
    summary: s(input.summary, 300),
    skillLevel: s(input.skillLevel, 40) || DEFAULT_DETAILS.skillLevel,
    address: s(input.address, 200),
    zip: s(input.zip, 12),
    schedule: [],
    speciesNotes: {},
    rules: (Array.isArray(input.rules) ? input.rules : []).map((x) => s(x, 500)).filter(Boolean).slice(0, 60),
    registrationCloses: s(input.registrationCloses, 16),
    feeNote: s(input.feeNote, 160),
    prizePool: s(input.prizePool, 40),
    payoutNote: s(input.payoutNote, 300),
    host: { name: s(host.name, 120), email: s(host.email, 254).toLowerCase(), phone: s(host.phone, 40), website: s(host.website, 300) },
    sponsor: { name: s(sp.name, 120), url: s(sp.url, 500), logo: s(sp.logo, 1000), tagline: s(sp.tagline, 120), image: s(sp.image, 1000) },
  };
  for (const raw of (Array.isArray(input.schedule) ? input.schedule : []).slice(0, 40)) {
    const r = (raw || {}) as Record<string, unknown>;
    const item = { date: s(r.date, 10), title: s(r.title, 120), time: s(r.time, 60), place: s(r.place, 160) };
    if (!item.title && !item.date) continue;
    if (!DATE_RE.test(item.date)) { const e = fail(`Schedule “${item.title || 'item'}”: choose a date.`); if (e) return e; continue; }
    if (!item.title) { const e = fail('Every schedule item needs a title.'); if (e) return e; continue; }
    out.schedule.push(item);
  }
  out.schedule.sort((a, b) => a.date.localeCompare(b.date));
  if (input.speciesNotes && typeof input.speciesNotes === 'object') {
    for (const [k, v] of Object.entries(input.speciesNotes as Record<string, unknown>).slice(0, 40)) {
      const note = s(v, 60);
      if (note) out.speciesNotes[s(k, 80)] = note;
    }
  }
  if (out.registrationCloses && !DT_RE.test(out.registrationCloses)) { const e = fail('Registration closes: choose a date and time.'); if (e) return e; out.registrationCloses = ''; }
  if (out.host.email && !EMAIL_RE.test(out.host.email)) { const e = fail('Host email isn’t valid.'); if (e) return e; out.host.email = ''; }
  for (const [label, u] of [['Sponsor website', out.sponsor.url], ['Sponsor logo', out.sponsor.logo], ['Sponsor image', out.sponsor.image]] as const) {
    if (!urlOk(u)) { const e = fail(`${label} must be a link starting with https://`); if (e) return e; }
  }
  if (out.host.website && !/^https?:\/\//i.test(out.host.website) && !lenient) out.host.website = `https://${out.host.website.replace(/^\/+/, '')}`;
  return { value: out, error: null };
}
