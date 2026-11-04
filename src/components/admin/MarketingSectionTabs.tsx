'use client';

/* ------------------------------------------------------------------ */
/* Section tabs for Admin → Marketing, shown under each page's title. */
/* Every page in a section shows the same tab row (Overview + its      */
/* sub-pages), so moving between                                       */
/* Display Banners, Marketing Promotions, Sponsor Programs and         */
/* Affiliate Management pages works the same way everywhere.          */
/* ------------------------------------------------------------------ */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SectionTab { label: string; href: string }
interface Section { label: string; tabs: SectionTab[]; /** extra paths that belong to a tab (detail pages) */ also?: Record<string, string> }

export const MARKETING_SECTIONS: Section[] = [
  {
    label: 'Display Banners',
    tabs: [
      { label: 'Overview', href: '/admin/advertising' },
      { label: 'Customer Accounts', href: '/admin/marketing/banners/accounts' },
      { label: 'Ad Revenue', href: '/admin/marketing/banners/revenue' },
    ],
  },
  {
    label: 'Sponsor Programs',
    tabs: [
      { label: 'Overview', href: '/admin/marketing/sponsors' },
      { label: 'Brand Promotions', href: '/admin/marketing/sponsors/promotions' },
      { label: 'Packages & Pricing', href: '/admin/marketing/sponsors/packages' },
      { label: 'Customer Accounts', href: '/admin/marketing/sponsors/accounts' },
      { label: 'Brand Promotion Revenue', href: '/admin/marketing/sponsors/revenue' },
    ],
  },
  {
    label: 'Affiliate Management',
    tabs: [
      { label: 'Overview', href: '/admin/marketing/affiliates' },
      { label: 'Affiliate Accounts', href: '/admin/marketing/affiliates/accounts' },
      { label: 'Affiliate Revenue', href: '/admin/marketing/affiliates/revenue' },
    ],
  },
  {
    label: 'Marketing Promotions',
    tabs: [
      { label: 'Overview', href: '/admin/marketing/featured' },
      { label: 'Tournaments', href: '/admin/marketing/featured/tournaments' },
      { label: 'Series', href: '/admin/marketing/featured/series' },
      { label: 'Clubs', href: '/admin/marketing/featured/clubs' },
      { label: 'Tradeshows & Expos', href: '/admin/marketing/featured/expos' },
      { label: 'Customer Accounts', href: '/admin/marketing/featured/accounts' },
      { label: 'Featured Content Revenue', href: '/admin/marketing/featured/revenue' },
    ],
  },
];

const clean = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p);

export function sectionFor(pathname: string) {
  const p = clean(pathname);
  return MARKETING_SECTIONS.find((s) => s.tabs.some((t) => t.href === p));
}

/** Renders nothing on pages outside the Marketing sections */
export default function MarketingSectionTabs() {
  const pathname = clean(usePathname() || '');
  const section = sectionFor(pathname);
  if (!section) return null;
  return (
    <nav aria-label={`${section.label} pages`} className="mb-6">
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <ul className="flex min-w-max gap-1 border-b border-[#E3EAF1]">
          {section.tabs.map((t) => {
            const current = t.href === pathname;
            return (
              <li key={t.href}>
                <Link href={t.href} aria-current={current ? 'page' : undefined}
                  className={`-mb-px block whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${current ? 'border-[#0E7C7B] text-[#0E7C7B]' : 'border-transparent text-[#5F6F86] hover:text-[#2E3F5C]'}`}>
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
