'use client';

/* ------------------------------------------------------------------ */
/* Admin → Marketing → Affiliate Management                           */
/*   AffiliateOverview     program at a glance + settings              */
/*   AffiliatePayoutsPage  balances owed + payout history              */
/*   AffiliateRevenuePage  revenue generated & distributed per affiliate*/
/*   RecordPayout          shared payout form                          */
/* ------------------------------------------------------------------ */

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Users, UserCheck, Receipt, Wallet, TrendingUp, TrendingDown, Banknote, Clock, ArrowRight, ExternalLink, Trash2, Percent } from 'lucide-react';
import {
  PAYOUT_METHODS, PAYOUT_METHOD_LABEL, referralEnds, todayIso, formatMoney,
  type AffiliateData, type AffiliateInsights, type AffiliateSettings, type DbAffiliate, type PayoutMethod,
} from '@/lib/affiliates';
import { Header, Tile, CARD, INPUT, LABEL, BTN, BTN_GHOST, ErrorNote, money, fmtDate, sponsorApi as api } from '../sponsors/shared';
import { useAffiliateData, AffiliateMonthlyChart, StatusPill, pct, REVENUE_COLOR, COMMISSION_COLOR } from './common';

const Loading = () => <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#5F6F86]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
const nameOf = (d: AffiliateData, id: string) => d.affiliates.find((a) => a.id === id)?.name || 'Unknown affiliate';

/* ------------------------------ payout form ------------------------------ */

export function RecordPayout({ affiliate, owed, onSaved, compact }: { affiliate: DbAffiliate; owed: number; onSaved: () => Promise<void>; compact?: boolean }) {
  const [f, setF] = useState({ amount: owed > 0 ? owed.toFixed(2) : '', paidAt: todayIso(), method: affiliate.payout_method || '', reference: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      await api('/api/admin/affiliates/payouts', { method: 'POST', body: JSON.stringify({ affiliateId: affiliate.id, ...f, amount: Number(f.amount) }) });
      await onSaved();
      setMsg({ ok: true, text: `Recorded ${formatMoney(Number(f.amount))} paid to ${affiliate.name}.` });
      setF({ ...f, amount: '', reference: '', notes: '' });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
  };
  return (
    <div className={compact ? '' : 'rounded-lg border border-[#E3EAF1] bg-white p-3'}>
      <div className="flex flex-wrap items-end gap-2">
        <label className="w-[120px]"><span className={LABEL}>Amount</span>
          <span className="relative block"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8A9AB0]">$</span>
            <input type="number" min={0} step="0.01" className={`${INPUT} pl-6`} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></span>
        </label>
        <label className="w-[160px]"><span className={LABEL}>Paid on</span><input type="date" className={INPUT} value={f.paidAt} onChange={(e) => setF({ ...f, paidAt: e.target.value })} /></label>
        <label className="w-[140px]"><span className={LABEL}>Method</span>
          <select className={INPUT} value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
            <option value="">—</option>
            {PAYOUT_METHODS.map((m) => <option key={m} value={m}>{PAYOUT_METHOD_LABEL[m]}</option>)}
          </select>
        </label>
        <label className="w-[180px]"><span className={LABEL}>Reference</span><input className={INPUT} value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} placeholder="Transaction / check #" /></label>
        <label className="min-w-[160px] flex-1"><span className={LABEL}>Notes</span><input className={INPUT} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="e.g. October commissions" /></label>
        <button type="button" onClick={save} disabled={busy || !(Number(f.amount) > 0)} className={BTN}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Record payout</button>
      </div>
      <p className="mt-2 text-xs text-[#6B7D93]">Owed now: <span className="font-semibold text-[#0D1B4C]">{formatMoney(owed)}</span>{affiliate.payout_details ? ` · Pay to: ${affiliate.payout_details}` : ''}. Send the money first (PayPal, Venmo, check…), then record it here.</p>
      {msg && <p className={`mt-1 text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`} role="status">{msg.text}</p>}
    </div>
  );
}

/* -------------------------------- overview ------------------------------- */

