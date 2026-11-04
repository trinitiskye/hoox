'use client';

/* Shared building blocks for the Sponsor Programs admin pages */

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Table2, type LucideIcon } from 'lucide-react';
import MarketingSectionTabs from '@/components/admin/MarketingSectionTabs';
import {
  formatMoney, KIND_META, SPONSOR_KINDS, PHASE_META, ACCOUNT_STATUS_META,
  type DbSponsorAccount, type DbSponsorPromotion, type SponsorPackage, type SponsorMonth, type PromoPhase, type AccountStatus,
} from '@/lib/sponsors';

export const INPUT = 'h-[40px] w-full rounded-lg border border-[#D3DEE8] bg-white px-3 text-sm text-[#0D1B4C] focus:outline-none focus:ring-2 focus:ring-[#22B3B5]';
export const LABEL = 'mb-1 block text-[12.5px] font-semibold text-[#2E3F5C]';
export const CARD = 'rounded-lg border border-[#E8EEF4] bg-white p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]';
export const BTN = 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0E7C7B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0B6564] disabled:opacity-60';
export const BTN_GHOST = 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#D3DEE8] bg-white px-3 py-2 text-sm font-medium text-[#2E3F5C] transition hover:bg-[#F5F8FB] disabled:opacity-60';

export const money = (n: number) => (n >= 100000 ? `$${(n / 1000).toFixed(0)}k` : formatMoney(Math.round(n * 100) / 100));
export const fmtDate = (d: string | null | undefined) => (d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

export async function sponsorApi<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  let json: Record<string, unknown> = {};
  try { json = await res.json(); } catch { /* ignore */ }
  if (res.status === 403) throw new Error('Your admin session has expired. Please log in again.');
  if (!res.ok || json.error) throw new Error(typeof json.error === 'string' ? json.error : `Request failed (${res.status})`);
  return json as T;
}

export interface SponsorData { accounts: DbSponsorAccount[]; promotions: DbSponsorPromotion[]; packages: SponsorPackage[]; packagesSaved: boolean }

/** Accounts, promotions and packages, loaded together */
export function useSponsorData() {
  const [data, setData] = useState<SponsorData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sponsors', { cache: 'no-store' });
      const j = await res.json().catch(() => ({}));
      if (res.status === 403) throw new Error('Your admin session has expired. Please log in again.');
      // Missing tables still return the packages, so the pricing tab works before the migration
      setData({ accounts: j.accounts || [], promotions: j.promotions || [], packages: j.packages || [], packagesSaved: !!j.packagesSaved });
      setError(j.error || (res.ok ? null : `Request failed (${res.status})`));
    } catch (e) {
      setError((e as Error).message);
      setData((d) => d ?? { accounts: [], promotions: [], packages: [], packagesSaved: false });
    }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, reload, setData };
}

export function Header({ title, sub, right }: { title: string; sub: string; right?: React.ReactNode }) {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C]">{title}</h2>
          <p className="mt-0.5 text-sm text-[#5F6F86]">{sub}</p>
        </div>
        {right}
      </div>
      {/* Section tabs sit under the page title */}
      <MarketingSectionTabs />
    </>
  );
}

export function Tile({ icon: Icon, label, value, sub, tone }: { icon: LucideIcon; label: string; value: string; sub?: React.ReactNode; tone?: 'up' | 'down' }) {
  return (
    <div className="rounded-lg border border-[#E8EEF4] bg-white p-4 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
      <div className="flex items-center gap-2 text-[13px] text-[#5F6F86]"><Icon className="h-4 w-4 text-[#0E7C7B]" />{label}</div>
      <div className="mt-1.5 font-montserrat text-[26px] font-bold leading-tight text-[#0D1B4C]">{value}</div>
      {sub && <div className={`mt-0.5 flex items-center gap-1 text-[12.5px] ${tone === 'up' ? 'text-green-700' : tone === 'down' ? 'text-red-600' : 'text-[#6B7D93]'}`}>{sub}</div>}
    </div>
  );
}

