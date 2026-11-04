'use client';

/* ------------------------------------------------------------------ */
/* Admin → Marketing → Marketing Promotions                   */
/*   FeaturedOverview   all four listing types at a glance             */
/*   FeaturedTypePage   one type: Requests | Pricing | Revenue tabs    */
/*   FeaturedCustomers  customer accounts built from placements        */
/* ------------------------------------------------------------------ */

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, Trophy, Layers, Users, CalendarDays, Search, Mail } from 'lucide-react';
import FeaturedRequestsManager from './FeaturedRequestsManager';
import FeaturePricingEditor from './FeaturePricingEditor';
import FeaturedRevenue, { usePlacements } from './FeaturedRevenue';
import { computeInsights } from '@/lib/featuredInsights';
import { LISTING_TYPES, TYPE_META, PLACEMENT_META, formatMoney, isActivePlacement, priceOf, type ListingType, type DbFeaturedRequest } from '@/lib/featured';

const ICON: Record<ListingType, typeof Trophy> = { tournament: Trophy, series: Layers, club: Users, event: CalendarDays };
const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function Header({ title, sub, right }: { title: string; sub: string; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C]">{title}</h2>
        <p className="mt-0.5 text-sm text-[#5F6F86]">{sub}</p>
      </div>
      {right}
    </div>
  );
}

/* ------------------------------ overview ----------------------------- */

