'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

/** Second-tier navigation shown under the site header for signed-in admins. */
export const ADMIN_TABS = [
  { label: 'Dashboard',         href: '/admin' },
  { label: 'Support',           href: '/admin/support' },
  { label: 'Users',             href: '/admin/users' },
  { label: 'Clubs',             href: '/admin/clubs' },
  { label: 'Series',            href: '/admin/series' },
  { label: 'Tournaments',       href: '/admin/tournaments' },
  { label: 'Events',            href: '/admin/events' },
  { label: 'Catch Submissions', href: '/admin/catch-submissions' },
  { label: 'Advertising',       href: '/admin/advertising' },
  { label: 'Monetization',      href: '/admin/monetization' },
  { label: 'CMS',               href: '/admin/cms' },
  { label: 'Settings',          href: '/admin/settings' },
];

export default function AdminNav() {
  const pathname = usePathname() || '';
  const listRef = useRef<HTMLUListElement>(null);
  const [supportUnread, setSupportUnread] = useState(0);

  // Support heartbeat: keeps the visitor-facing "We're online" dot green while an
  // admin is signed in (and set to Online), and fetches the unread count for the badge.
  useEffect(() => {
    let stopped = false;
    const beat = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const r = await fetch('/api/admin/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        if (!r.ok) return;
        const j = await r.json();
        if (!stopped && typeof j.unread === 'number') setSupportUnread(j.unread);
      } catch { /* try again next beat */ }
    };
    beat();
    const t = setInterval(beat, 30_000);
    const onVis = () => { if (document.visibilityState === 'visible') beat(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { stopped = true; clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  // Show new support messages in the browser tab title too
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, '');
    document.title = supportUnread ? `(${supportUnread}) ${base}` : base;
  }, [supportUnread, pathname]);

  // On narrow screens the tab row scrolls; keep the current tab in view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (el && listRef.current) {
      const list = listRef.current;
      list.scrollLeft = el.offsetLeft - (list.clientWidth - el.clientWidth) / 2;
    }
  }, [pathname]);
  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Admin" className="bg-[#0A2A47]">
      <div className="mx-auto flex max-w-[1440px] items-stretch gap-4 px-4 md:px-5">
        <span className="hidden md:flex flex-shrink-0 items-center gap-1.5 pr-4 border-r border-white/15 font-montserrat text-[12px] font-bold uppercase tracking-[0.12em] text-[#22B3B5]">
          <ShieldCheck className="h-4 w-4" aria-hidden /> Admin
        </span>
        <ul ref={listRef} className="relative scrollbar-hide flex flex-1 items-stretch gap-1 overflow-x-auto xl:justify-between">
          {ADMIN_TABS.map((t) => {
            const active = isActive(t.href);
            return (
              <li key={t.href} className="flex">
                <Link
                  href={t.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex h-[46px] items-center whitespace-nowrap px-3 text-[14px] font-medium transition ${
                    active ? 'text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {t.label}
                  {t.href === '/admin/support' && supportUnread > 0 && (
                    <span className="ml-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E5484D] px-1 text-[11px] font-bold text-white" aria-label={`${supportUnread} unread`}>{supportUnread}</span>
                  )}
                  {active && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-[#22B3B5]" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
