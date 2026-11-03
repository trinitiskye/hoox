// Shared definitions for the "Submit a Club" form (/clubs/submit):
// option lists, DB row shape, and server-side validation used by
// src/app/api/club-submissions.

import type { SubmissionStatus } from './eventSubmission';
export type { SubmissionStatus } from './eventSubmission';
export { SUBMISSION_STATUSES, IMAGE_TYPES, readImageSize } from './eventSubmission';

/** Roles allowed to list a club. Admins can too, for testing and support. */
export const CLUB_SUBMIT_ROLES = ['angler', 'director', 'admin'] as const;
/** Roles a new account can be created as from this page. */
export const CLUB_SIGNUP_ROLES = ['angler', 'director'] as const;
export type ClubSignupRole = (typeof CLUB_SIGNUP_ROLES)[number];

/** Matches the Fishing Style filter on /clubs */
export const CLUB_STYLES = ['Freshwater', 'Saltwater', 'Bass', 'Fly Fishing', 'Offshore', 'Inshore', 'Kayak'] as const;
/** Matches the skill levels shown on /clubs */
export const CLUB_LEVELS = ['Beginner friendly', 'All skill levels', 'Intermediate+'] as const;
export const CLUB_ROLES = ['President / Officer', 'Founder', 'Organizer', 'Member'] as const;

export const CLUB_LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const CLUB_COVER_MAX_BYTES = 5 * 1024 * 1024;
export const CLUB_COVER_MIN_WIDTH = 1200;
export const CLUB_ABOUT_MAX = 600;
export const PASSWORD_MIN = 6;

export interface DbClubSubmission {
  id: string;
  status: SubmissionStatus;
  submitted_by: string;
  submitter_name: string;
  submitter_email: string;
  submitter_role: string;
  club_role: string | null;
  club_name: string;
  city: string;
  state: string;
  country: string;
  styles: string[];
  species: string | null;
  skill_level: string | null;
  schedule: string | null;
  member_count: number | null;
  membership: string | null;
  dues: string | null;
  about: string;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  social_links: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  agreed_authorized: boolean;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type DbClubSubmissionInsert = Omit<
  DbClubSubmission,
  'id' | 'status' | 'admin_notes' | 'reviewed_at' | 'created_at' | 'updated_at'
>;

/** Club fields only; the submitter_* fields are filled in by the API route. */
export type ClubFields = Omit<DbClubSubmissionInsert, 'submitted_by' | 'submitter_name' | 'submitter_email' | 'submitter_role'>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (v: string) => EMAIL_RE.test(v);

function normalizeUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}
function isHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function parseClubFields(
  get: (k: string) => string,
  getAll: (k: string) => string[]
): { value: ClubFields | null; error: string | null } {
  const text = (k: string, label: string, max: number, required = false) => {
    const v = get(k).trim();
    if (!v) {
      if (required) throw new Error(`${label} is required.`);
      return null;
    }
    if (v.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
    return v;
  };

  try {
    const styles = getAll('styles').filter((s) => (CLUB_STYLES as readonly string[]).includes(s));
    if (styles.length === 0) throw new Error('Choose at least one fishing style.');

    const level = get('skillLevel').trim();
    if (level && !(CLUB_LEVELS as readonly string[]).includes(level)) throw new Error('Choose a skill level.');
    const clubRole = get('clubRole').trim();
    if (clubRole && !(CLUB_ROLES as readonly string[]).includes(clubRole)) throw new Error('Choose your role in the club.');

    const membership = get('membership').trim();
    if (membership && membership !== 'free' && membership !== 'paid') throw new Error('Choose free or paid membership.');

    const membersRaw = get('memberCount').replace(/,/g, '').trim();
    let memberCount: number | null = null;
    if (membersRaw) {
      const n = Number(membersRaw);
      if (!Number.isInteger(n) || n < 0 || n > 1_000_000) throw new Error('Number of members must be a whole number.');
      memberCount = n;
    }

    let website = text('website', 'Website', 500);
    if (website) {
      website = normalizeUrl(website);
      if (!isHttpUrl(website)) throw new Error('Website must be a valid web address.');
    }
    const contactEmail = text('contactEmail', 'Club contact email', 254);
    if (contactEmail && !isEmail(contactEmail)) throw new Error('Club contact email must be a valid email address.');

    if (get('agreedAuthorized') !== 'true') throw new Error('Please confirm you’re authorized to list this club.');

    return {
      value: {
        club_role: clubRole || null,
        club_name: text('clubName', 'Club name', 160, true)!,
        city: text('city', 'City', 120, true)!,
        state: text('state', 'State / province', 120, true)!,
        country: text('country', 'Country', 4) || 'US',
        styles,
        species: text('species', 'Species', 300),
        skill_level: level || null,
        schedule: text('schedule', 'Meeting schedule', 200),
        member_count: memberCount,
        membership: membership || null,
        dues: membership === 'paid' ? text('dues', 'Dues', 120) : null,
        about: text('about', 'About the club', CLUB_ABOUT_MAX, true)!,
        website,
        contact_email: contactEmail ? contactEmail.toLowerCase() : null,
        contact_phone: text('contactPhone', 'Phone', 40),
        social_links: text('socialLinks', 'Social links', 500),
        logo_url: null,
        cover_image_url: null,
        agreed_authorized: true,
      },
      error: null,
    };
  } catch (e) {
    return { value: null, error: e instanceof Error ? e.message : 'Invalid submission.' };
  }
}
