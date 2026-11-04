'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ShieldCheck, ChevronDown } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Second-tier navigation shown under the site header for admins.      */
/* Top-level items are links or dropdown menus; dropdown entries can   */
/* have one level of sub-links (shown indented under their parent).    */
/* ------------------------------------------------------------------ */

/** `column: 2` puts an entry in the right-hand column of a wide dropdown */
export interface AdminLink { label: string; href: string; children?: AdminLink[]; column?: 1 | 2 }
export type AdminItem =
  | { label: string; href: string; items?: undefined }
  | { label: string; href?: undefined; items: AdminLink[]; wide?: boolean };

export const ADMIN_MENU: AdminItem[] = [
  { label: 'Dashboard', href: '/admin' },
  {
    label: 'User Management',
    items: [
      { label: 'Tournament Directors', href: '/admin/users/list?filter=director' },
      { label: 'Anglers', href: '/admin/users/list?filter=angler' },
      { label: 'Judges', href: '/admin/users/list?filter=judge' },
      { label: 'Advertisers', href: '/admin/partners' },
      { label: 'HOOX Sponsors', href: '/admin/sponsors' },
      { label: 'Clubs', href: '/admin/clubs' },
    ],
  },
  {
    label: 'Event Management',
    items: [
      { label: 'Tournaments', href: '/admin/tournaments', children: [{ label: 'Catch Submissions', href: '/admin/catch-submissions' }] },
      { label: 'Series', href: '/admin/series' },
      { label: 'Tradeshows & Expos', href: '/admin/events' },
    ],
  },
  {
    label: 'Marketing',
    wide: true,
    items: [
      {
        label: 'Display Banners', href: '/admin/advertising',
        children: [{ label: 'Customer Accounts', href: '/admin/marketing/banners/accounts' }, { label: 'Ad Revenue', href: '/admin/marketing/banners/revenue' }],
      },
      {
        label: 'Sponsor Programs', href: '/admin/marketing/sponsors',
        children: [{ label: 'Customer Accounts', href: '/admin/marketing/sponsors/accounts' }, { label: 'Brand Promotion Revenue', href: '/admin/marketing/sponsors/revenue' }],
      },
      {
        label: 'Affiliate Management', href: '/admin/marketing/affiliates',
        children: [{ label: 'Affiliate Accounts', href: '/admin/marketing/affiliates/accounts' }, { label: 'Affiliate Revenue', href: '/admin/marketing/affiliates/revenue' }],
      },
      {
        label: 'Featured Marketing', href: '/admin/marketing/featured', column: 2,
        children: [
          { label: 'Tournaments', href: '/admin/marketing/featured/tournaments' },
          { label: 'Series', href: '/admin/marketing/featured/series' },
          { label: 'Clubs', href: '/admin/marketing/featured/clubs' },
          { label: 'Tradeshows & Expos', href: '/admin/marketing/featured/expos' },
          { label: 'Customer Accounts', href: '/admin/marketing/featured/accounts' },
          { label: 'Featured Content Revenue', href: '/admin/marketing/featured/revenue' },
        ],
      },
    ],
  },
  { label: 'Support', href: '/admin/support' },
  { label: 'CMS', href: '/admin/cms' },
  { label: 'Settings', href: '/admin/settings' },
];

/** Flat list of every admin page in the menu (handy for search / tests) */
export const ADMIN_TABS = ADMIN_MENU.flatMap((i) => (i.items ? i.items.flatMap((l) => [l, ...(l.children || [])]) : [i]))
  .map((l) => ({ label: l.label, href: l.href! }));

const CLOSE_DELAY = 160;

