// Shared definitions for the "Submit your Event" form (/events/submit):
// option lists used by the client form, the DB row shape, and server-side
// validation used by src/app/api/event-submissions.

export const EVENT_TYPES = [
  'Trade show / Expo',
  'Boat show',
  'Sportsman’s show',
  'Fishing festival',
  'Seminar / Clinic',
  'Other',
] as const;

export const FISHING_FOCUS = [
  'Bass',
  'Trout',
  'Walleye',
  'Panfish',
  'Catfish',
  'Fly fishing',
  'Saltwater / Offshore',
  'Inshore',
  'Kayak fishing',
  'Ice fishing',
  'All species',
] as const;

/** Promotion options. Pricing is quoted after review, so none is shown here. */
export const PROMO_PACKAGES = [
  { id: 'basic_listing', label: 'Basic event listing', note: 'Free listing on the HOOX Events page and calendar.' },
  { id: 'featured_listing', label: 'Featured event listing', note: 'Featured badge and pinned near the top of Events.' },
  { id: 'home_hero', label: 'Home page hero (rotating)', note: 'Your 16:9 image in the home page hero carousel.' },
  { id: 'home_hero_exclusive', label: 'Home page hero takeover', note: 'The only slide in the home hero for your run dates.' },
  { id: 'section_hero', label: 'Section page hero', note: 'Hero placement on the Events or Tournaments page.' },
  { id: 'banner_leaderboard', label: 'Leaderboard banner', note: '728 × 90 desktop / 320 × 50 mobile, site-wide.' },
  { id: 'banner_rectangle', label: 'Medium rectangle banner', note: '300 × 250 in page sidebars and feeds.' },
  { id: 'banner_half_page', label: 'Half page banner', note: '300 × 600 in page sidebars.' },
  { id: 'show_season_bundle', label: 'Show season bundle', note: 'Hero + banner + featured listing, discounted.' },
] as const;

export type SubmissionStatus = 'new' | 'in_review' | 'approved' | 'declined';
export const SUBMISSION_STATUSES: SubmissionStatus[] = ['new', 'in_review', 'approved', 'declined'];

export const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
export const LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const HERO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB — matches the bucket limit
export const HERO_MIN_WIDTH = 1920;
export const HERO_MIN_HEIGHT = 1080;