export function Pill({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11.5px] font-semibold ${cls}`}>{children}</span>;
}
export const PhasePill = ({ phase }: { phase: PromoPhase }) => <Pill cls={PHASE_META[phase].cls}>{PHASE_META[phase].label}</Pill>;
export const AccountPill = ({ status }: { status: AccountStatus }) => <Pill cls={ACCOUNT_STATUS_META[status].cls}>{ACCOUNT_STATUS_META[status].label}</Pill>;
export const KindDot = ({ kind }: { kind: keyof typeof KIND_META }) => <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ background: KIND_META[kind].color }} aria-hidden />;

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</p>;
}

/* ---------------- booked revenue by month: tiers vs placements ---------------- */

export function SponsorMonthlyChart({ months, compact = false }: { months: SponsorMonth[]; compact?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const totals = months.map((m) => m.booked.tier + m.booked.placement);
  const max = Math.max(1, ...totals);
  const step = (() => { const raw = max / 4; const mag = 10 ** Math.floor(Math.log10(raw)); return Math.ceil(raw / mag) * mag; })();
  const top = step * 4;
  const W = compact ? 1200 : 720, H = compact ? 220 : 240, L = 52, B = 26, T = 10, R = 8;
  const plotW = W - L - R, plotH = H - T - B;
  const band = plotW / months.length;
  const bar = Math.min(24, band * 0.56);
  const y = (v: number) => T + plotH - (v / top) * plotH;
  const empty = totals.every((t) => t === 0);
  const monthName = (k: string) => new Date(`${k}-15T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <section className={CARD} aria-labelledby="sp-monthly-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="sp-monthly-title" className="font-semibold text-[#0D1B4C]">Booked revenue by month</h3>
          <p className="text-xs text-[#6B7D93]">Booked promotions, counted in the month they were booked · last 12 months</p>
        </div>
        <div className="flex items-center gap-4">
          <ul className="flex gap-4 text-[13px] text-[#2E3F5C]" aria-label="Legend">
            {SPONSOR_KINDS.map((k) => <li key={k} className="flex items-center gap-1.5"><KindDot kind={k} />{KIND_META[k].label}</li>)}
          </ul>
          <button type="button" onClick={() => setAsTable((v) => !v)} className="flex items-center gap-1 rounded-md border border-[#D3DEE8] px-2 py-1 text-xs font-medium text-[#2E3F5C] hover:bg-[#F5F8FB]">
            {asTable ? <><BarChart3 className="h-3.5 w-3.5" /> Chart</> : <><Table2 className="h-3.5 w-3.5" /> Table</>}
          </button>
        </div>
      </div>

      {asTable ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#EDF1F5] text-left text-xs uppercase text-[#7A8BA3]"><th className="py-2">Month</th><th className="py-2 text-right">Tiers</th><th className="py-2 text-right">Placements</th><th className="py-2 text-right">Booked</th><th className="py-2 text-right">Collected</th></tr></thead>
            <tbody>
              {months.map((m, i) => (
                <tr key={m.key} className="border-b border-[#F2F5F8]">
                  <td className="py-1.5 text-[#2E3F5C]">{monthName(m.key)}</td>
                  <td className="py-1.5 text-right">{formatMoney(m.booked.tier)}</td>
                  <td className="py-1.5 text-right">{formatMoney(m.booked.placement)}</td>
                  <td className="py-1.5 text-right font-semibold text-[#0D1B4C]">{formatMoney(totals[i])}</td>
                  <td className="py-1.5 text-right">{formatMoney(m.collected)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative mt-3">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Booked sponsor revenue by month. ${months.map((m, i) => `${m.label}: ${formatMoney(totals[i])}`).join(', ')}`}>
            {[0, 1, 2, 3, 4].map((g) => (
              <g key={g}>
                <line x1={L} x2={W - R} y1={y(g * step)} y2={y(g * step)} stroke="#E6EDF3" strokeWidth={1} />
                <text x={L - 8} y={y(g * step) + 4} textAnchor="end" fontSize="11" fill="#6B7D93">{money(g * step)}</text>
              </g>
            ))}
            {months.map((m, i) => {
              const cx = L + band * i + band / 2;
              const x = cx - bar / 2;
              const yt = y(m.booked.tier);
              const yp = y(m.booked.tier + m.booked.placement);
              const gap = m.booked.tier > 0 && m.booked.placement > 0 ? 2 : 0;
              const r = 4;
              const roundTop = (y0: number, h: number, fill: string) =>
                h <= 0 ? null : <path d={`M${x},${y0 + h} V${y0 + Math.min(r, h)} Q${x},${y0} ${x + r},${y0} H${x + bar - r} Q${x + bar},${y0} ${x + bar},${y0 + Math.min(r, h)} V${y0 + h} Z`} fill={fill} />;
              const tierH = T + plotH - yt;
              const placeH = yt - yp - gap;
              return (
                <g key={m.key} opacity={hover === null || hover === i ? 1 : 0.45}>
                  {m.booked.placement > 0
                    ? <>{tierH > 0 && <rect x={x} y={yt} width={bar} height={tierH} fill={KIND_META.tier.color} />}{roundTop(yp, placeH, KIND_META.placement.color)}</>
                    : roundTop(yt, tierH, KIND_META.tier.color)}
                  <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill="#6B7D93">{m.label}</text>
                  <rect x={L + band * i} y={T} width={band} height={plotH} fill="transparent" tabIndex={0}
                    onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                    aria-label={`${m.label}: ${formatMoney(totals[i])} booked`} />
                </g>
              );
            })}
            <line x1={L} x2={W - R} y1={T + plotH} y2={T + plotH} stroke="#C9D3DE" strokeWidth={1} />
          </svg>
          {empty && <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-[#8A9AB0]">No booked promotions in the last 12 months yet</p>}
          {hover !== null && (
            <div className="pointer-events-none absolute z-10 min-w-[190px] -translate-x-1/2 rounded-lg border border-[#E3EAF1] bg-white px-3 py-2 text-[12.5px] shadow-lg"
              style={{ left: `${Math.min(85, Math.max(15, ((L + band * hover + band / 2) / W) * 100))}%`, top: 0 }}>
              <p className="font-semibold text-[#0D1B4C]">{monthName(months[hover].key)}</p>
              {(['placement', 'tier'] as const).map((k) => (
                <p key={k} className="mt-0.5 flex items-center justify-between gap-3 text-[#2E3F5C]">
                  <span className="flex items-center gap-1.5"><KindDot kind={k} />{KIND_META[k].label}</span>
                  <span>{formatMoney(months[hover].booked[k])}</span>
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