export default function AdminNav() {
  const pathname = usePathname() || '';
  const params = useSearchParams();
  const search = params?.toString() ?? '';
  const [open, setOpen] = useState<string | null>(null);
  const [panelPos, setPanelPos] = useState<{ left: number; top: number } | null>(null);
  const [supportUnread, setSupportUnread] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedAt = useRef(0);

  useEffect(() => { setOpen(null); }, [pathname, search]);

  /* ---------------------------- active state ---------------------------- */
  const matches = useCallback((href: string) => {
    const [path, query] = href.split('?');
    if (path === '/admin') return pathname === '/admin';
    if (query) return pathname === path && new URLSearchParams(search).toString().includes(query);
    if (path === '/admin/users/list') return false;
    return pathname === path || pathname.startsWith(`${path}/`);
  }, [pathname, search]);
  // A link is "current" only if no more specific link in the menu matches
  const isCurrent = (href: string) => matches(href) && !ADMIN_TABS.some((t) => t.href !== href && t.href.length > href.length && t.href.startsWith(href.split('?')[0]) && matches(t.href));
  // Group highlight also covers related pages (e.g. a user's detail page under User Management)
  const inGroup = (href: string) => matches(href) || (href.includes('?') && pathname.startsWith(href.split('?')[0].replace(/\/list$/, '')));
  const itemActive = (item: AdminItem) =>
    item.items ? item.items.some((l) => inGroup(l.href) || l.children?.some((c) => inGroup(c.href))) : matches(item.href);

  /* ------------------------------ dropdowns ----------------------------- */
  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); closeTimer.current = null; };
  const place = (label: string) => {
    const btn = btnRefs.current[label];
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const nav = navRef.current?.getBoundingClientRect();
    setPanelPos({ left: r.left, top: (nav?.bottom ?? r.bottom) });
  };
  const openMenu = (label: string) => { cancelClose(); place(label); if (open !== label) openedAt.current = Date.now(); setOpen(label); };
  const scheduleClose = () => { cancelClose(); closeTimer.current = setTimeout(() => setOpen(null), CLOSE_DELAY); };

  // Keep the panel inside the viewport once it has a size
  useEffect(() => {
    if (!open || !panelRef.current || !panelPos) return;
    const w = panelRef.current.offsetWidth;
    const max = window.innerWidth - w - 12;
    if (panelPos.left > max) setPanelPos((p) => (p ? { ...p, left: Math.max(12, max) } : p));
  }, [open, panelPos]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !btnRefs.current[open]?.contains(t)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { btnRefs.current[open]?.focus(); setOpen(null); } };
    // Follow the button if the tab row scrolls or the window resizes
    const onMove = () => place(open);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, { passive: true });
    listRef.current?.addEventListener('scroll', onMove, { passive: true });
    const list = listRef.current;
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove);
      list?.removeEventListener('scroll', onMove);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // On narrow screens the bar scrolls; keep the current item in view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    if (el && listRef.current) {
      const list = listRef.current;
      list.scrollLeft = el.offsetLeft - (list.clientWidth - el.clientWidth) / 2;
    }
  }, [pathname, search]);

  /* -------------------------- support heartbeat ------------------------- */
  // Keeps the visitor-facing "We're online" dot green while an admin is signed in
  // (and set to Online), and fetches the unread count for the Support badge.
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
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, '');
    document.title = supportUnread ? `(${supportUnread}) ${base}` : base;
  }, [supportUnread, pathname]);

  const tabClass = (active: boolean) =>
    `relative flex h-[46px] items-center gap-1 whitespace-nowrap px-3 text-[14px] font-medium transition ${active ? 'text-white' : 'text-white/70 hover:text-white'}`;
  const underline = <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-[#22B3B5]" />;
  const openItem = ADMIN_MENU.find((i) => i.label === open && i.items) as Extract<AdminItem, { items: AdminLink[] }> | undefined;

  const linkClass = (href: string, sub = false) => {
    const cur = isCurrent(href);
    return `flex items-center rounded-md px-3 transition ${sub ? 'py-1.5 pl-6 text-[13.5px]' : 'py-2 text-[14.5px] font-semibold'} ${
      cur ? 'bg-[#E6F4F5] text-[#0B6564]' : sub ? 'text-[#4A5B76] hover:bg-[#F2F7FA] hover:text-[#0D1B4C]' : 'text-[#0D1B4C] hover:bg-[#F2F7FA]'}`;
  };

  return (
    <nav ref={navRef} aria-label="Admin" className="relative bg-[#0A2A47]">
      <div className="mx-auto flex max-w-[1440px] items-stretch gap-4 px-4 md:px-5">
        <span className="hidden md:flex flex-shrink-0 items-center gap-1.5 pr-4 border-r border-white/15 font-montserrat text-[12px] font-bold uppercase tracking-[0.12em] text-[#22B3B5]">
          <ShieldCheck className="h-4 w-4" aria-hidden /> Admin
        </span>
        <ul ref={listRef} className="relative scrollbar-hide flex flex-1 items-stretch gap-1 overflow-x-auto xl:justify-between">
          {ADMIN_MENU.map((item) => {
            const active = itemActive(item);
            if (!item.items) {
              return (
                <li key={item.label} className="flex" data-active={active || undefined}>
                  <Link href={item.href} aria-current={active ? 'page' : undefined} className={tabClass(active)}>
                    {item.label}
                    {item.href === '/admin/support' && supportUnread > 0 && (
                      <span className="ml-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E5484D] px-1 text-[11px] font-bold text-white" aria-label={`${supportUnread} unread`}>{supportUnread}</span>
                    )}
                    {active && underline}
                  </Link>
                </li>
              );
            }
            const isOpen = open === item.label;
            return (
              <li key={item.label} className="flex" data-active={active || undefined}
                onMouseEnter={(e) => { if (window.matchMedia('(hover: hover)').matches && e.currentTarget) openMenu(item.label); }}
                onMouseLeave={() => { if (window.matchMedia('(hover: hover)').matches) scheduleClose(); }}>
                <button
                  ref={(el) => { btnRefs.current[item.label] = el; }}
                  type="button"
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  aria-controls={isOpen ? 'admin-menu-panel' : undefined}
                  onClick={() => (isOpen && Date.now() - openedAt.current > 400 ? setOpen(null) : openMenu(item.label))}
                  onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); openMenu(item.label); requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>('a')?.focus()); } }}
                  className={tabClass(active || isOpen)}
                >
                  {item.label}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2.25} aria-hidden />
                  {active && underline}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Dropdown panel (fixed, so the scrolling tab row can't clip it) */}
      {openItem && panelPos && (
        <div
          id="admin-menu-panel"
          ref={panelRef}
          role="menu"
          aria-label={openItem.label}
          onMouseEnter={cancelClose}
          onMouseLeave={() => { if (window.matchMedia('(hover: hover)').matches) scheduleClose(); }}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
            e.preventDefault();
            const links = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('a') || []);
            const i = links.indexOf(document.activeElement as HTMLElement);
            links[(i + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length]?.focus();
          }}
          style={{ left: panelPos.left, top: panelPos.top }}
          className={`fixed z-[1150] mt-1 max-w-[calc(100vw-24px)] rounded-lg border border-[#E3EAF1] bg-white p-2 shadow-[0_14px_36px_rgba(10,30,60,0.22)] ${openItem.wide ? 'w-[560px]' : 'w-[260px]'}`}
        >
          {(() => {
            const renderItem = (l: AdminLink) => (
                <li key={l.href} className={openItem.wide ? 'rounded-md p-1' : ''}>
                  <Link href={l.href} role="menuitem" onClick={() => setOpen(null)} aria-current={isCurrent(l.href) ? 'page' : undefined} className={linkClass(l.href)}>
                    {l.label}
                  </Link>
                  {l.children && (
                    <ul className="mt-0.5 space-y-0.5 border-l border-[#E3EAF1] ml-3">
                      {l.children.map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} role="menuitem" onClick={() => setOpen(null)} aria-current={isCurrent(c.href) ? 'page' : undefined} className={linkClass(c.href, true)}>
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
            );
            if (!openItem.wide) return <ul className="space-y-0.5">{openItem.items.map(renderItem)}</ul>;
            const cols = [openItem.items.filter((l) => l.column !== 2), openItem.items.filter((l) => l.column === 2)];
            return (
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {cols.map((col, i) => (
                  <ul key={i} className="space-y-1">{col.map(renderItem)}</ul>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </nav>
  );
}
