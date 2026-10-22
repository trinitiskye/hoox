'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Search, ChevronDown } from 'lucide-react';
import { User } from '@/types';

interface HeaderProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

// Primary nav — matches the Home mock (Register, Tournaments, Calendar, Sponsors)
const PRIMARY_NAV = [
  { view: 'register', label: 'Register' },
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

export function HooxLogo({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="HOOX Tournament App home"
      className="flex items-center gap-1.5 flex-shrink-0 hover:opacity-90 transition"
    >
      <img src="/home/hoox-mark.png" alt="" className="h-[60px] w-auto -ml-1" />
      <span className="flex flex-col items-start leading-none font-montserrat">
        <span className="text-[33px] font-bold tracking-[0.04em] text-[#0E2A47]">HOOX</span>
        <span className="mt-[3px] text-[12.5px] font-medium tracking-[0.2em] text-[#14889A] whitespace-nowrap">
          TOURNAMENT <span className="font-bold text-[#141B7A]">APP</span>
        </span>
      </span>
    </button>
  );
}

export default function Header({ currentUser, onNavigate, onLogout }: HeaderProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [query, setQuery] = useState('');
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const go = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    setMoreOpen(false);
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
              {/* Desktop navigation */}
              <nav className="hidden xl:flex flex-shrink-0 items-center gap-5 2xl:gap-9 ml-2 2xl:ml-6" aria-label="Main">
                {PRIMARY_NAV.map((item) => (
                  <button
                    key={item.view}
                    onClick={() => go(item.view)}
                    className="text-[16px] text-hoox-link hover:text-hoox-brand transition whitespace-nowrap"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="relative" ref={moreRef}>
                  <button
                    onClick={() => setMoreOpen((o) => !o)}
                    aria-expanded={moreOpen}
                    aria-haspopup="menu"
                    className="flex items-center gap-1 text-[16px] text-hoox-link hover:text-hoox-brand transition"
                  >
                    More <ChevronDown className={`w-4 h-4 transition ${moreOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {moreOpen && (
                    <div role="menu" className="absolute left-1/2 -translate-x-1/2 mt-3 w-52 rounded-lg border border-hoox-line bg-white py-2 shadow-lg">
                      {MORE_NAV.map((item) => (
                        <button
                          key={item.view}
                          role="menuitem"
                          onClick={() => go(item.view)}
                          className="block w-full text-left px-4 py-2 text-[15px] text-hoox-link hover:bg-hoox-light hover:text-hoox-brand"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
