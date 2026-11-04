'use client';

/* ------------------------------------------------------------------ */
/* Admin → Marketing → Sponsor Programs                               */
/*   SponsorProgramsDashboard  overview | promotions | packages tabs   */
/*   SponsorAccountsPage       Customer Accounts (sponsor brands)      */
/*   BrandPromotionRevenuePage Brand Promotion Revenue insights        */
/* ------------------------------------------------------------------ */

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Loader2, Building2, Radio, Receipt, Wallet, Clock, TrendingUp, TrendingDown, Search, Plus, Mail, Phone, Globe, X, Trash2, ChevronDown, Handshake,
} from 'lucide-react';
import {
  computeSponsorInsights, KIND_META, SPONSOR_KINDS, SPONSOR_CATEGORIES, ACCOUNT_STATUSES, ACCOUNT_STATUS_META, phaseOf, owedOf, paidOf, todayIso, formatMoney,
  type DbSponsorAccount, type AccountStatus, type SponsorInsights,
} from '@/lib/sponsors';
import {
  Header, Tile, CARD, INPUT, LABEL, BTN, BTN_GHOST, ErrorNote, SponsorMonthlyChart, AccountPill, KindDot, money, fmtDate, sponsorApi, useSponsorData, type SponsorData,
} from './shared';
import PromotionsManager from './PromotionsManager';
import PackagesEditor from './PackagesEditor';

const Loading = () => <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#5F6F86]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
const nameOf = (data: SponsorData, id: string) => data.accounts.find((a) => a.id === id)?.brand_name || 'Unknown sponsor';

function KpiRow({ ins, accountsTotal }: { ins: SponsorInsights; accountsTotal: number }) {
  const delta = ins.bookedLastMonth ? Math.round(((ins.bookedThisMonth - ins.bookedLastMonth) / ins.bookedLastMonth) * 100) : null;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      <Tile icon={Building2} label="Customer accounts" value={String(accountsTotal)} sub={`${ins.accounts.active} active · ${ins.accounts.prospect} prospect${ins.accounts.prospect === 1 ? '' : 's'}`} />
      <Tile icon={Radio} label="Live promotions" value={String(ins.live.length)} sub={`${ins.liveSponsors} sponsor${ins.liveSponsors === 1 ? '' : 's'} · ${ins.upcoming.length} upcoming`} />
      <Tile icon={ins.bookedThisMonth >= ins.bookedLastMonth ? TrendingUp : TrendingDown} label="Booked this month" value={money(ins.bookedThisMonth)}
        sub={delta === null ? `${money(ins.bookedYtd)} this year` : `${delta >= 0 ? '+' : ''}${delta}% vs last month`} tone={delta === null ? undefined : delta >= 0 ? 'up' : 'down'} />
      <Tile icon={Wallet} label="Collected" value={money(ins.collected)} sub={`of ${money(ins.booked)} booked`} />
      <Tile icon={Clock} label="Outstanding" value={money(ins.outstanding)} sub={`${ins.unpaid.length} unpaid promotion${ins.unpaid.length === 1 ? '' : 's'}`} tone={ins.outstanding > 0 ? 'down' : undefined} />
      <Tile icon={Receipt} label="Pipeline" value={money(ins.pipeline)} sub={`${ins.proposalCount} open proposal${ins.proposalCount === 1 ? '' : 's'}${ins.winRate !== null ? ` · ${ins.winRate}% win rate` : ''}`} />
    </div>
  );
}

