'use client';

/* ------------------------------------------------------------------ */
/* Featured revenue insights — combined (all listing types) or for one */
/* type. Numbers come from computeInsights() over the placement rows.  */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Wallet, Clock, Radio, Receipt, Table2, BarChart3 } from 'lucide-react';
import { computeInsights, type Insights, type MonthPoint } from '@/lib/featuredInsights';
import { TYPE_META, PLACEMENT_META, PLACEMENTS, formatMoney, priceOf, type DbFeaturedRequest, type ListingType, type Placement } from '@/lib/featured';

/* Chart roles (validated pair: CVD ΔE ≥ 14.7, contrast ≥ 3:1 on white) */
const SERIES: Record<Placement, string> = { badge: '#009B94', hero: '#C4560E' };
const INK = '#0D1B4C';
const MUTED = '#6B7D93';
const GRID = '#E6EDF3';

const money = (n: number) => (n >= 100000 ? `$${(n / 1000).toFixed(0)}k` : formatMoney(Math.round(n * 100) / 100));
const fmtDate = (d: string | null) => (d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
const slugOf = (t: ListingType) => TYPE_META[t].slug;

async function api<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  let json: Record<string, unknown> = {};
  try { json = await res.json(); } catch { /* ignore */ }
  if (!res.ok || json.error) throw new Error(typeof json.error === 'string' ? json.error : `Request failed (${res.status})`);
  return json as T;
}

/** Load placement rows for one type (or all) */
export function usePlacements(type?: ListingType) {
  const [rows, setRows] = useState<DbFeaturedRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const j = await api<{ requests: DbFeaturedRequest[] }>(`/api/admin/featured/requests${type ? `?type=${type}` : ''}`);
      setRows(j.requests); setError(null);
    } catch (e) {
      setError((e as Error).message); setRows([]);
    }
  }, [type]);
  useEffect(() => { load(); }, [load]);
  return { rows, error, reload: load };
}

function Tile({ icon: Icon, label, value, sub, tone }: { icon: typeof Wallet; label: string; value: string; sub?: React.ReactNode; tone?: 'up' | 'down' }) {
  return (
    <div className="rounded-lg border border-[#E8EEF4] bg-white p-4 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
      <div className="flex items-center gap-2 text-[13px] text-[#5F6F86]"><Icon className="h-4 w-4 text-[#0E7C7B]" />{label}</div>
      <div className="mt-1.5 font-montserrat text-[26px] font-bold leading-tight text-[#0D1B4C]">{value}</div>
      {sub && <div className={`mt-0.5 flex items-center gap-1 text-[12.5px] ${tone === 'up' ? 'text-green-700' : tone === 'down' ? 'text-red-600' : 'text-[#6B7D93]'}`}>{sub}</div>}
    </div>
  );
}

/* ----------------------- monthly stacked columns ---------------------- */

