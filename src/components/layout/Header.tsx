'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toPath } from '@/lib/routes';
import { Menu, X, ChevronDown } from 'lucide-react';
import { User } from '@/types';
import { MEGA_MENU_AD } from '@/lib/navLinks';

interface HeaderProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

// Primary nav — "Get Hoox!" links to sign-up; the rest open the mega menu
// and match its columns, in the same order.
const PRIMARY_NAV = [
  { view: 'register', label: 'Get Hoox!' },
  { view: 'tournaments', label: 'Tournaments' },
  { view: 'events', label: 'Events' },
  { view: 'clubs', label: 'Clubs' },
  { view: 'support', label: 'Support' },
  { view: 'advertise', label: 'Advertise with us' },
];

/* ------------------------------------------------------------------ */
/* Mega menu — one shared panel, opened by hovering (or focusing)       */
/* any nav item except Get Hoox!. Five columns.                        */
/* ------------------------------------------------------------------ */
type MegaLink = { href: string; label: string };
type MegaSection = { title: string; links: MegaLink[] };
/** A column holds one or more titled sections */
type MegaColumn = MegaSection[];

const MEGA_COLUMNS: MegaColumn[] = [
  [{
    title: 'Tournaments',
    links: [
      { href: '/tournaments', label: 'Tournaments' },
      { href: '/series', label: 'Series' },
      { href: '/leaderboards', label: 'Leaderboards' },
      { href: '/search?type=tournaments', label: 'Search' },
      { href: '/calendar', label: 'Calendar' },
      { href: '/tournaments/submit', label: 'Submit a Listing' },
    ],
  }],
  [{
    title: 'Events',
    links: [
      { href: '/events', label: 'Expos and Trade Shows' },
      { href: '/events/activities', label: 'Activities' },
      { href: '/events', label: 'Event Calendar' },
      { href: '/events/submit', label: 'Submit your Event' },
    ],
  }],
  [{
    title: 'Clubs',
    links: [
      { href: '/clubs', label: 'Search Clubs' },
      { href: '/clubs?view=map', label: 'View Club Map' },
      { href: '/clubs', label: 'View Directory' },
      { href: '/clubs/feature', label: 'Feature your Club' },
    ],
  }],
  [
    {
      title: 'Support',
      links: [
        { href: '/faq', label: 'FAQ' },
        { href: '/contact', label: 'Contact Us' },
        { href: '/features', label: 'App Features' },
      ],
    },
  ],
];

/** Nav items that open the mega menu */
const MEGA_TRIGGERS = new Set(['tournaments', 'events', 'clubs', 'support', 'advertise']);

/** Menu-only items: clicking just opens/closes the mega menu instead of navigating */
const MENU_ONLY = MEGA_TRIGGERS;

/** Column highlighted (light blue) when the menu is opened from that nav item */
// 0 Tournaments · 1 Events · 2 Clubs · 3 Support · 4 advertiser banner spot
const MEGA_FOCUS_COLUMN: Record<string, number> = { tournaments: 0, events: 1, clubs: 2, support: 3, advertise: 4 };

const MEGA_CLOSE_DELAY = 150; // ms — lets the pointer travel from the nav item into the panel

export function HooxLogo({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="HOOX home"
      className="flex items-center gap-1.5 flex-shrink-0 hover:opacity-90 transition"
    >
      <img src="/home/hoox-mark.png" alt="" className="h-[60px] w-auto -ml-1" />
      <span className="font-montserrat text-[33px] font-bold leading-none tracking-[0.04em] text-[#0E2A47]">HOOX</span>
    </button>
  );
}