function ListCard({ title, sub, empty, items }: { title: string; sub?: string; empty: string; items: { key: string; name: string; meta: string; right: string; tone?: string }[] }) {
  return (
    <section className={CARD}>
      <h3 className="font-semibold text-[#0D1B4C]">{title}</h3>
      {sub && <p className="text-xs text-[#6B7D93]">{sub}</p>}
      {items.length === 0 ? <p className="mt-3 text-sm text-[#8A9AB0]">{empty}</p> : (
        <ul className="mt-3 space-y-2 text-sm">
          {items.slice(0, 8).map((i) => (
            <li key={i.key} className="flex items-start justify-between gap-3">
              <span className="min-w-0"><span className="block truncate font-medium text-[#0D1B4C]">{i.name}</span><span className="block truncate text-xs text-[#6B7D93]">{i.meta}</span></span>
              <span className={`flex-shrink-0 text-right text-[13px] font-semibold ${i.tone || 'text-[#0D1B4C]'}`}>{i.right}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ================================ dashboard ================================ */

export type SponsorView = 'overview' | 'promotions' | 'packages';
const VIEW_META: Record<SponsorView, { title: string; sub: string }> = {
  overview: { title: 'Sponsor Programs', sub: 'HOOX sponsor tiers and brand placements: who\'s sponsoring, what\'s live and what it\'s earning' },
  promotions: { title: 'Brand Promotions', sub: 'Every sponsor tier and brand placement, proposed or booked' },
  packages: { title: 'Packages & Pricing', sub: 'The sponsor tiers and placements you sell, and what they cost' },
};

/** Sponsor Programs pages that share one data load: Overview, Brand Promotions, Packages & Pricing */
export function SponsorProgramsDashboard({ view = 'overview' }: { view?: SponsorView }) {
  const { data, error, reload, setData } = useSponsorData();
  const [params] = useState(() => (typeof window === 'undefined' ? null : new URLSearchParams(window.location.search)));
  const ins = useMemo(() => (data ? computeSponsorInsights(data.accounts, data.promotions) : null), [data]);

  return (
    <div>
      <Header title={VIEW_META[view].title} sub={VIEW_META[view].sub} />
      {error && <ErrorNote>{error}</ErrorNote>}
      {!data || !ins ? <Loading /> : (
        <>
          {view === 'overview' && <Overview data={data} ins={ins} />}
          {view === 'promotions' && <PromotionsManager data={data} reload={reload} initialAccountId={params?.get('account') || null} startAdding={params?.has('add')} />}
          {view === 'packages' && <PackagesEditor data={data} onSaved={(packages) => setData({ ...data, packages, packagesSaved: true })} />}
        </>
      )}
    </div>
  );
}

function Overview({ data, ins }: { data: SponsorData; ins: SponsorInsights }) {
  const today = todayIso();
  const proposals = data.promotions.filter((p) => p.status === 'proposal');
  return (
    <div className="space-y-5">
      <KpiRow ins={ins} accountsTotal={data.accounts.length} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Customer accounts summary */}
        <section className={CARD} aria-labelledby="ov-accounts">
          <div className="flex items-center justify-between gap-3">
            <h3 id="ov-accounts" className="font-semibold text-[#0D1B4C]">Customer accounts</h3>
            <Link href="/admin/marketing/sponsors/accounts" className="flex items-center gap-1 text-sm font-semibold text-[#0E7C7B] hover:underline">View all <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
            {ACCOUNT_STATUSES.map((s) => (
              <div key={s} className="rounded-lg bg-[#F7FAFC] px-3 py-2"><dt className="text-xs text-[#6B7D93]">{ACCOUNT_STATUS_META[s].label}</dt><dd className="font-montserrat text-xl font-bold text-[#0D1B4C]">{ins.accounts[s]}</dd></div>
            ))}
          </dl>
          <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#7A8BA3]">Top sponsors</h4>
          {ins.topSponsors.length === 0 ? <p className="mt-2 text-sm text-[#8A9AB0]">No booked sponsors yet.</p> : (
            <ul className="mt-2 divide-y divide-[#EEF3F8] text-sm">
              {ins.topSponsors.slice(0, 5).map((t) => (
                <li key={t.account.id} className="flex items-center justify-between gap-3 py-1.5">
                  <span className="min-w-0 truncate font-medium text-[#0D1B4C]">{t.account.brand_name}{t.live > 0 && <span className="ml-2 text-xs font-semibold text-green-700">● live</span>}</span>
                  <span className="flex-shrink-0 font-semibold text-[#0D1B4C]">{formatMoney(t.booked)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Brand promotions summary */}
        <section className={CARD} aria-labelledby="ov-promos">
          <div className="flex items-center justify-between gap-3">
            <h3 id="ov-promos" className="font-semibold text-[#0D1B4C]">Brand promotions</h3>
            <Link href="/admin/marketing/sponsors/promotions" className="flex items-center gap-1 text-sm font-semibold text-[#0E7C7B] hover:underline">Manage <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-3 text-sm">
            {SPONSOR_KINDS.map((k) => (
              <li key={k} className="rounded-lg bg-[#F7FAFC] px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs text-[#6B7D93]"><KindDot kind={k} />{KIND_META[k].label}</span>
                <span className="block font-montserrat text-xl font-bold text-[#0D1B4C]">{formatMoney(ins.byKind[k].booked)}</span>
                <span className="block text-xs text-[#6B7D93]">{ins.live.filter((p) => p.kind === k).length} live · {ins.byKind[k].count} booked all time</span>
              </li>
            ))}
          </ul>
          <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#7A8BA3]">Live now</h4>
          {ins.live.length === 0 ? <p className="mt-2 text-sm text-[#8A9AB0]">Nothing live right now.</p> : (
            <ul className="mt-2 divide-y divide-[#EEF3F8] text-sm">
              {ins.live.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-1.5">
                  <span className="flex min-w-0 items-center gap-2"><KindDot kind={p.kind} /><span className="truncate"><span className="font-medium text-[#0D1B4C]">{nameOf(data, p.account_id)}</span> <span className="text-[#6B7D93]">· {p.package_name}</span></span></span>
                  <span className="flex-shrink-0 text-xs text-[#6B7D93]">until {fmtDate(p.end_date)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/admin/marketing/sponsors/promotions?add=1" className={BTN}><Plus className="h-4 w-4" />Add promotion</Link>
            <Link href="/admin/marketing/sponsors/revenue" className={BTN_GHOST}>Revenue insights</Link>
          </div>
        </section>
      </div>

      <SponsorMonthlyChart months={ins.months} compact />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ListCard title="Open proposals" sub="Waiting on the sponsor" empty="No open proposals."
          items={proposals.map((p) => ({ key: p.id, name: nameOf(data, p.account_id), meta: `${p.package_name} · starts ${fmtDate(p.start_date)}`, right: formatMoney(Number(p.price)) }))} />
        <ListCard title="Ending in the next 30 days" sub="A good time to talk renewal" empty="Nothing ending soon."
          items={ins.expiring.map((p) => ({ key: p.id, name: nameOf(data, p.account_id), meta: p.package_name, right: fmtDate(p.end_date), tone: 'text-amber-700' }))} />
        <ListCard title="Awaiting payment" sub="Booked but not fully paid, oldest first" empty="All booked promotions are paid."
          items={ins.unpaid.map((p) => ({ key: p.id, name: nameOf(data, p.account_id), meta: `${p.package_name} · ${phaseOf(p, today)}`, right: formatMoney(owedOf(p)) }))} />
      </div>
    </div>
  );
}

/* ============================ customer accounts ============================ */

const blankAccount = { brandName: '', website: '', logoUrl: '', category: '', contactName: '', contactEmail: '', contactPhone: '', status: 'prospect' as AccountStatus, notes: '' };
type AccountForm = typeof blankAccount;
const formOf = (a: DbSponsorAccount): AccountForm => ({
  brandName: a.brand_name, website: a.website || '', logoUrl: a.logo_url || '', category: a.category || '', contactName: a.contact_name || '',
  contactEmail: a.contact_email || '', contactPhone: a.contact_phone || '', status: a.status, notes: a.notes || '',
});

function AccountFields({ f, set }: { f: AccountForm; set: (f: AccountForm) => void }) {
  const field = (k: keyof AccountForm, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label><span className={LABEL}>{label}</span><input className={INPUT} value={f[k]} onChange={(e) => set({ ...f, [k]: e.target.value })} {...props} /></label>
  );
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {field('brandName', 'Brand name', { placeholder: 'e.g. Delta Tackle Co.' })}
      <label><span className={LABEL}>Category</span>
        <select className={INPUT} value={f.category} onChange={(e) => set({ ...f, category: e.target.value })}>
          <option value="">Choose…</option>
          {SPONSOR_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      {field('website', 'Website', { placeholder: 'deltatackle.com' })}
      <label><span className={LABEL}>Status</span>
        <select className={INPUT} value={f.status} onChange={(e) => set({ ...f, status: e.target.value as AccountStatus })}>
          {ACCOUNT_STATUSES.map((s) => <option key={s} value={s}>{ACCOUNT_STATUS_META[s].label}</option>)}
        </select>
      </label>
      {field('contactName', 'Contact name')}
      {field('contactEmail', 'Contact email', { type: 'email' })}
      {field('contactPhone', 'Contact phone', { type: 'tel' })}
      {field('logoUrl', 'Logo URL', { placeholder: 'https://…' })}
      <label className="md:col-span-2 xl:col-span-4"><span className={LABEL}>Notes</span>
        <textarea rows={2} className={`${INPUT} h-auto py-2`} value={f.notes} onChange={(e) => set({ ...f, notes: e.target.value })} placeholder="Decision maker, budget timing, past conversations…" />
      </label>
    </div>
  );
}

export function SponsorAccountsPage() {
  const { data, error, reload } = useSponsorData();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<AccountStatus | 'all'>('all');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<AccountForm>(blankAccount);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const today = todayIso();

  const rows = useMemo(() => {
    if (!data) return [];
    return data.accounts.map((a) => {
      const ps = data.promotions.filter((p) => p.account_id === a.id);
      const booked = ps.filter((p) => p.status === 'booked');
      return {
        a, promotions: ps.length,
        live: booked.filter((p) => phaseOf(p, today) === 'live').length,
        booked: booked.reduce((n, p) => n + Number(p.price), 0),
        paid: ps.reduce((n, p) => n + paidOf(p), 0),
        owed: booked.reduce((n, p) => n + owedOf(p), 0),
        lastEnd: booked.map((p) => p.end_date).sort().pop() || null,
      };
    }).sort((x, y) => y.booked - x.booked || x.a.brand_name.localeCompare(y.a.brand_name));
  }, [data, today]);
  const t = q.trim().toLowerCase();
  const shown = rows.filter((r) => (status === 'all' || r.a.status === status) && (!t || [r.a.brand_name, r.a.contact_name, r.a.contact_email, r.a.category].some((v) => (v || '').toLowerCase().includes(t))));

  const create = async () => {
    setBusy(true); setErr(null);
    try {
      await sponsorApi('/api/admin/sponsors/accounts', { method: 'POST', body: JSON.stringify(form) });
      setForm(blankAccount); setAdding(false); await reload();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div>
      <Header title="Customer Accounts" sub="Every brand that sponsors HOOX, or that you're talking to" />
      {error && <ErrorNote>{error}</ErrorNote>}
      {!data ? <Loading /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile icon={Building2} label="All accounts" value={String(data.accounts.length)} sub={`${rows.filter((r) => r.live > 0).length} with something live`} />
            {ACCOUNT_STATUSES.map((s) => <Tile key={s} icon={s === 'active' ? Handshake : s === 'prospect' ? TrendingUp : Clock} label={ACCOUNT_STATUS_META[s].label} value={String(data.accounts.filter((a) => a.status === s).length)}
              sub={s === 'active' ? `${formatMoney(rows.filter((r) => r.a.status === 'active').reduce((n, r) => n + r.booked, 0))} booked` : s === 'prospect' ? (() => { const n = data.promotions.filter((p) => p.status === 'proposal').length; return `${n} open proposal${n === 1 ? '' : 's'}`; })() : 'Past sponsors'} />)}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative block w-[280px]">
                <span className="sr-only">Search accounts</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9AB0]" />
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brand, contact or category" className={`${INPUT} pl-9`} />
              </label>
              <select aria-label="Filter by status" className={`${INPUT.replace('w-full', '')} w-[150px]`} value={status} onChange={(e) => setStatus(e.target.value as AccountStatus | 'all')}>
                <option value="all">All statuses</option>
                {ACCOUNT_STATUSES.map((s) => <option key={s} value={s}>{ACCOUNT_STATUS_META[s].label}</option>)}
              </select>
            </div>
            {!adding && <button type="button" onClick={() => setAdding(true)} className={BTN}><Plus className="h-4 w-4" />Add sponsor</button>}
          </div>

          {adding && (
            <section className={CARD} aria-labelledby="add-acct">
              <div className="mb-4 flex items-center justify-between">
                <h3 id="add-acct" className="font-semibold text-[#0D1B4C]">Add a sponsor brand</h3>
                <button type="button" onClick={() => setAdding(false)} className="rounded p-1 text-[#8A9AB0] hover:bg-[#F2F7FA]" aria-label="Close"><X className="h-4 w-4" /></button>
              </div>
              <AccountFields f={form} set={setForm} />
              {err && <p className="mt-3 text-sm text-red-600" role="alert">{err}</p>}
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={create} disabled={busy} className={BTN}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save sponsor</button>
                <button type="button" onClick={() => setAdding(false)} className={BTN_GHOST}>Cancel</button>
              </div>
            </section>
          )}

          <div className="overflow-x-auto rounded-lg border border-[#E8EEF4] bg-white shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
            {shown.length === 0 ? <p className="py-10 text-center text-sm text-[#5F6F86]">{data.accounts.length === 0 ? 'No sponsors yet. Add your first brand above.' : 'No accounts match.'}</p> : (
              <table className="w-full min-w-[900px] text-sm">
                <thead className="border-b border-[#EEF3F8] bg-[#F7FAFC] text-left text-xs uppercase text-[#7A8BA3]">
                  <tr><th className="px-4 py-3">Brand</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Promotions</th><th className="px-4 py-3 text-right">Live</th><th className="px-4 py-3 text-right">Booked</th><th className="px-4 py-3 text-right">Owed</th><th className="px-4 py-3">Sponsored until</th><th className="w-8 px-2" /></tr>
                </thead>
                <tbody className="divide-y divide-[#EEF3F8]">
                  {shown.map((r) => (
                    <Fragment key={r.a.id}>
                      <tr className="cursor-pointer hover:bg-[#F7FAFC]" onClick={() => setOpen(open === r.a.id ? null : r.a.id)} aria-expanded={open === r.a.id}>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2.5">
                            {r.a.logo_url
                              ? <img src={r.a.logo_url} alt="" className="h-8 w-8 flex-shrink-0 rounded border border-[#E3EAF1] bg-white object-contain" />
                              : <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-[#E6F4F5] font-montserrat text-xs font-bold text-[#0E7C7B]">{r.a.brand_name.slice(0, 2).toUpperCase()}</span>}
                            <span><span className="block font-medium text-[#0D1B4C]">{r.a.brand_name}</span><span className="block text-xs text-[#6B7D93]">{r.a.category || 'No category'}</span></span>
                          </span>
                        </td>
                        <td className="px-4 py-3"><span className="block text-[#2E3F5C]">{r.a.contact_name || '—'}</span>{r.a.contact_email && <a href={`mailto:${r.a.contact_email}`} onClick={(e) => e.stopPropagation()} className="text-xs text-[#0E7C7B] hover:underline">{r.a.contact_email}</a>}</td>
                        <td className="px-4 py-3"><AccountPill status={r.a.status} /></td>
                        <td className="px-4 py-3 text-right">{r.promotions}</td>
                        <td className="px-4 py-3 text-right">{r.live}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[#0D1B4C]">{formatMoney(r.booked)}</td>
                        <td className={`px-4 py-3 text-right ${r.owed > 0 ? 'font-semibold text-amber-700' : 'text-[#8A9AB0]'}`}>{r.owed > 0 ? formatMoney(r.owed) : '—'}</td>
                        <td className="px-4 py-3 text-[#5F6F86]">{r.lastEnd ? fmtDate(r.lastEnd) : '—'}</td>
                        <td className="px-2 py-3"><ChevronDown className={`h-4 w-4 text-[#8A9AB0] transition ${open === r.a.id ? 'rotate-180' : ''}`} /></td>
                      </tr>
                      {open === r.a.id && <tr className="bg-[#FAFCFD]"><td colSpan={9} className="px-4 py-4"><AccountDetail data={data} a={r.a} reload={reload} onDeleted={() => setOpen(null)} /></td></tr>}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AccountDetail({ data, a, reload, onDeleted }: { data: SponsorData; a: DbSponsorAccount; reload: () => Promise<void>; onDeleted: () => void }) {
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState<AccountForm>(() => formOf(a));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const hasPromos = data.promotions.some((p) => p.account_id === a.id);

  const save = async () => {
    setBusy(true); setMsg(null);
    try { await sponsorApi(`/api/admin/sponsors/accounts/${a.id}`, { method: 'PATCH', body: JSON.stringify(f) }); await reload(); setEditing(false); setMsg({ ok: true, text: 'Saved.' }); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
  };
  const del = async () => {
    if (!window.confirm(`Delete ${a.brand_name}? This can’t be undone.`)) return;
    setBusy(true);
    try { await sponsorApi(`/api/admin/sponsors/accounts/${a.id}`, { method: 'DELETE' }); onDeleted(); await reload(); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); setBusy(false); }
  };

  return (
    <div className="space-y-5">
      {editing ? (
        <div>
          <AccountFields f={f} set={setF} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={save} disabled={busy} className={BTN}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save changes</button>
            <button type="button" onClick={() => { setEditing(false); setF(formOf(a)); }} className={BTN_GHOST}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[13px] text-[#2E3F5C]">
            {a.website && <a href={a.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#0E7C7B] hover:underline"><Globe className="h-3.5 w-3.5" />{a.website.replace(/^https?:\/\//, '')}</a>}
            {a.contact_email && <a href={`mailto:${a.contact_email}`} className="flex items-center gap-1.5 text-[#0E7C7B] hover:underline"><Mail className="h-3.5 w-3.5" />{a.contact_email}</a>}
            {a.contact_phone && <a href={`tel:${a.contact_phone}`} className="flex items-center gap-1.5 hover:underline"><Phone className="h-3.5 w-3.5" />{a.contact_phone}</a>}
            <span className="text-[#6B7D93]">Added {fmtDate(a.created_at)}</span>
            {a.notes && <p className="w-full whitespace-pre-line text-[#4A5B76]">{a.notes}</p>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditing(true)} className={BTN_GHOST}>Edit details</button>
            <button type="button" onClick={del} disabled={busy || hasPromos} title={hasPromos ? 'Brands with promotions can’t be deleted. Mark them Inactive instead.' : undefined} className={`${BTN_GHOST} text-red-600 hover:bg-red-50`}><Trash2 className="h-4 w-4" />Delete</button>
          </div>
        </div>
      )}
      {msg && <p className={`text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`} role="status">{msg.text}</p>}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7A8BA3]">Brand promotions</h4>
        <PromotionsManager data={data} reload={reload} accountId={a.id} />
      </div>
    </div>
  );
}

/* ========================= brand promotion revenue ========================= */

function Bars({ title, sub, rows }: { title: string; sub?: string; rows: { key: string; label: React.ReactNode; value: number; meta: string; color: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className={CARD}>
      <h3 className="font-semibold text-[#0D1B4C]">{title}</h3>
      {sub && <p className="text-xs text-[#6B7D93]">{sub}</p>}
      {rows.length === 0 ? <p className="mt-3 text-sm text-[#8A9AB0]">No booked promotions yet.</p> : (
        <ul className="mt-4 space-y-3">
          {rows.map((r) => (
            <li key={r.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-[#0D1B4C]">{r.label}</span>
                <span className="flex-shrink-0 font-semibold text-[#0D1B4C]">{formatMoney(r.value)}</span>
              </div>
              <div className="mt-1 h-[12px] w-full" title={`${formatMoney(r.value)} booked`}>
                <div className="h-full rounded-r-[4px]" style={{ width: `${Math.max(r.value > 0 ? 1.5 : 0, (r.value / max) * 100)}%`, background: r.color }} />
              </div>
              <p className="mt-0.5 text-xs text-[#6B7D93]">{r.meta}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function BrandPromotionRevenuePage() {
  const { data, error } = useSponsorData();
  const ins = useMemo(() => (data ? computeSponsorInsights(data.accounts, data.promotions) : null), [data]);
  const today = todayIso();
  return (
    <div>
      <Header title="Brand Promotion Revenue" sub="Sponsor tiers and brand placements · booked, collected and outstanding" />
      {error && <ErrorNote>{error}</ErrorNote>}
      {!data || !ins ? <Loading /> : (
        <div className="space-y-5">
          <KpiRow ins={ins} accountsTotal={data.accounts.length} />
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <SponsorMonthlyChart months={ins.months} />
            <section className={CARD}>
              <h3 className="font-semibold text-[#0D1B4C]">Tiers vs placements</h3>
              <p className="text-xs text-[#6B7D93]">All time</p>
              <ul className="mt-4 space-y-4">
                {SPONSOR_KINDS.map((k) => {
                  const total = ins.byKind.tier.booked + ins.byKind.placement.booked;
                  const pct = total ? Math.round((ins.byKind[k].booked / total) * 100) : 0;
                  return (
                    <li key={k}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium text-[#0D1B4C]"><KindDot kind={k} />{KIND_META[k].label}</span>
                        <span><span className="font-semibold text-[#0D1B4C]">{formatMoney(ins.byKind[k].booked)}</span> <span className="text-[#6B7D93]">· {pct}%</span></span>
                      </div>
                      <div className="mt-1.5 h-[14px] w-full"><div className="h-full rounded-r-[4px]" style={{ width: `${Math.max(ins.byKind[k].booked > 0 ? 1.5 : 0, pct)}%`, background: KIND_META[k].color }} /></div>
                      <p className="mt-1 text-xs text-[#6B7D93]">{ins.byKind[k].count} booked · {ins.live.filter((p) => p.kind === k).length} live now</p>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Bars title="Booked revenue by package" sub="All time" rows={ins.byPackage.map((p) => ({ key: p.id, label: <span className="flex items-center gap-2"><KindDot kind={p.kind} />{p.name}</span>, value: p.booked, meta: `${p.count} booked · ${p.live} live now`, color: KIND_META[p.kind].color }))} />
            <Bars title="Booked revenue by sponsor category" sub="All time" rows={ins.byCategory.map((c) => ({ key: c.category, label: c.category, value: c.booked, meta: `${c.sponsors} sponsor${c.sponsors === 1 ? '' : 's'}`, color: KIND_META.tier.color }))} />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <ListCard title="Upcoming" sub="Booked, not started yet" empty="Nothing scheduled."
              items={ins.upcoming.map((p) => ({ key: p.id, name: nameOf(data, p.account_id), meta: p.package_name, right: `starts ${fmtDate(p.start_date)}` }))} />
            <ListCard title="Ending in the next 30 days" sub="A good time to talk renewal" empty="Nothing ending soon."
              items={ins.expiring.map((p) => ({ key: p.id, name: nameOf(data, p.account_id), meta: p.package_name, right: fmtDate(p.end_date), tone: 'text-amber-700' }))} />
            <ListCard title="Awaiting payment" sub="Booked but not fully paid, oldest first" empty="All booked promotions are paid."
              items={ins.unpaid.map((p) => ({ key: p.id, name: nameOf(data, p.account_id), meta: `${p.package_name} · ${phaseOf(p, today)}`, right: formatMoney(owedOf(p)) }))} />
          </div>

          <section className={CARD}>
            <h3 className="font-semibold text-[#0D1B4C]">Top sponsors by booked revenue</h3>
            {ins.topSponsors.length === 0 ? <p className="mt-3 text-sm text-[#8A9AB0]">No booked promotions yet.</p> : (
              <div className="overflow-x-auto">
                <table className="mt-3 w-full min-w-[560px] text-sm">
                  <thead><tr className="border-b border-[#EDF1F5] text-left text-xs uppercase text-[#7A8BA3]"><th className="py-2">Sponsor</th><th className="py-2">Category</th><th className="py-2 text-right">Promotions</th><th className="py-2 text-right">Live</th><th className="py-2 text-right">Booked</th><th className="py-2 text-right">Paid</th></tr></thead>
                  <tbody>
                    {ins.topSponsors.map((t) => (
                      <tr key={t.account.id} className="border-b border-[#F2F5F8]">
                        <td className="py-2 font-medium text-[#0D1B4C]">{t.account.brand_name}</td>
                        <td className="py-2 text-[#5F6F86]">{t.account.category || '—'}</td>
                        <td className="py-2 text-right">{t.promotions}</td>
                        <td className="py-2 text-right">{t.live}</td>
                        <td className="py-2 text-right font-semibold text-[#0D1B4C]">{formatMoney(t.booked)}</td>
                        <td className={`py-2 text-right ${t.paid < t.booked ? 'text-amber-700' : 'text-green-700'}`}>{formatMoney(t.paid)}</td>
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