export interface DbEventSubmission {
  id: string;
  status: SubmissionStatus;
  contact_name: string;
  contact_title: string | null;
  contact_email: string;
  contact_phone: string | null;
  organization: string;
  organization_website: string | null;
  event_name: string;
  event_type: string;
  start_date: string;
  end_date: string;
  daily_hours: string | null;
  venue_name: string;
  address: string | null;
  city: string;
  state: string;
  zip: string | null;
  country: string;
  short_description: string;
  long_description: string | null;
  ticket_url: string | null;
  ticket_price: string | null;
  expected_attendance: number | null;
  exhibitor_count: number | null;
  fishing_focus: string[];
  social_links: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  hero_alt_text: string | null;
  packages: string[];
  preferred_start: string | null;
  preferred_end: string | null;
  promo_code: string | null;
  billing_name: string | null;
  billing_email: string | null;
  notes: string | null;
  agreed_rights: boolean;
  agreed_terms: boolean;
  marketing_opt_in: boolean;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type DbEventSubmissionInsert = Omit<
  DbEventSubmission,
  'id' | 'status' | 'admin_notes' | 'reviewed_at' | 'created_at' | 'updated_at'
>;

// ------------------------------------------------------------
// Validation (server)
// ------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Accepts "example.com" and prefixes https:// so organizers don't trip on it. */
function normalizeUrl(value: string) {
  if (!value) return value;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function isValidDate(value: string) {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * Validate the text fields of a submission (files are checked separately).
 * `get` reads a single string field; `getAll` reads a repeated field.
 */
export function parseEventSubmission(
  get: (k: string) => string,
  getAll: (k: string) => string[]
): { value: DbEventSubmissionInsert | null; error: string | null } {
  const fail = (error: string) => ({ value: null, error });

  const text = (k: string, label: string, max: number, required = false): string | null | undefined => {
    const v = get(k).trim();
    if (!v) {
      if (required) throw new Error(`${label} is required.`);
      return null;
    }
    if (v.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
    return v;
  };
  const url = (k: string, label: string) => {
    const raw = text(k, label, 500);
    if (!raw) return null;
    const v = normalizeUrl(raw);
    if (!isHttpUrl(v)) throw new Error(`${label} must be a valid web address.`);
    return v;
  };
  const date = (k: string, label: string, required = false) => {
    const v = get(k).trim();
    if (!v) {
      if (required) throw new Error(`${label} is required.`);
      return null;
    }
    if (!isValidDate(v)) throw new Error(`${label} must be a valid date.`);
    return v;
  };
  const count = (k: string, label: string) => {
    const v = get(k).replace(/,/g, '').trim();
    if (!v) return null;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0 || n > 10_000_000) throw new Error(`${label} must be a whole number.`);
    return n;
  };
  const email = (k: string, label: string, required = false) => {
    const v = text(k, label, 254, required);
    if (v && !EMAIL_RE.test(v)) throw new Error(`${label} must be a valid email address.`);
    return v ? v.toLowerCase() : null;
  };

  try {
    const eventType = get('eventType').trim();
    if (!(EVENT_TYPES as readonly string[]).includes(eventType)) return fail('Choose an event type.');

    const focus = getAll('fishingFocus').filter((f) => (FISHING_FOCUS as readonly string[]).includes(f));
    const packageIds = PROMO_PACKAGES.map((p) => p.id as string);
    const packages = getAll('packages').filter((p) => packageIds.includes(p));
    if (packages.length === 0) return fail('Choose at least one promotion option.');

    const startDate = date('startDate', 'Start date', true)!;
    const endDate = date('endDate', 'End date', true)!;
    if (endDate < startDate) return fail('End date can’t be before the start date.');

    const preferredStart = date('preferredStart', 'Preferred run start');
    const preferredEnd = date('preferredEnd', 'Preferred run end');
    if (preferredStart && preferredEnd && preferredEnd < preferredStart) {
      return fail('Preferred run end can’t be before its start.');
    }

    if (get('agreedRights') !== 'true') return fail('Please confirm you have the rights to the images you submitted.');
    if (get('agreedTerms') !== 'true') return fail('Please accept the HOOX listing and advertising guidelines.');

    const value: DbEventSubmissionInsert = {
      contact_name: text('contactName', 'Contact name', 120, true)!,
      contact_title: text('contactTitle', 'Title', 120) ?? null,
      contact_email: email('contactEmail', 'Email', true)!,
      contact_phone: text('contactPhone', 'Phone', 40) ?? null,
      organization: text('organization', 'Organization', 160, true)!,
      organization_website: url('organizationWebsite', 'Organization website'),

      event_name: text('eventName', 'Event name', 160, true)!,
      event_type: eventType,
      start_date: startDate,
      end_date: endDate,
      daily_hours: text('dailyHours', 'Daily hours', 200) ?? null,
      venue_name: text('venueName', 'Venue name', 160, true)!,
      address: text('address', 'Street address', 200) ?? null,
      city: text('city', 'City', 120, true)!,
      state: text('state', 'State / province', 120, true)!,
      zip: text('zip', 'ZIP / postal code', 20) ?? null,
      country: text('country', 'Country', 4) || 'US',
      short_description: text('shortDescription', 'Short description', 160, true)!,
      long_description: text('longDescription', 'Full description', 4000) ?? null,
      ticket_url: url('ticketUrl', 'Ticket link'),
      ticket_price: text('ticketPrice', 'Ticket price', 120) ?? null,
      expected_attendance: count('expectedAttendance', 'Expected attendance'),
      exhibitor_count: count('exhibitorCount', 'Number of exhibitors'),
      fishing_focus: focus,
      social_links: text('socialLinks', 'Social links', 500) ?? null,

      logo_url: null,
      hero_image_url: null,
      hero_alt_text: text('heroAltText', 'Image description', 250) ?? null,

      packages,
      preferred_start: preferredStart,
      preferred_end: preferredEnd,
      promo_code: text('promoCode', 'Promo code', 40) ?? null,
      billing_name: text('billingName', 'Billing contact', 120) ?? null,
      billing_email: email('billingEmail', 'Billing email'),
      notes: text('notes', 'Notes', 2000) ?? null,

      agreed_rights: true,
      agreed_terms: true,
      marketing_opt_in: get('marketingOptIn') === 'true',
    };
    return { value, error: null };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Invalid submission.');
  }
}

/** Read PNG / JPEG / WebP pixel dimensions from the file header. */
export function readImageSize(buf: ArrayBuffer): { width: number; height: number } | null {
  const b = new Uint8Array(buf);
  const dv = new DataView(buf);
  // PNG
  if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { width: dv.getUint32(16), height: dv.getUint32(20) };
  }
  // JPEG: walk segments to the first SOFn marker
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      const len = dv.getUint16(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: dv.getUint16(i + 5), width: dv.getUint16(i + 7) };
      }
      i += 2 + len;
    }
    return null;
  }
  // WebP
  if (b.length > 30 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') {
    const chunk = String.fromCharCode(...b.slice(12, 16));
    if (chunk === 'VP8X') {
      return { width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
    }
    if (chunk === 'VP8 ') {
      return { width: dv.getUint16(26, true) & 0x3fff, height: dv.getUint16(28, true) & 0x3fff };
    }
    if (chunk === 'VP8L') {
      const bits = dv.getUint32(21, true);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}
