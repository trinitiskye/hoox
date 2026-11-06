// Image slots on the tournament form (client + server safe): what each one
// is for, the size we ask for, and the minimum we accept on upload.

export type TournamentImageKind = 'banner' | 'sponsor-logo' | 'sponsor-image' | 'club-logo';

export interface ImageSpec {
  label: string;
  /** Shown under the uploader */
  help: string;
  minWidth: number;
  minHeight: number;
  maxBytes: number;
  types: Record<string, string>; // mime → extension
  landscape?: boolean;
}

const PHOTO: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const LOGO: Record<string, string> = { 'image/png': 'png', 'image/webp': 'webp' };
const CLUB_LOGO: Record<string, string> = { 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg' };

export const IMAGE_SPECS: Record<TournamentImageKind, ImageSpec> = {
  banner: {
    label: 'Banner image',
    help: 'Landscape photo, 1920 × 1080 px recommended (at least 1600 px wide). JPG, PNG or WebP, up to 5 MB. Keep the main subject on the right half: text sits over the left side.',
    minWidth: 1600, minHeight: 600, maxBytes: 5 * 1024 * 1024, types: PHOTO, landscape: true,
  },
  'sponsor-logo': {
    label: 'Sponsor logo',
    help: 'White or light-colored logo on a transparent background (it sits on dark navy). PNG or WebP, at least 600 px wide (1000 px or more is sharpest), up to 2 MB. Wide/horizontal logos work best.',
    minWidth: 600, minHeight: 100, maxBytes: 2 * 1024 * 1024, types: LOGO,
  },
  'club-logo': {
    label: 'Club logo',
    help: 'Square logo, 500 × 500 px recommended (at least 200 × 200 px). PNG with a transparent background works best (JPG or WebP also fine), up to 2 MB. Shown on white in the Clubs directory and the tournament’s “Hosted by” card.',
    minWidth: 200, minHeight: 200, maxBytes: 2 * 1024 * 1024, types: CLUB_LOGO,
  },
  'sponsor-image': {
    label: 'Product / background image',
    help: 'Square or portrait photo, 1000 × 1000 px recommended (at least 800 × 800 px). JPG, PNG or WebP, up to 5 MB. Shown on the right side of the sponsor card and fades into the left; keep the product centered.',
    minWidth: 800, minHeight: 800, maxBytes: 5 * 1024 * 1024, types: PHOTO,
  },
};

export const isImageKind = (k: unknown): k is TournamentImageKind => typeof k === 'string' && k in IMAGE_SPECS;
export const mb = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;
export const TOURNAMENT_IMAGE_BUCKET = 'tournament-images';
