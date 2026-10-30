// Links shared by the header and footer.

export type NavLink = { href: string; label: string };

/** "Advertise with us!" — shown in the footer (moved out of the mega menu) */
export const ADVERTISE_LINKS: NavLink[] = [
  { href: '/advertise/featured-listings', label: 'Featured Listings' },
  { href: '/advertise/banners', label: 'Digital Banner Advertising' },
  { href: '/advertise/affiliates', label: 'Affiliate Programs' },
  { href: '/partner', label: 'Become a Partner' },
];

/**
 * Paid advertiser banner in the mega menu (250 × 250 px; supply artwork at
 * 500 × 500 for sharp screens). `label` is the web address shown under the
 * banner. Set to null to show the "Advertise here" placeholder instead.
 */
export const MEGA_MENU_AD: { image: string; href: string; alt: string; label: string } | null = {
  image: '/ads/sierra-etch-250x250.png',
  href: 'https://www.sierraetchlaserartandengraving.com',
  alt: 'Sierra Etch — Laser Art & Engraving, Northern California',
  label: 'www.sierraetchlaserartandengraving.com',
};

/**
 * App store links for the "Download the app" page. While null, the store
 * buttons show "Coming soon" — paste the store URLs here once the iOS and
 * Android apps are published.
 */
export const APP_STORE_URL: string | null = null; // e.g. https://apps.apple.com/app/hoox/id0000000000
export const PLAY_STORE_URL: string | null = null; // e.g. https://play.google.com/store/apps/details?id=app.hoox
