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
 * Paid advertiser banner in the mega menu (250 × 250 px).
 * Set `image` (and `href`) when an advertiser books the spot; while it's
 * null the menu shows an "Advertise here" placeholder that links to the
 * banner advertising page.
 */
export const MEGA_MENU_AD: { image: string; href: string; alt: string } | null = null;