function MonthlyChart({ months }: { months: MonthPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const totals = months.map((m) => m.booked.badge + m.booked.hero);
  const max = Math.max(1, ...totals);
  // Nice axis: 4 gridlines
  const step = (() => { const raw = max / 4; const mag = 10 ** Math.floor(Math.log10(raw)); return Math.ceil(raw / mag) * mag; })();
  const top = step * 4;
  const W = 720, H = 240, L = 48, B = 26, T = 10, R = 8;
  const plotW = W - L - R, plotH = H - T - B;
  const band = plotW / months.length;
  const bar = Math.min(24, band * 0.56);
  const y = (v: number) => T + plotH - (v / top) * plotH;
  const empty = totals.every((t) => t === 0);

  return (
    <section className="rounded-lg border border-[#E8EEF4] bg-white p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]" aria-labelledby="monthly-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="monthly-title" className="font-semibold text-[#0D1B4C]">Booked revenue by month</h3>
          <p className="text-xs text-[#6B7D93]">Approved placements, counted in the month they were approved · last 12 months</p>
        </div>
        <div className="flex items-center gap-4">
          <ul className="flex gap-4 text-[13px] text-[#2E3F5C]" aria-label="Legend">
            {PLACEMENTS.map((p) => (
              <li key={p} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES[p] }} aria-hidden />{PLACEMENT_META[p].label}</li>
            ))}
          </ul>
          <button type="button" onClick={() => setAsTable((v) => !v)} className="flex items-center gap-1 rounded-md border border-[#D3DEE8] px-2 py-1 text-xs font-medium text-[#2E3F5C] hover:bg-[#F5F8FB]">
            {asTable ? <><BarChart3 className="h-3.5 w-3.5" /> Chart</> : <><Table2 className="h-3.5 w-3.5" /> Table</>}
          </button>
        </div>
      </div>

      {asTable ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#EDF1F5] text-left text-xs uppercase text-[#7A8BA3]"><th className="py-2">Month</th><th className="py-2 text-right">Featured listing</th><th className="py-2 text-right">Page hero</th><th className="py-2 text-right">Booked</th><th className="py-2 text-right">Collected</th></tr></thead>
            <tbody>
              {months.map((m, i) => (
                <tr key={m.key} className="border-b border-[#F2F5F8]">
                  <td className="py-1.5 text-[#2E3F5C]">{new Date(`${m.key}-15`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</td>
                  <td className="py-1.5 text-right">{formatMoney(m.booked.badge)}</td>
                  <td className="py-1.5 text-right">{formatMoney(m.booked.hero)}</td>
                  <td className="py-1.5 text-right font-semibold text-[#0D1B4C]">{formatMoney(totals[i])}</td>
                  <td className="py-1.5 text-right">{formatMoney(m.collected)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative mt-3">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Booked revenue by month. ${months.map((m, i) => `${m.label}: ${formatMoney(totals[i])}`).join(', ')}`}>
            {[0, 1, 2, 3, 4].map((g) => (
              <g key={g}>
                <line x1={L} x2={W - R} y1={y(g * step)} y2={y(g * step)} stroke={GRID} strokeWidth={1} />
                <text x={L - 8} y={y(g * step) + 4} textAnchor="end" fontSize="11" fill={MUTED}>{money(g * step)}</text>
              </g>
            ))}
            {months.map((m, i) => {
              const cx = L + band * i + band / 2;
              const x = cx - bar / 2;
              const yb = y(m.booked.badge);
              const yh = y(m.booked.badge + m.booked.hero);
              const gap = m.booked.badge > 0 && m.booked.hero > 0 ? 2 : 0;
              const r = 4;
              // Rounded data-end only on the top segment; square at the baseline
              const roundTop = (x0: number, y0: number, h: number, fill: string) =>
                h <= 0 ? null : (
                  <path d={`M${x0},${y0 + h} V${y0 + Math.min(r, h)} Q${x0},${y0} ${x0 + r},${y0} H${x0 + bar - r} Q${x0 + bar},${y0} ${x0 + bar},${y0 + Math.min(r, h)} V${y0 + h} Z`} fill={fill} />
                );
              const badgeH = T + plotH - yb;
              const heroH = yb - yh - gap;
              return (
                <g key={m.key} opacity={hover === null || hover === i ? 1 : 0.45}>
                  {m.booked.hero > 0
                    ? <>{badgeH > 0 && <rect x={x} y={yb} width={bar} height={badgeH} fill={SERIES.badge} />}{roundTop(x, yh, heroH, SERIES.hero)}</>
                    : roundTop(x, yb, badgeH, SERIES.badge)}
                  <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill={MUTED}>{m.label}</text>
                  <rect x={L + band * i} y={T} width={band} height={plotH} fill="transparent"
                    onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}
                    aria-label={`${m.label}: ${formatMoney(totals[i])} booked`} />
                </g>
              );
            })}
            <line x1={L} x2={W - R} y1={T + plotH} y2={T + plotH} stroke="#C9D3DE" strokeWidth={1} />
          </svg>
          {empty && <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-[#8A9AB0]">No approved placements in the last 12 months yet</p>}
          {hover !== null && (
            <div className="pointer-events-none absolute z-10 min-w-[180px] -translate-x-1/2 rounded-lg border border-[#E3EAF1] bg-white px-3 py-2 text-[12.5px] shadow-lg"
              style={{ left: `${((L + band * hover + band / 2) / W) * 100}%`, top: 0 }}>
              <p className="font-semibold text-[#0D1B4C]">{new Date(`${months[hover].key}-15`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              {(['hero', 'badge'] as Placement[]).map((p) => (
                <p key={p} className="mt-0.5 flex items-center justify-between gap-3 text-[#2E3F5C]">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: SERIES[p] }} />{PLACEMENT_META[p].label}</span>
                  <span>{formatMoney(months[hover].booked[p])}</span>
                </p>
              ))}
              <p className="mt-1 flex justify-between border-t border-[#EEF2F6] pt-1 font-semibold text-[#0D1B4C]"><span>Booked</span><span>{formatMoney(totals[hover])}</span></p>
              <p className="flex justify-between text-[#6B7D93]"><span>Collected</span><span>{formatMoney(months[hover].collected)}</span></p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* --------------------------- by listing type -------------------------- */

function ByType({ data }: { data: Insights['byType'] }) {
  const max = Math.max(1, ...data.map((d) => d.booked));
  return (
    <section className="rounded-lg border border-[#E8EEF4] bg-white p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]" aria-labelledby="bytype-title">
      <h3 id="bytype-title" className="font-semibold text-[#0D1B4C]">Booked revenue by listing type</h3>
      <p className="text-xs text-[#6B7D93]">All time</p>
      <ul className="mt-4 space-y-3.5">
        {data.map((d) => (
          <li key={d.type}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <Link href={`/admin/marketing/featured/${slugOf(d.type)}`} className="font-medium text-[#0D1B4C] hover:text-[#0E7C7B] hover:underline">{TYPE_META[d.type].plural}</Link>
              <span className="text-[#2E3F5C]"><span className="font-semibold text-[#0D1B4C]">{formatMoney(d.booked)}</span> · {formatMoney(d.collected)} collected</span>
            </div>
            <div className="mt-1.5 h-[14px] w-full" title={`${TYPE_META[d.type].plural}: ${formatMoney(d.booked)} booked`}>
              <div className="h-full rounded-r-[4px]" style={{ width: `${Math.max(d.booked > 0 ? 1.5 : 0, (d.booked / max) * 100)}%`, background: SERIES.badge }} />
            </div>
            <p className="mt-1 text-xs text-[#6B7D93]">{d.active} live now · {d.pending} awaiting review</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* --------------------------------- page -------------------------------- */

export default function FeaturedRevenue({ type }: { type?: ListingType }) {
  const { rows, error } = usePlacements(type);
  const ins = useMemo(() => (rows ? computeInsights(rows) : null), [rows]);

  if (!ins) return <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#5F6F86]"><Loader2 className="h-4 w-4 animate-spin" /> Loading revenue…</div>;

  const delta = ins.bookedLastMonth ? Math.round(((ins.bookedThisMonth - ins.bookedLastMonth) / ins.bookedLastMonth) * 100) : null;
  const typeOf = (r: DbFeaturedRequest) => (type ? '' : `${TYPE_META[r.listing_type].label} · `);

  return (
    <div className="space-y-5">
      {error && <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />{error}</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Tile icon={Receipt} label="Booked, all time" value={money(ins.booked)} sub={`${ins.approvedCount} placement${ins.approvedCount === 1 ? '' : 's'}`} />
        <Tile icon={ins.bookedThisMonth >= ins.bookedLastMonth ? TrendingUp : TrendingDown} label="Booked this month" value={money(ins.bookedThisMonth)}
          sub={delta === null ? `${money(ins.bookedYtd)} this year` : `${delta >= 0 ? '+' : ''}${delta}% vs last month`} tone={delta === null ? undefined : delta >= 0 ? 'up' : 'down'} />
        <Tile icon={Wallet} label="Collected" value={money(ins.collected)} sub="Payments recorded" />
        <Tile icon={Clock} label="Outstanding" value={money(ins.outstanding)} sub={`${ins.unpaid.length} unpaid placement${ins.unpaid.length === 1 ? '' : 's'}`} tone={ins.outstanding > 0 ? 'down' : undefined} />
        <Tile icon={TrendingUp} label="Pipeline" value={money(ins.pipeline)} sub={`${ins.pendingCount} awaiting review${ins.winRate !== null ? ` · ${ins.winRate}% approval rate` : ''}`} />
        <Tile icon={Radio} label="Live now" value={String(ins.active.badge + ins.active.hero)} sub={`${ins.active.hero} hero · ${ins.active.badge} listing`} />
      </div>

      <div className={`grid grid-cols-1 gap-5 ${type ? '' : 'xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'}`}>
        <MonthlyChart months={ins.months} />
        {!type && <ByType data={ins.byType} />}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="rounded-lg border border-[#E8EEF4] bg-white p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
          <h3 className="font-semibold text-[#0D1B4C]">By product</h3>
          <ul className="mt-3 space-y-2.5 text-sm">
            {PLACEMENTS.map((p) => (
              <li key={p} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[#2E3F5C]"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES[p] }} />{PLACEMENT_META[p].label}</span>
                <span><span className="font-semibold text-[#0D1B4C]">{formatMoney(ins.byPlacement[p].booked)}</span> <span className="text-[#6B7D93]">· {ins.byPlacement[p].count}</span></span>
              </li>
            ))}
          </ul>
          <h4 className="mt-5 text-xs font-semibold uppercase tracking-wide text-[#7A8BA3]">By plan</h4>
          {ins.byPlan.length === 0 ? <p className="mt-2 text-sm text-[#8A9AB0]">No approved placements yet.</p> : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {ins.byPlan.map((p) => <li key={p.plan} className="flex justify-between"><span className="text-[#2E3F5C]">{p.plan} <span className="text-[#8A9AB0]">× {p.count}</span></span><span className="font-medium text-[#0D1B4C]">{formatMoney(p.booked)}</span></li>)}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-[#E8EEF4] bg-white p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
          <h3 className="font-semibold text-[#0D1B4C]">Ending in the next 14 days</h3>
          <p className="text-xs text-[#6B7D93]">A good time to offer a renewal</p>
          {ins.expiring.length === 0 ? <p className="mt-3 text-sm text-[#8A9AB0]">Nothing ending soon.</p> : (
            <ul className="mt-3 space-y-2 text-sm">
              {ins.expiring.slice(0, 8).map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3">
                  <span className="min-w-0"><span className="block truncate font-medium text-[#0D1B4C]">{r.club_name}</span><span className="block text-xs text-[#6B7D93]">{typeOf(r)}{PLACEMENT_META[r.placement].label}</span></span>
                  <span className="flex-shrink-0 text-xs font-medium text-amber-700">{fmtDate(r.featured_until)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-[#E8EEF4] bg-white p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
          <h3 className="font-semibold text-[#0D1B4C]">Awaiting payment</h3>
          <p className="text-xs text-[#6B7D93]">Approved but not fully paid, oldest first</p>
          {ins.unpaid.length === 0 ? <p className="mt-3 text-sm text-[#8A9AB0]">All approved placements are paid.</p> : (
            <ul className="mt-3 space-y-2 text-sm">
              {ins.unpaid.slice(0, 8).map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3">
                  <span className="min-w-0"><span className="block truncate font-medium text-[#0D1B4C]">{r.club_name}</span><span className="block truncate text-xs text-[#6B7D93]">{typeOf(r)}{r.requester_name}</span></span>
                  <span className="flex-shrink-0 text-right font-medium text-[#0D1B4C]">{formatMoney(priceOf(r) - Number(r.amount_paid ?? 0))}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-[#E8EEF4] bg-white p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
        <h3 className="font-semibold text-[#0D1B4C]">Top listings by booked revenue</h3>
        {ins.topListings.length === 0 ? <p className="mt-3 text-sm text-[#8A9AB0]">No approved placements yet.</p> : (
          <table className="mt-3 w-full text-sm">
            <thead><tr className="border-b border-[#EDF1F5] text-left text-xs uppercase text-[#7A8BA3]"><th className="py-2">Listing</th>{!type && <th className="py-2">Type</th>}<th className="py-2 text-right">Placements</th><th className="py-2 text-right">Booked</th></tr></thead>
            <tbody>
              {ins.topListings.map((l) => (
                <tr key={`${l.type}-${l.name}`} className="border-b border-[#F2F5F8]">
                  <td className="py-2 font-medium text-[#0D1B4C]">{l.name}</td>
                  {!type && <td className="py-2 text-[#5F6F86]">{TYPE_META[l.type].plural}</td>}
                  <td className="py-2 text-right text-[#2E3F5C]">{l.placements}</td>
                  <td className="py-2 text-right font-semibold text-[#0D1B4C]">{formatMoney(l.booked)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
