'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toPath } from '@/lib/routes';
import { Menu, X, Search, ChevronDown } from 'lucide-react';
import { User } from '@/types';

interface HeaderProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

// Primary nav — matches the Home mock (Get Hoox!, Tournaments, Calendar, Sponsors)
const PRIMARY_NAV = [
  { view: 'register', label: 'Get Hoox!' },
  { view: 'tournaments', label: 'Tournaments' },
  { view: 'calendar', label: 'Calendar' },
  { view: 'sponsors', label: 'Sponsors' },
];

// Existing nav items kept under "More" so nothing is lost
const MORE_NAV = [
  { view: 'series', label: 'Series' },
  { view: 'clubs', label: 'Clubs' },
  { view: 'events', label: 'Events' },
  { view: 'features', label: 'App Features' },
  { view: 'sponsor', label: 'Become a Partner' },
];

/* ------------------------------------------------------------------ */
/* Mega menus — open on hover (or keyboard focus) for these nav items.  */
/* Content is placeholder until the final menu content is supplied.    */
/* ------------------------------------------------------------------ */
type MegaLink = { view: string; label: string; description?: string };
type MegaColumn = { title: string; links: MegaLink[] };

const MEGA_MENUS: Record<string, MegaColumn[]> = {
  tournaments: [
    { title: 'Tournaments', links: [{ view: 'tournaments', label: 'All Tournaments', description: 'Browse upcoming and live events' }] },
  ],
  calendar: [
    { title: 'Calendar', links: [{ view: 'calendar', label: 'Tournament Calendar', description: 'See what’s coming up' }] },
  ],
  sponsors: [
    { title: 'Sponsors', links: [{ view: 'sponsors', label: 'Our Sponsors', description: 'The brands that support HOOX' }] },
  ],
  more: [{ title: 'More', links: MORE_NAV }],
};

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
  const router = useRouter();
  const pathname = usePathname();
  // Highlight the current section (e.g. Register on /register, Tournaments on /tournaments/...)
  const isActive = (view: string) => {
    const path = toPath(view);
    return path !== '/' && (pathname === path || pathname.startsWith(`${path}/`));
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mega, setMega] = useState<string | null>(null);
  const [query, setQuery] = useState('');
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

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?type=tournaments&q=${encodeURIComponent(query.trim())}`);
    setMobileMenuOpen(false);
  };

  const searchField = (extra = '') => (
    <form onSubmit={submitSearch} role="search" className={`relative ${extra}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[22px] h-[22px] text-[#1F2D3D]" strokeWidth={1.75} />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tournaments..."
        aria-label="Search tournaments"
        className="w-full h-[42px] pl-12 pr-4 rounded-md border border-[#DDE3EA] bg-[#F7F9FB] text-[15px] text-hoox-text placeholder:text-[#8A96A6] focus:outline-none focus:ring-2 focus:ring-hoox-ui/50 focus:border-hoox-ui"
      />
    </form>
  );

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
                className="hidden xl:flex flex-shrink-0 items-center gap-5 2xl:gap-9 ml-2 2xl:ml-6 self-stretch"
                aria-label="Main"
              >
                {[...PRIMARY_NAV, { view: 'more', label: 'More' }].map((item) => {
                  const active = isActive(item.view);
                  const hasMega = !!MEGA_MENUS[item.view];
                  const open = mega === item.view;
                  return (
                    <div
                      key={item.view}
                      className="flex h-full items-center"
                      onMouseEnter={() => (hasMega ? openMega(item.view) : setMega(null))}
                      onFocus={() => hasMega && openMega(item.view)}
                    >
                      <button
                        onClick={() => (item.view === 'more' ? setMega(open ? null : 'more') : go(item.view))}
                        aria-current={active ? 'page' : undefined}
                        aria-expanded={hasMega ? open : undefined}
                        aria-controls={hasMega ? `mega-${item.view}` : undefined}
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
                {mega && MEGA_MENUS[mega] && (
                  <div
                    id={`mega-${mega}`}
                    role="region"
                    aria-label={`${mega === 'more' ? 'More' : PRIMARY_NAV.find((n) => n.view === mega)?.label} menu`}
                    className="absolute inset-x-0 top-full border-b border-[#E8EEF4] bg-white shadow-[0_12px_24px_rgba(15,40,80,0.10)]"
                  >
                    <div className="mx-auto grid max-w-[1440px] grid-cols-4 gap-8 px-5 py-6">
                      {MEGA_MENUS[mega].map((col) => (
                        <div key={col.title}>
                          <p className="font-montserrat text-[13px] font-bold uppercase tracking-[0.06em] text-[#7A8BA3]">{col.title}</p>
                          <ul className="mt-3 space-y-1">
                            {col.links.map((l) => (
                              <li key={l.view + l.label}>
                                <button
                                  onClick={() => go(l.view)}
                                  className="-mx-3 block w-[calc(100%+24px)] rounded-md px-3 py-2 text-left hover:bg-hoox-light"
                                >
                                  <span className="block text-[15px] font-medium text-hoox-link">{l.label}</span>
                                  {'description' in l && l.description && (
                                    <span className="mt-0.5 block text-[13px] text-[#5F7896]">{l.description}</span>
                                  )}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </nav>

              <div className="hidden xl:flex items-center gap-3 2xl:gap-4 flex-1 justify-end min-w-0">
                {searchField('flex-1 max-w-[306px] min-w-[150px]')}
                <button
                  onClick={() => go('login')}
                  className="h-[38px] px-5 2xl:px-6 rounded-md bg-hoox-navy text-white text-[15px] font-medium shadow-sm hover:bg-[#03385E] transition whitespace-nowrap"
                >
                  Director Login
                </button>
                <button
                  onClick={() => go('login')}
                  className="h-[38px] px-6 2xl:px-10 rounded-md bg-gradient-to-b from-[#077A92] to-[#02566E] text-white text-[15px] font-medium shadow-sm hover:brightness-110 transition whitespace-nowrap"
                >
                  Angler Login
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
            {searchField('mb-3')}
            {[...PRIMARY_NAV, ...MORE_NAV].map((item) => (
              <button
                key={item.view + item.label}
                onClick={() => go(item.view)}
                className="w-full text-left px-3 py-2.5 text-[15px] text-hoox-link hover:bg-hoox-light hover:text-hoox-brand rounded-lg"
              >
                {item.label}
              </button>
            ))}
            <div className="flex gap-3 pt-3 border-t border-hoox-line mt-2">
              <button onClick={() => go('login')} className="flex-1 h-[40px] rounded-md bg-hoox-navy text-white font-medium text-sm">
                Director Login
              </button>
              <button onClick={() => go('login')} className="flex-1 h-[40px] rounded-md bg-gradient-to-b from-[#077A92] to-[#02566E] text-white font-medium text-sm">
                Angler Login
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