function SettingsCard({ settings, saved, onSaved }: { settings: AffiliateSettings; saved: boolean; onSaved: (s: AffiliateSettings) => void }) {
  const [f, setF] = useState(() => ({ ...settings }));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const save = async () => {
    setBusy(true); setMsg(null);
    try { const j = await api<{ settings: AffiliateSettings }>('/api/admin/affiliates/settings', { method: 'PUT', body: JSON.stringify(f) }); onSaved(j.settings); setMsg({ ok: true, text: 'Program settings saved.' }); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
  };
  const field = (k: 'defaultRate' | 'windowMonths' | 'fallbackFee' | 'minPayout', label: string, hint: string, prefix?: string, suffix?: string) => (
    <label>
      <span className={LABEL}>{label}</span>
      <span className="relative block">
        {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8A9AB0]">{prefix}</span>}
        <input type="number" min={0} step="any" className={`${INPUT} ${prefix ? 'pl-6' : ''} ${suffix ? 'pr-16' : ''}`} value={f[k]} onChange={(e) => setF({ ...f, [k]: Number(e.target.value) })} />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#8A9AB0]">{suffix}</span>}
      </span>
      <span className="mt-1 block text-[11.5px] text-[#6B7D93]">{hint}</span>
    </label>
  );
  const perAngler = Math.round(f.fallbackFee * f.defaultRate) / 100;
  return (
    <section className={CARD} aria-labelledby="aff-settings">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="aff-settings" className="font-semibold text-[#0D1B4C]">Program settings</h3>
          <p className="text-xs text-[#6B7D93]">{saved ? 'Saved settings' : 'Recommended starting settings (not saved yet)'} · new affiliates and referrals use these</p>
        </div>
        <a href="/advertise/affiliates" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-semibold text-[#0E7C7B] hover:underline">Public program page <ExternalLink className="h-3.5 w-3.5" /></a>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {field('defaultRate', 'Commission', 'Share of HOOX’s cut on each registration', undefined, '%')}
        {field('windowMonths', 'Earning window', 'Per referred director, from sign-up', undefined, 'months')}
        {field('fallbackFee', 'HOOX fee per registration', 'Used when a registration doesn’t record HOOX’s cut', '$')}
        {field('minPayout', 'Minimum payout', 'Balances below this roll over', '$')}
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-[#2E3F5C]">
        <input type="checkbox" checked={f.acceptingApplications} onChange={(e) => setF({ ...f, acceptingApplications: e.target.checked })} className="h-4 w-4 accent-[#0E7C7B]" />
        Accept new applications on the public Affiliate Programs page
      </label>
      <p className="mt-3 rounded-lg bg-[#F5F8FB] px-3 py-2 text-[13px] text-[#4A5B76]">
        At these settings an affiliate earns about <span className="font-semibold text-[#0D1B4C]">{formatMoney(perAngler)}</span> per angler registration. A referred director who runs 4 tournaments with 50 anglers each in their first {f.windowMonths} months earns the affiliate about <span className="font-semibold text-[#0D1B4C]">{formatMoney(Math.round(perAngler * 200 * 100) / 100)}</span>.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className={BTN}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save settings</button>
        {msg && <span className={`text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`} role="status">{msg.text}</span>}
      </div>
    </section>
  );
}

function Kpis({ ins }: { ins: AffiliateInsights }) {
  const delta = ins.earnedLastMonth ? Math.round(((ins.earnedThisMonth - ins.earnedLastMonth) / ins.earnedLastMonth) * 100) : null;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      <Tile icon={UserCheck} label="Active affiliates" value={String(ins.counts.active)} sub={`${ins.counts.pending} application${ins.counts.pending === 1 ? '' : 's'} to review`} tone={ins.counts.pending ? 'down' : undefined} />
      <Tile icon={Users} label="Referred directors" value={String(ins.referrals)} sub={`${ins.earningReferrals} still earning`} />
      <Tile icon={Receipt} label="HOOX revenue generated" value={money(ins.hooxRevenue)} sub={`${ins.registrations} registration${ins.registrations === 1 ? '' : 's'}`} />
      <Tile icon={ins.earnedThisMonth >= ins.earnedLastMonth ? TrendingUp : TrendingDown} label="Commission this month" value={money(ins.earnedThisMonth)}
        sub={delta === null ? `${money(ins.earned)} all time` : `${delta >= 0 ? '+' : ''}${delta}% vs last month`} tone={delta === null ? undefined : delta >= 0 ? 'up' : 'down'} />
      <Tile icon={Banknote} label="Paid to affiliates" value={money(ins.paid)} sub={`of ${money(ins.earned)} earned`} />
      <Tile icon={Wallet} label="Owed to affiliates" value={money(ins.owed)} sub={`${ins.readyToPay.length} ready to pay`} tone={ins.readyToPay.length ? 'down' : undefined} />
    </div>
  );
}

export function AffiliateOverview() {
  const { data, ins, error, reload, setData } = useAffiliateData();
  const [busy, setBusy] = useState<string | null>(null);
  const decide = async (id: string, status: 'active' | 'declined') => {
    setBusy(id);
    try { await api(`/api/admin/affiliates/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); await reload(); } finally { setBusy(null); }
  };
  return (
    <div>
      <Header title="Affiliate Management" sub="Affiliates refer tournament directors and earn a share of HOOX’s cut on every angler registration" />
      {error && <ErrorNote>{error}</ErrorNote>}
      {!data || !ins ? <Loading /> : (
        <div className="space-y-5">
          <Kpis ins={ins} />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <section className={CARD} aria-labelledby="ov-apps">
              <div className="flex items-center justify-between gap-3">
                <h3 id="ov-apps" className="font-semibold text-[#0D1B4C]">Applications to review</h3>
                <Link href="/admin/marketing/affiliates/accounts?status=pending" className="flex items-center gap-1 text-sm font-semibold text-[#0E7C7B] hover:underline">All applications <ArrowRight className="h-4 w-4" /></Link>
              </div>
              {data.affiliates.filter((a) => a.status === 'pending').length === 0 ? <p className="mt-3 text-sm text-[#8A9AB0]">No applications waiting.</p> : (
                <ul className="mt-3 divide-y divide-[#EEF3F8] text-sm">
                  {data.affiliates.filter((a) => a.status === 'pending').slice(0, 6).map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                      <span className="min-w-0">
                        <Link href={`/admin/marketing/affiliates/accounts?open=${a.id}`} className="block truncate font-medium text-[#0D1B4C] hover:underline">{a.name}{a.organization ? ` · ${a.organization}` : ''}</Link>
                        <span className="block truncate text-xs text-[#6B7D93]">{a.email} · applied {fmtDate(a.created_at)}</span>
                      </span>
                      <span className="flex flex-shrink-0 gap-1.5">
                        <button type="button" disabled={busy === a.id} onClick={() => decide(a.id, 'active')} className="rounded-md bg-[#0E7C7B] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#0B6564] disabled:opacity-60">Approve</button>
                        <button type="button" disabled={busy === a.id} onClick={() => decide(a.id, 'declined')} className="rounded-md border border-[#D3DEE8] px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">Decline</button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className={CARD} aria-labelledby="ov-pay">
              <div className="flex items-center justify-between gap-3">
                <h3 id="ov-pay" className="font-semibold text-[#0D1B4C]">Ready to pay</h3>
                <Link href="/admin/marketing/affiliates/payouts" className="flex items-center gap-1 text-sm font-semibold text-[#0E7C7B] hover:underline">Payouts <ArrowRight className="h-4 w-4" /></Link>
              </div>
              <p className="text-xs text-[#6B7D93]">Balances of {formatMoney(data.settings.minPayout)} or more</p>
              {ins.readyToPay.length === 0 ? <p className="mt-3 text-sm text-[#8A9AB0]">Nobody is owed {formatMoney(data.settings.minPayout)} or more right now.</p> : (
                <ul className="mt-3 divide-y divide-[#EEF3F8] text-sm">
                  {ins.readyToPay.slice(0, 6).map((t) => (
                    <li key={t.affiliate.id} className="flex items-center justify-between gap-3 py-2">
                      <span className="min-w-0"><span className="block truncate font-medium text-[#0D1B4C]">{t.affiliate.name}</span><span className="block truncate text-xs text-[#6B7D93]">{t.affiliate.payout_method ? PAYOUT_METHOD_LABEL[t.affiliate.payout_method as PayoutMethod] : 'No payout method'}{t.lastPaid ? ` · last paid ${fmtDate(t.lastPaid)}` : ' · never paid'}</span></span>
                      <span className="flex-shrink-0 font-semibold text-amber-700">{formatMoney(t.owed)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
          <AffiliateMonthlyChart months={ins.months} />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <section className={CARD}>
              <div className="flex items-center justify-between"><h3 className="font-semibold text-[#0D1B4C]">Top affiliates</h3><Link href="/admin/marketing/affiliates/revenue" className="flex items-center gap-1 text-sm font-semibold text-[#0E7C7B] hover:underline">Revenue details <ArrowRight className="h-4 w-4" /></Link></div>
              {ins.totals.filter((t) => t.earned > 0).length === 0 ? <p className="mt-3 text-sm text-[#8A9AB0]">No commissions earned yet.</p> : (
                <table className="mt-3 w-full text-sm">
                  <thead><tr className="border-b border-[#EDF1F5] text-left text-xs uppercase text-[#7A8BA3]"><th className="py-2">Affiliate</th><th className="py-2 text-right">Directors</th><th className="py-2 text-right">Revenue</th><th className="py-2 text-right">Earned</th></tr></thead>
                  <tbody>{ins.totals.filter((t) => t.earned > 0).slice(0, 5).map((t) => (
                    <tr key={t.affiliate.id} className="border-b border-[#F2F5F8]"><td className="py-2 font-medium text-[#0D1B4C]">{t.affiliate.name}</td><td className="py-2 text-right">{t.referrals}</td><td className="py-2 text-right">{formatMoney(t.hooxRevenue)}</td><td className="py-2 text-right font-semibold text-[#0D1B4C]">{formatMoney(t.earned)}</td></tr>
                  ))}</tbody>
                </table>
              )}
            </section>
            <section className={CARD}>
              <h3 className="font-semibold text-[#0D1B4C]">Earning windows ending in 30 days</h3>
              <p className="text-xs text-[#6B7D93]">After this date the director’s registrations stop earning commission</p>
              {ins.endingSoon.length === 0 ? <p className="mt-3 text-sm text-[#8A9AB0]">None ending soon.</p> : (
                <ul className="mt-3 space-y-2 text-sm">
                  {ins.endingSoon.slice(0, 8).map((r) => (
                    <li key={r.id} className="flex justify-between gap-3"><span className="min-w-0"><span className="block truncate font-medium text-[#0D1B4C]">{r.director_name}</span><span className="block truncate text-xs text-[#6B7D93]">{nameOf(data, r.affiliate_id)}</span></span><span className="flex-shrink-0 text-xs font-medium text-amber-700">{fmtDate(referralEnds(r))}</span></li>
                  ))}
                </ul>
              )}
            </section>
          </div>
          <SettingsCard settings={data.settings} saved={data.settingsSaved} onSaved={(settings) => setData({ ...data, settings, settingsSaved: true })} />
        </div>
      )}
    </div>
  );
}

/* -------------------------------- payouts -------------------------------- */

export function AffiliatePayoutsPage() {
  const { data, ins, error, reload } = useAffiliateData();
  const [open, setOpen] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const year = todayIso().slice(0, 4);
  const del = async (id: string, amount: number) => {
    if (!window.confirm(`Delete this ${formatMoney(amount)} payout? The affiliate’s balance goes back up by that amount.`)) return;
    try { await api(`/api/admin/affiliates/payouts/${id}`, { method: 'DELETE' }); await reload(); } catch (e) { window.alert((e as Error).message); }
  };
  return (
    <div>
      <Header title="Affiliate Payouts" sub="What each affiliate is owed, and every payment HOOX has made" />
      {error && <ErrorNote>{error}</ErrorNote>}
      {!data || !ins ? <Loading /> : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile icon={Wallet} label="Owed now" value={formatMoney(ins.owed)} sub={`${ins.totals.filter((t) => t.owed > 0).length} affiliate${ins.totals.filter((t) => t.owed > 0).length === 1 ? '' : 's'}`} tone={ins.owed > 0 ? 'down' : undefined} />
            <Tile icon={Clock} label="Ready to pay" value={String(ins.readyToPay.length)} sub={`Balances ≥ ${formatMoney(data.settings.minPayout)}`} />
            <Tile icon={Banknote} label="Paid this year" value={formatMoney(data.payouts.filter((p) => p.paid_at.startsWith(year)).reduce((n, p) => n + Number(p.amount), 0))} sub={`${data.payouts.filter((p) => p.paid_at.startsWith(year)).length} payouts`} />
            <Tile icon={Receipt} label="Paid all time" value={formatMoney(ins.paid)} sub={`of ${formatMoney(ins.earned)} earned`} />
          </div>

          <section className={CARD} aria-labelledby="balances">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 id="balances" className="font-semibold text-[#0D1B4C]">Balances</h3>
              <label className="flex items-center gap-2 text-sm text-[#2E3F5C]"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="h-4 w-4 accent-[#0E7C7B]" />Show affiliates with nothing owed</label>
            </div>
            <div className="mt-3 overflow-x-auto">
              {(() => {
                const rows = ins.totals.filter((t) => showAll || t.owed > 0);
                if (rows.length === 0) return <p className="py-6 text-center text-sm text-[#8A9AB0]">Nobody is owed anything right now.</p>;
                return (
                  <table className="w-full min-w-[820px] text-sm">
                    <thead><tr className="border-b border-[#EDF1F5] text-left text-xs uppercase text-[#7A8BA3]"><th className="px-3 py-2">Affiliate</th><th className="px-3 py-2">Pay to</th><th className="px-3 py-2 text-right">Earned</th><th className="px-3 py-2 text-right">Paid</th><th className="px-3 py-2 text-right">Owed</th><th className="px-3 py-2">Last paid</th><th className="px-3 py-2" /></tr></thead>
                    <tbody>
                      {rows.map((t) => (
                        <Fragment key={t.affiliate.id}>
                          <tr className="border-b border-[#F2F5F8]">
                            <td className="px-3 py-2.5"><span className="block font-medium text-[#0D1B4C]">{t.affiliate.name}</span><span className="block text-xs text-[#6B7D93]"><StatusPill status={t.affiliate.status} /></span></td>
                            <td className="px-3 py-2.5 text-[#4A5B76]">{t.affiliate.payout_method ? PAYOUT_METHOD_LABEL[t.affiliate.payout_method as PayoutMethod] : <span className="text-amber-700">Not set</span>}{t.affiliate.payout_details ? <span className="block text-xs text-[#6B7D93]">{t.affiliate.payout_details}</span> : null}</td>
                            <td className="px-3 py-2.5 text-right">{formatMoney(t.earned)}</td>
                            <td className="px-3 py-2.5 text-right">{formatMoney(t.paid)}</td>
                            <td className={`py-2.5 text-right font-semibold ${t.owed >= data.settings.minPayout && t.owed > 0 ? 'text-amber-700' : 'text-[#0D1B4C]'}`}>{formatMoney(t.owed)}</td>
                            <td className="px-3 py-2.5 text-[#5F6F86]">{t.lastPaid ? fmtDate(t.lastPaid) : '—'}</td>
                            <td className="px-3 py-2.5 text-right"><button type="button" onClick={() => setOpen(open === t.affiliate.id ? null : t.affiliate.id)} className={BTN_GHOST}>{open === t.affiliate.id ? 'Close' : 'Record payout'}</button></td>
                          </tr>
                          {open === t.affiliate.id && <tr><td colSpan={7} className="bg-[#FAFCFD] p-3"><RecordPayout affiliate={t.affiliate} owed={t.owed} compact onSaved={async () => { await reload(); setOpen(null); }} /></td></tr>}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </section>

          <section className={CARD} aria-labelledby="history">
            <h3 id="history" className="font-semibold text-[#0D1B4C]">Payout history</h3>
            {data.payouts.length === 0 ? <p className="mt-3 text-sm text-[#8A9AB0]">No payouts recorded yet.</p> : (
              <div className="overflow-x-auto">
                <table className="mt-3 w-full min-w-[720px] text-sm">
                  <thead><tr className="border-b border-[#EDF1F5] text-left text-xs uppercase text-[#7A8BA3]"><th className="py-2">Paid on</th><th className="py-2">Affiliate</th><th className="py-2">Method</th><th className="py-2">Reference</th><th className="py-2">Notes</th><th className="py-2 text-right">Amount</th><th className="py-2" /></tr></thead>
                  <tbody>
                    {data.payouts.map((p) => (
                      <tr key={p.id} className="border-b border-[#F2F5F8]">
                        <td className="py-2 text-[#2E3F5C]">{fmtDate(p.paid_at)}</td>
                        <td className="py-2 font-medium text-[#0D1B4C]">{nameOf(data, p.affiliate_id)}</td>
                        <td className="py-2 text-[#4A5B76]">{p.method ? PAYOUT_METHOD_LABEL[p.method] : '—'}</td>
                        <td className="py-2 text-[#4A5B76]">{p.reference || '—'}</td>
                        <td className="py-2 text-[#6B7D93]">{p.notes || ''}</td>
                        <td className="py-2 text-right font-semibold text-[#0D1B4C]">{formatMoney(Number(p.amount))}</td>
                        <td className="py-2 text-right"><button type="button" onClick={() => del(p.id, Number(p.amount))} className="rounded p-1 text-[#8A9AB0] hover:bg-red-50 hover:text-red-600" aria-label="Delete payout"><Trash2 className="h-4 w-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- revenue -------------------------------- */

export function AffiliateRevenuePage() {
  const { data, ins, error } = useAffiliateData();
  const byTournament = useMemo(() => {
    if (!ins || !data) return [];
    const m = new Map<string, { name: string; start: string; director: string; affiliate: string; regs: number; fees: number; revenue: number; commission: number }>();
    ins.lines.forEach((l) => {
      const e = m.get(l.tournament.id) ?? { name: l.tournament.name, start: l.tournament.start_date, director: l.referral.director_name, affiliate: nameOf(data, l.referral.affiliate_id), regs: 0, fees: 0, revenue: 0, commission: 0 };
      e.regs++; e.fees += Number(l.registration.fee ?? 0); e.revenue += l.hooxCut; e.commission += l.commission;
      m.set(l.tournament.id, e);
    });
    return [...m.values()].sort((a, b) => b.revenue - a.revenue);
  }, [ins, data]);

  return (
    <div>
      <Header title="Affiliate Revenue" sub="Revenue generated by each affiliate’s referred directors, and the commission distributed to them" />
      {error && <ErrorNote>{error}</ErrorNote>}
      {!data || !ins ? <Loading /> : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <Tile icon={Receipt} label="Entry fees collected" value={money(ins.entryFees)} sub="On referred directors’ tournaments" />
            <Tile icon={TrendingUp} label="HOOX revenue generated" value={money(ins.hooxRevenue)} sub={`${ins.registrations} registrations`} />
            <Tile icon={Percent} label="Commission earned" value={money(ins.earned)} sub={ins.hooxRevenue ? `${Math.round((ins.earned / ins.hooxRevenue) * 100)}% of HOOX revenue` : '—'} />
            <Tile icon={Banknote} label="Distributed (paid)" value={money(ins.paid)} sub={`${data.payouts.length} payouts`} />
            <Tile icon={Wallet} label="Owed" value={money(ins.owed)} sub="Earned, not paid yet" tone={ins.owed > 0 ? 'down' : undefined} />
            <Tile icon={TrendingUp} label="HOOX keeps" value={money(ins.netRevenue)} sub="Revenue minus commission" tone="up" />
          </div>

          <AffiliateMonthlyChart months={ins.months} />

          <section className={CARD} aria-labelledby="by-aff">
            <h3 id="by-aff" className="font-semibold text-[#0D1B4C]">By affiliate</h3>
            <p className="text-xs text-[#6B7D93]">Revenue generated and commission distributed, all time</p>
            {ins.totals.length === 0 ? <p className="mt-3 text-sm text-[#8A9AB0]">No affiliates yet.</p> : (
              <div className="overflow-x-auto">
                <table className="mt-3 w-full min-w-[980px] text-sm">
                  <thead><tr className="border-b border-[#EDF1F5] text-left text-xs uppercase text-[#7A8BA3]"><th className="py-2">Affiliate</th><th className="py-2 text-right">Rate</th><th className="py-2 text-right">Directors</th><th className="py-2 text-right">Tournaments</th><th className="py-2 text-right">Registrations</th><th className="py-2 text-right">Entry fees</th><th className="py-2 text-right">HOOX revenue</th><th className="py-2 text-right">Commission</th><th className="py-2 text-right">Paid</th><th className="py-2 text-right">Owed</th></tr></thead>
                  <tbody>
                    {ins.totals.map((t) => (
                      <tr key={t.affiliate.id} className="border-b border-[#F2F5F8]">
                        <td className="py-2"><Link href={`/admin/marketing/affiliates/accounts?open=${t.affiliate.id}`} className="font-medium text-[#0D1B4C] hover:text-[#0E7C7B] hover:underline">{t.affiliate.name}</Link></td>
                        <td className="py-2 text-right">{pct(t.affiliate.rate_percent)}</td>
                        <td className="py-2 text-right">{t.referrals}</td>
                        <td className="py-2 text-right">{t.tournaments}</td>
                        <td className="py-2 text-right">{t.registrations}</td>
                        <td className="py-2 text-right">{formatMoney(t.entryFees)}</td>
                        <td className="py-2 text-right">{formatMoney(t.hooxRevenue)}</td>
                        <td className="py-2 text-right font-semibold text-[#0D1B4C]">{formatMoney(t.earned)}</td>
                        <td className="py-2 text-right text-green-700">{formatMoney(t.paid)}</td>
                        <td className={`py-2 text-right ${t.owed > 0 ? 'font-semibold text-amber-700' : 'text-[#8A9AB0]'}`}>{formatMoney(t.owed)}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold text-[#0D1B4C]">
                      <td className="py-2">Total</td><td /><td className="py-2 text-right">{ins.referrals}</td><td className="py-2 text-right">{byTournament.length}</td><td className="py-2 text-right">{ins.registrations}</td>
                      <td className="py-2 text-right">{formatMoney(ins.entryFees)}</td><td className="py-2 text-right">{formatMoney(ins.hooxRevenue)}</td><td className="py-2 text-right">{formatMoney(ins.earned)}</td><td className="py-2 text-right">{formatMoney(ins.paid)}</td><td className="py-2 text-right">{formatMoney(ins.owed)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <section className={CARD} aria-labelledby="by-t">
              <h3 id="by-t" className="font-semibold text-[#0D1B4C]">By tournament</h3>
              {byTournament.length === 0 ? <p className="mt-3 text-sm text-[#8A9AB0]">No registrations from referred directors yet.</p> : (
                <div className="overflow-x-auto">
                  <table className="mt-3 w-full min-w-[560px] text-sm">
                    <thead><tr className="border-b border-[#EDF1F5] text-left text-xs uppercase text-[#7A8BA3]"><th className="py-2">Tournament</th><th className="py-2">Affiliate</th><th className="py-2 text-right">Anglers</th><th className="py-2 text-right">HOOX revenue</th><th className="py-2 text-right">Commission</th></tr></thead>
                    <tbody>{byTournament.slice(0, 15).map((t) => (
                      <tr key={t.name + t.start} className="border-b border-[#F2F5F8]">
                        <td className="py-2"><span className="block font-medium text-[#0D1B4C]">{t.name}</span><span className="block text-xs text-[#6B7D93]">{t.director} · {fmtDate(t.start)}</span></td>
                        <td className="py-2 text-[#4A5B76]">{t.affiliate}</td>
                        <td className="py-2 text-right">{t.regs}</td>
                        <td className="py-2 text-right">{formatMoney(Math.round(t.revenue * 100) / 100)}</td>
                        <td className="py-2 text-right font-semibold text-[#0D1B4C]">{formatMoney(Math.round(t.commission * 100) / 100)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </section>
            <section className={CARD} aria-labelledby="recent">
              <h3 id="recent" className="font-semibold text-[#0D1B4C]">Latest credited registrations</h3>
              {ins.lines.length === 0 ? <p className="mt-3 text-sm text-[#8A9AB0]">Nothing yet.</p> : (
                <div className="overflow-x-auto">
                  <table className="mt-3 w-full min-w-[520px] text-sm">
                    <thead><tr className="border-b border-[#EDF1F5] text-left text-xs uppercase text-[#7A8BA3]"><th className="py-2">Registered</th><th className="py-2">Tournament</th><th className="py-2">Affiliate</th><th className="py-2 text-right">HOOX cut</th><th className="py-2 text-right">Commission</th></tr></thead>
                    <tbody>{ins.lines.slice(0, 15).map((l) => (
                      <tr key={l.registration.id} className="border-b border-[#F2F5F8]">
                        <td className="py-2 text-[#2E3F5C]">{fmtDate(l.registration.registered_at)}</td>
                        <td className="py-2 text-[#2E3F5C]">{l.tournament.name}</td>
                        <td className="py-2 text-[#4A5B76]">{nameOf(data, l.referral.affiliate_id)}</td>
                        <td className="py-2 text-right">{formatMoney(l.hooxCut)}</td>
                        <td className="py-2 text-right font-semibold text-[#0D1B4C]">{formatMoney(l.commission)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
          <p className="text-xs text-[#8A9AB0]"><span className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: REVENUE_COLOR }} />HOOX revenue is HOOX’s cut of each registration (or {formatMoney(data.settings.fallbackFee)} when a registration doesn’t record it). <span className="mx-1 inline-block h-2 w-2 rounded-sm" style={{ background: COMMISSION_COLOR }} />Commission is that cut × the rate locked in when the director was referred.</p>
        </div>
      )}
    </div>
  );
}