export function FeaturedOverview() {
  const { rows, error } = usePlacements();
  const ins = useMemo(() => (rows ? computeInsights(rows) : null), [rows]);
  const recent = (rows || []).filter((r) => r.status === 'new' || r.status === 'in_review').slice(0, 8);

  return (
    <div>
      <Header title="Marketing Promotions" sub="Featured listings and page heroes for tournaments, series, clubs and tradeshows"
        right={<Link href="/admin/marketing/featured/revenue" className="flex items-center gap-1.5 text-sm font-semibold text-[#0E7C7B] hover:underline">Revenue insights <ArrowRight className="h-4 w-4" /></Link>} />
      {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {!ins ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#5F6F86]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {LISTING_TYPES.map((t) => {
              const Icon = ICON[t];
              const d = ins.byType.find((x) => x.type === t)!;
              const of = (rows || []).filter((r) => r.listing_type === t && isActivePlacement(r));
              return (
                <li key={t}>
                  <Link href={`/admin/marketing/featured/${TYPE_META[t].slug}`} className="group block h-full rounded-lg border border-[#E8EEF4] bg-white p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)] transition hover:border-[#9FD3D3] hover:shadow-[0_6px_18px_rgba(10,30,60,0.1)]">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E6F4F5] text-[#0E7C7B]"><Icon className="h-5 w-5" /></span>
                      <span className="font-montserrat text-[17px] font-bold text-[#0D1B4C]">{TYPE_META[t].plural}</span>
                      <ArrowRight className="ml-auto h-4 w-4 text-[#8A9AB0] transition group-hover:translate-x-0.5 group-hover:text-[#0E7C7B]" />
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div><dt className="text-xs text-[#6B7D93]">Booked</dt><dd className="font-semibold text-[#0D1B4C]">{formatMoney(d.booked)}</dd></div>
                      <div><dt className="text-xs text-[#6B7D93]">Awaiting review</dt><dd className={`font-semibold ${d.pending ? 'text-[#C4560E]' : 'text-[#0D1B4C]'}`}>{d.pending}</dd></div>
                      <div><dt className="text-xs text-[#6B7D93]">Live heroes</dt><dd className="font-semibold text-[#0D1B4C]">{of.filter((r) => r.placement === 'hero').length}</dd></div>
                      <div><dt className="text-xs text-[#6B7D93]">Live listings</dt><dd className="font-semibold text-[#0D1B4C]">{of.filter((r) => r.placement === 'badge').length}</dd></div>
                    </dl>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <section className="rounded-lg border border-[#E8EEF4] bg-white p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
              <h3 className="font-semibold text-[#0D1B4C]">Awaiting review</h3>
              {recent.length === 0 ? <p className="mt-3 text-sm text-[#8A9AB0]">No requests waiting. Nice.</p> : (
                <ul className="mt-3 divide-y divide-[#EEF3F8] text-sm">
                  {recent.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                      <span className="min-w-0">
                        <Link href={`/admin/marketing/featured/${TYPE_META[r.listing_type].slug}`} className="block truncate font-medium text-[#0D1B4C] hover:underline">{r.club_name}</Link>
                        <span className="block text-xs text-[#6B7D93]">{TYPE_META[r.listing_type].label} · {PLACEMENT_META[r.placement].label} · {r.plan_name || r.plan} · {fmt(r.created_at)}</span>
                      </span>
                      <span className="flex-shrink-0 font-semibold text-[#0D1B4C]">{formatMoney(priceOf(r))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="rounded-lg border border-[#E8EEF4] bg-white p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
              <h3 className="font-semibold text-[#0D1B4C]">At a glance</h3>
              <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-xs text-[#6B7D93]">Booked this month</dt><dd className="font-montserrat text-xl font-bold text-[#0D1B4C]">{formatMoney(ins.bookedThisMonth)}</dd></div>
                <div><dt className="text-xs text-[#6B7D93]">Booked this year</dt><dd className="font-montserrat text-xl font-bold text-[#0D1B4C]">{formatMoney(ins.bookedYtd)}</dd></div>
                <div><dt className="text-xs text-[#6B7D93]">Outstanding</dt><dd className="font-montserrat text-xl font-bold text-[#0D1B4C]">{formatMoney(ins.outstanding)}</dd></div>
                <div><dt className="text-xs text-[#6B7D93]">Ending in 14 days</dt><dd className="font-montserrat text-xl font-bold text-[#0D1B4C]">{ins.expiring.length}</dd></div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/admin/marketing/featured/revenue" className="rounded-lg bg-[#0E7C7B] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#0B6564]">Revenue insights</Link>
                <Link href="/admin/marketing/featured/accounts" className="rounded-lg border border-[#D3DEE8] px-3 py-1.5 text-sm font-medium text-[#2E3F5C] hover:bg-[#F5F8FB]">Customer accounts</Link>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------ one type ----------------------------- */

type Tab = 'requests' | 'pricing' | 'revenue';

export function FeaturedTypePage({ type }: { type: ListingType }) {
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === 'undefined') return 'requests';
    const t = new URLSearchParams(window.location.search).get('tab');
    return t === 'pricing' || t === 'revenue' ? t : 'requests';
  });
  const choose = (t: Tab) => {
    setTab(t);
    const u = new URL(window.location.href);
    if (t === 'requests') u.searchParams.delete('tab'); else u.searchParams.set('tab', t);
    window.history.replaceState(null, '', u.toString());
  };
  const meta = TYPE_META[type];
  return (
    <div>
      <Header title={`Featured ${meta.plural}`} sub={`${PLACEMENT_META.badge.label} and ${PLACEMENT_META.hero.label.toLowerCase()} placements on the ${meta.plural} page`}
        right={<a href={meta.publicPage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-semibold text-[#0E7C7B] hover:underline">View {meta.plural} page <ArrowRight className="h-4 w-4" /></a>} />
      <div className="mb-5 flex gap-1 border-b border-[#E3EAF1]" role="tablist">
        {([['requests', 'Requests & placements'], ['pricing', 'Pricing'], ['revenue', 'Revenue']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => choose(t)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${tab === t ? 'border-[#0E7C7B] text-[#0E7C7B]' : 'border-transparent text-[#5F6F86] hover:text-[#2E3F5C]'}`}>{label}</button>
        ))}
      </div>
      {tab === 'requests' && <FeaturedRequestsManager type={type} />}
      {tab === 'pricing' && <FeaturePricingEditor key={type} type={type} />}
      {tab === 'revenue' && <FeaturedRevenue type={type} />}
    </div>
  );
}

/* ------------------------------ combined ----------------------------- */

export function FeaturedRevenuePage() {
  return (
    <div>
      <Header title="Featured Content Revenue" sub="All listing types · Featured listings and page heroes" />
      <FeaturedRevenue />
    </div>
  );
}

/* ----------------------------- customers ----------------------------- */

interface Customer { email: string; name: string; types: Set<ListingType>; placements: number; live: number; booked: number; paid: number; last: string; rows: DbFeaturedRequest[] }

export function FeaturedCustomers() {
  const { rows, error } = usePlacements();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const customers = useMemo(() => {
    const map = new Map<string, Customer>();
    (rows || []).forEach((r) => {
      const k = r.requester_email.toLowerCase();
      const c = map.get(k) ?? { email: k, name: r.requester_name, types: new Set(), placements: 0, live: 0, booked: 0, paid: 0, last: r.created_at, rows: [] };
      c.types.add(r.listing_type); c.placements++; c.rows.push(r);
      if (isActivePlacement(r)) c.live++;
      if (r.status === 'approved') c.booked += priceOf(r);
      c.paid += Number(r.amount_paid ?? 0);
      if (r.created_at > c.last) { c.last = r.created_at; c.name = r.requester_name; }
      map.set(k, c);
    });
    return [...map.values()].sort((a, b) => b.booked - a.booked || b.last.localeCompare(a.last));
  }, [rows]);
  const t = q.trim().toLowerCase();
  const shown = customers.filter((c) => !t || c.name.toLowerCase().includes(t) || c.email.includes(t) || c.rows.some((r) => r.club_name.toLowerCase().includes(t)));

  return (
    <div>
      <Header title="Marketing Promotions · Customer Accounts" sub="Everyone who has requested or bought a featured placement" />
      {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <label className="relative mb-4 block max-w-[360px]">
        <span className="sr-only">Search customers</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9AB0]" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or listing" className="h-[40px] w-full rounded-lg border border-[#D3DEE8] bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#22B3B5]" />
      </label>
      <div className="overflow-x-auto rounded-lg border border-[#E8EEF4] bg-white shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
        {rows === null ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#8A9AB0]" /></div>
          : shown.length === 0 ? <p className="py-10 text-center text-sm text-[#5F6F86]">No customers yet.</p> : (
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-[#EEF3F8] bg-[#F7FAFC] text-left text-xs uppercase text-[#7A8BA3]">
              <tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Listing types</th><th className="px-4 py-3 text-right">Placements</th><th className="px-4 py-3 text-right">Live</th><th className="px-4 py-3 text-right">Booked</th><th className="px-4 py-3 text-right">Paid</th><th className="px-4 py-3">Last request</th></tr>
            </thead>
            <tbody className="divide-y divide-[#EEF3F8]">
              {shown.map((c) => (
                <Fragment key={c.email}>
                  <tr className="cursor-pointer hover:bg-[#F7FAFC]" onClick={() => setOpen(open === c.email ? null : c.email)} aria-expanded={open === c.email}>
                    <td className="px-4 py-3"><span className="block font-medium text-[#0D1B4C]">{c.name}</span><a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-xs text-[#0E7C7B] hover:underline"><Mail className="h-3 w-3" />{c.email}</a></td>
                    <td className="px-4 py-3 text-[#4A5B76]">{[...c.types].map((x) => TYPE_META[x].plural).join(', ')}</td>
                    <td className="px-4 py-3 text-right">{c.placements}</td>
                    <td className="px-4 py-3 text-right">{c.live}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#0D1B4C]">{formatMoney(c.booked)}</td>
                    <td className={`px-4 py-3 text-right ${c.paid < c.booked ? 'text-amber-700' : 'text-green-700'}`}>{formatMoney(c.paid)}</td>
                    <td className="px-4 py-3 text-[#5F6F86]">{fmt(c.last)}</td>
                  </tr>
                  {open === c.email && (
                    <tr className="bg-[#FAFCFD]">
                      <td colSpan={7} className="px-4 py-3">
                        <ul className="space-y-1.5">
                          {c.rows.map((r) => (
                            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                              <span><span className="font-medium text-[#0D1B4C]">{r.club_name}</span> <span className="text-[#6B7D93]">· {TYPE_META[r.listing_type].label} · {PLACEMENT_META[r.placement].label} · {r.plan_name || r.plan} · {r.status === 'in_review' ? 'invoice sent' : r.status}{isActivePlacement(r) ? ' · live' : ''}</span></span>
                              <Link href={`/admin/marketing/featured/${TYPE_META[r.listing_type].slug}`} className="text-[#0E7C7B] hover:underline">{formatMoney(priceOf(r))}</Link>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
