'use client';

/* Shared pieces for the Affiliate Management admin pages */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Table2 } from 'lucide-react';
import { computeAffiliateInsights, formatMoney, AFFILIATE_STATUS_META, type AffiliateData, type AffMonth, type AffiliateStatus } from '@/lib/affiliates';
import { CARD, Pill, money } from '../sponsors/shared';

export const REVENUE_COLOR = '#009B94';   // HOOX revenue from referred tournaments
export const COMMISSION_COLOR = '#C4560E'; // commission earned by affiliates

export function useAffiliateData() {
  const [data, setData] = useState<AffiliateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/affiliates', { cache: 'no-store' });
      const j = await res.json().catch(() => ({}));
      if (res.status === 403) throw new Error('Your admin session has expired. Please log in again.');
      setData({
        affiliates: j.affiliates || [], referrals: j.referrals || [], payouts: j.payouts || [], tournaments: j.tournaments || [],
        registrations: j.registrations || [], directors: j.directors || [], settings: j.settings, settingsSaved: !!j.settingsSaved,
      });
      setError(j.error || (res.ok ? null : `Request failed (${res.status})`));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  const ins = useMemo(() => (data?.settings ? computeAffiliateInsights(data) : null), [data]);
  return { data, ins, error, reload, setData };
}

export const StatusPill = ({ status }: { status: AffiliateStatus }) => <Pill cls={AFFILIATE_STATUS_META[status].cls}>{AFFILIATE_STATUS_META[status].label}</Pill>;
export const pct = (n: number) => `${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;

/** Paired columns per month: HOOX revenue from referrals vs commission earned (commission is part of revenue) */
export function AffiliateMonthlyChart({ months }: { months: AffMonth[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(1, ...months.map((m) => Math.max(m.revenue, m.commission)));
  const step = (() => { const raw = max / 4; const mag = 10 ** Math.floor(Math.log10(raw)); return Math.ceil(raw / mag) * mag; })();
  const top = step * 4;
  const W = 1100, H = 260, L = 52, B = 26, T = 10, R = 8;
  const plotH = H - T - B, band = (W - L - R) / months.length;
  const bar = Math.min(18, band * 0.3);
  const y = (v: number) => T + plotH - (v / top) * plotH;
  const empty = months.every((m) => m.revenue === 0);
  const monthName = (k: string) => new Date(`${k}-15T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const col = (x: number, v: number, fill: string) => {
    const h = T + plotH - y(v); if (h <= 0) return null;
    const r = Math.min(3, h);
    return <path d={`M${x},${y(v) + h} V${y(v) + r} Q${x},${y(v)} ${x + r},${y(v)} H${x + bar - r} Q${x + bar},${y(v)} ${x + bar},${y(v) + r} V${y(v) + h} Z`} fill={fill} />;
  };
  return (
    <section className={CARD} aria-labelledby="aff-monthly">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="aff-monthly" className="font-semibold text-[#0D1B4C]">Revenue generated vs commission earned</h3>
          <p className="text-xs text-[#6B7D93]">Registrations on referred directors’ tournaments, by month registered · last 12 months</p>
        </div>
        <div className="flex items-center gap-4">
          <ul className="flex gap-4 text-[13px] text-[#2E3F5C]" aria-label="Legend">
            <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: REVENUE_COLOR }} />HOOX revenue</li>
            <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: COMMISSION_COLOR }} />Commission</li>
          </ul>
          <button type="button" onClick={() => setAsTable((v) => !v)} className="flex items-center gap-1 rounded-md border border-[#D3DEE8] px-2 py-1 text-xs font-medium text-[#2E3F5C] hover:bg-[#F5F8FB]">
            {asTable ? <><BarChart3 className="h-3.5 w-3.5" /> Chart</> : <><Table2 className="h-3.5 w-3.5" /> Table</>}
          </button>
        </div>
      </div>
      {asTable ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#EDF1F5] text-left text-xs uppercase text-[#7A8BA3]"><th className="py-2">Month</th><th className="py-2 text-right">HOOX revenue</th><th className="py-2 text-right">Commission earned</th><th className="py-2 text-right">Paid out</th></tr></thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.key} className="border-b border-[#F2F5F8]">
                  <td className="py-1.5 text-[#2E3F5C]">{monthName(m.key)}</td>
                  <td className="py-1.5 text-right">{formatMoney(m.revenue)}</td>
                  <td className="py-1.5 text-right font-semibold text-[#0D1B4C]">{formatMoney(m.commission)}</td>
                  <td className="py-1.5 text-right">{formatMoney(m.paid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative mt-3">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`HOOX revenue and affiliate commission by month. ${months.map((m) => `${m.label}: ${formatMoney(m.revenue)} revenue, ${formatMoney(m.commission)} commission`).join('; ')}`}>
            {[0, 1, 2, 3, 4].map((g) => (
              <g key={g}>
                <line x1={L} x2={W - R} y1={y(g * step)} y2={y(g * step)} stroke="#E6EDF3" />
                <text x={L - 8} y={y(g * step) + 4} textAnchor="end" fontSize="11" fill="#6B7D93">{money(g * step)}</text>
              </g>
            ))}
            {months.map((m, i) => {
              const cx = L + band * i + band / 2;
              return (
                <g key={m.key} opacity={hover === null || hover === i ? 1 : 0.45}>
                  {col(cx - bar - 1, m.revenue, REVENUE_COLOR)}
                  {col(cx + 1, m.commission, COMMISSION_COLOR)}
                  <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill="#6B7D93">{m.label}</text>
                  <rect x={L + band * i} y={T} width={band} height={plotH} fill="transparent" tabIndex={0}
                    onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                    aria-label={`${m.label}: ${formatMoney(m.revenue)} HOOX revenue, ${formatMoney(m.commission)} commission`} />
                </g>
              );
            })}
            <line x1={L} x2={W - R} y1={T + plotH} y2={T + plotH} stroke="#C9D3DE" />
          </svg>
          {empty && <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-[#8A9AB0]">No registrations from referred directors yet</p>}
          {hover !== null && (
            <div className="pointer-events-none absolute z-10 min-w-[200px] -translate-x-1/2 rounded-lg border border-[#E3EAF1] bg-white px-3 py-2 text-[12.5px] shadow-lg"
              style={{ left: `${Math.min(85, Math.max(15, ((L + band * hover + band / 2) / W) * 100))}%`, top: 0 }}>
              <p className="font-semibold text-[#0D1B4C]">{monthName(months[hover].key)}</p>
              <p className="mt-0.5 flex justify-between gap-3 text-[#2E3F5C]"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: REVENUE_COLOR }} />HOOX revenue</span><span>{formatMoney(months[hover].revenue)}</span></p>
              <p className="flex justify-between gap-3 text-[#2E3F5C]"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: COMMISSION_COLOR }} />Commission</span><span>{formatMoney(months[hover].commission)}</span></p>
              <p className="mt-1 flex justify-between border-t border-[#EEF2F6] pt-1 text-[#6B7D93]"><span>Paid out</span><span>{formatMoney(months[hover].paid)}</span></p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