export default function Header({ currentUser, onNavigate, onLogout }: HeaderProps) {
  const pathname = usePathname();
  // Highlight the current section (e.g. Register on /register, Tournaments on /tournaments/...)
  const isActive = (view: string) => {
    const path = toPath(view);
    return path !== '/' && (pathname === path || pathname.startsWith(`${path}/`));
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Which trigger opened the shared mega menu (null = closed)
  const [mega, setMega] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const openMega = (key: string) => {
    cancelClose();
    setMega(key);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setMega(null), MEGA_CLOSE_DELAY);
  };

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMega(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMega(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      cancelClose();
    };
  }, []);

  // Close any open menu on route change
  useEffect(() => setMega(null), [pathname]);

  const go = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    setMega(null);
  };

  return (
    <header className="font-roboto bg-white/95 backdrop-blur border-b border-[#E8EEF4] shadow-[0_1px_8px_rgba(15,40,80,0.05)] sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-4 md:px-5">
        <div className="flex items-center justify-between gap-6 h-[76px]">
          <HooxLogo onClick={() => go('home')} />

          {!currentUser ? (
            <>
              {/* Desktop navigation — Tournaments, Calendar, Sponsors and More open a mega menu on hover */}
              <nav
                ref={navRef}
                onMouseLeave={scheduleClose}
                onMouseEnter={cancelClose}
                className="hidden xl:flex flex-1 justify-center items-center gap-5 2xl:gap-9 self-stretch"
                aria-label="Main"
              >
                {PRIMARY_NAV.map((item) => {
                  const active = isActive(item.view);
                  const hasMega = MEGA_TRIGGERS.has(item.view);
                  const open = mega === item.view;
                  return (
                    <div
                      key={item.view}
                      className="flex h-full items-center"
                      onMouseEnter={() => (hasMega ? openMega(item.view) : setMega(null))}
                      onFocus={() => hasMega && openMega(item.view)}
                    >
                      <button
                        onClick={() => (MENU_ONLY.has(item.view) ? openMega(item.view) : go(item.view))}
                        aria-current={active ? 'page' : undefined}
                        aria-expanded={hasMega ? open : undefined}
                        aria-controls={hasMega ? 'mega-menu' : undefined}
                        className={`relative flex items-center gap-1 py-1 text-[16px] transition whitespace-nowrap ${active || open ? 'text-hoox-brand' : 'text-hoox-link hover:text-hoox-brand'}`}
                      >
                        {item.label}
                        {hasMega && <ChevronDown aria-hidden className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />}
                        {(active || open) && <span className="absolute inset-x-0 -bottom-[6px] h-[3px] rounded-full bg-hoox-ui" />}
                      </button>
                    </div>
                  );
                })}

                {/* Full-width panel under the header */}
                {mega && (
                  <div
                    id="mega-menu"
                    role="region"
                    aria-label="Site menu"
                    className="absolute inset-x-0 top-full border-b border-[#E8EEF4] bg-white shadow-[0_12px_24px_rgba(15,40,80,0.10)]"
                  >
                    <div className="mx-auto grid max-w-[1440px] grid-cols-[repeat(4,minmax(0,1fr))_282px] gap-4 px-1 pb-4 pt-3">
                      {MEGA_COLUMNS.map((col, ci) => (
                        <div
                          key={col[0].title}
                          className={`space-y-6 rounded-lg p-4 transition-colors ${MEGA_FOCUS_COLUMN[mega] === ci ? 'bg-[#EAF4FB]' : ''}`}
                        >
                          {col.map((sec) => (
                            <div key={sec.title}>
                              <p className="font-montserrat text-[15px] font-bold text-[#0D1B4C]">{sec.title}</p>
                              <ul className="mt-3 space-y-[2px]">
                                {sec.links.map((l) => (
                                  <li key={l.label}>
                                    <Link
                                      href={l.href}
                                      onClick={() => setMega(null)}
                                      className="-mx-2 block rounded-md px-2 py-[7px] text-[15px] text-hoox-link transition hover:bg-hoox-light hover:text-hoox-brand"
                                    >
                                      {l.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ))}

                      {/* Paid advertiser banner — 250 × 250 */}
                      <div className={`rounded-lg p-4 transition-colors ${MEGA_FOCUS_COLUMN[mega] === 4 ? 'bg-[#EAF4FB]' : ''}`}>
                        {MEGA_MENU_AD ? (
                          <a
                            href={MEGA_MENU_AD.href}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            onClick={() => setMega(null)}
                            className="block h-[250px] w-[250px] overflow-hidden rounded-md"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={MEGA_MENU_AD.image} alt={MEGA_MENU_AD.alt} width={250} height={250} className="h-full w-full object-cover" />
                          </a>
                        ) : (
                          <Link
                            href="/advertise/banners"
                            onClick={() => setMega(null)}
                            className="flex h-[250px] w-[250px] flex-col items-center justify-center rounded-md border-2 border-dashed border-[#B9CCDC] bg-[#F5F8FA] px-6 text-center transition hover:border-hoox-ui hover:bg-[#EEF7F8]"
                          >
                            <span className="font-montserrat text-[18px] font-bold text-[#0D1B4C]">Your ad here</span>
                            <span className="mt-1 text-[13px] text-[#7A8BA3]">250 × 250 banner</span>
                            <span className="mt-4 text-[14px] font-semibold text-[#0E7C7B]">Advertise with us →</span>
                          </Link>
                        )}
                        <p className="mt-1.5 text-[11px] uppercase tracking-[0.06em] text-[#9AA8B8]">Sponsored</p>
                      </div>
                    </div>
                  </div>
                )}
              </nav>

              <div className="hidden xl:flex flex-shrink-0 items-center">
                {/* One login for everyone — the account type comes from the user's credentials */}
                <button
                  onClick={() => go('login')}
                  className="h-[38px] px-8 2xl:px-10 rounded-md bg-gradient-to-b from-[#077A92] to-[#02566E] text-white text-[15px] font-medium shadow-sm hover:brightness-110 transition whitespace-nowrap"
                >
                  Log In
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                className="xl:hidden p-2 text-hoox-navy hover:bg-hoox-light rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-hoox-text hidden sm:inline">
                Welcome, <span className="font-semibold">{currentUser.name}</span>
              </span>
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => onNavigate('admin-dashboard')}
                  className="h-[38px] px-5 rounded-md bg-hoox-navy text-white font-medium text-sm hover:bg-[#03385E] transition"
                >
                  Dashboard
                </button>
              )}
              <button
                onClick={onLogout}
                className="h-[38px] px-5 rounded-md border border-[#DDE3EA] text-hoox-navy font-medium text-sm hover:bg-hoox-light transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {!currentUser && mobileMenuOpen && (
          <div className="xl:hidden border-t border-hoox-line py-4 space-y-1">
            <button
              onClick={() => go('register')}
              className="w-full text-left px-3 py-2.5 text-[15px] font-semibold text-hoox-link hover:bg-hoox-light hover:text-hoox-brand rounded-lg"
            >
              Get Hoox!
            </button>
            {/* Same groups as the desktop mega menu */}
            {MEGA_COLUMNS.flat().map((sec) => (
              <div key={sec.title} className="pt-2">
                <p className="px-3 pb-1 font-montserrat text-[13px] font-bold uppercase tracking-[0.04em] text-[#7A8BA3]">{sec.title}</p>
                {sec.links.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-[15px] text-hoox-link hover:bg-hoox-light hover:text-hoox-brand rounded-lg"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
            <div className="pt-3 border-t border-hoox-line mt-2">
              <button onClick={() => go('login')} className="w-full h-[42px] rounded-md bg-gradient-to-b from-[#077A92] to-[#02566E] text-white font-medium text-[15px]">
                Log In
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
