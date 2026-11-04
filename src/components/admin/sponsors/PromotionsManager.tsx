'use client';

/* Brand promotions: add, book, record payments, cancel */

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Plus, Search, ChevronDown, Loader2, Trash2, X } from 'lucide-react';
import {
  KIND_META, SPONSOR_KINDS, phaseOf, paidOf, owedOf, endDateFor, todayIso, formatMoney,
  type DbSponsorPromotion, type PromoPhase, type PromoStatus, type SponsorPackage,
} from '@/lib/sponsors';
import { INPUT, LABEL, CARD, BTN, BTN_GHOST, fmtDate, sponsorApi, PhasePill, KindDot, type SponsorData } from './shared';

type Filter = 'all' | PromoPhase;
const FILTERS: [Filter, string][] = [['all', 'All'], ['proposal', 'Proposals'], ['live', 'Live'], ['upcoming', 'Upcoming'], ['ended', 'Ended'], ['cancelled', 'Cancelled']];
const targetHint = (pkg?: SponsorPackage) =>
  !pkg ? '' : /tournament|leaderboard|big_fish/.test(pkg.id) ? 'Which tournament?' : /series/.test(pkg.id) ? 'Which series?' : /newsletter/.test(pkg.id) ? 'Which issue?' : /social/.test(pkg.id) ? 'Which post / channel?' : 'Optional';

interface Props { data: SponsorData; reload: () => Promise<void>; initialAccountId?: string | null; accountId?: string; startAdding?: boolean }

export default function PromotionsManager({ data, reload, initialAccountId, accountId, startAdding }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(!!initialAccountId || !!startAdding);
  const [open, setOpen] = useState<string | null>(null);
  const today = todayIso();
  const accById = useMemo(() => new Map(data.accounts.map((a) => [a.id, a])), [data.accounts]);

  const scoped = accountId ? data.promotions.filter((p) => p.account_id === accountId) : data.promotions;
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: scoped.length, proposal: 0, live: 0, upcoming: 0, ended: 0, cancelled: 0 };
    scoped.forEach((p) => { c[phaseOf(p, today)]++; });
    return c;
  }, [scoped, today]);
  const t = q.trim().toLowerCase();
  const shown = scoped
    .filter((p) => filter === 'all' || phaseOf(p, today) === filter)
    .filter((p) => !t || p.package_name.toLowerCase().includes(t) || (p.target || '').toLowerCase().includes(t) || (accById.get(p.account_id)?.brand_name || '').toLowerCase().includes(t));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter promotions">
          {FILTERS.map(([f, label]) => (
            <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-[13px] font-medium transition ${filter === f ? 'border-[#0E7C7B] bg-[#0E7C7B] text-white' : 'border-[#D3DEE8] bg-white text-[#2E3F5C] hover:bg-[#F5F8FB]'}`}>
              {label} <span className={filter === f ? 'text-white/80' : 'text-[#8A9AB0]'}>{counts[f]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!accountId && (
            <label className="relative block w-[240px]">
              <span className="sr-only">Search promotions</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9AB0]" />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sponsor, package…" className={`${INPUT} pl-9`} />
            </label>
          )}
          {!adding && <button type="button" onClick={() => setAdding(true)} className={BTN}><Plus className="h-4 w-4" /> Add promotion</button>}
        </div>
      </div>

      {adding && <AddPromotion data={data} accountId={accountId || initialAccountId || ''} onClose={() => setAdding(false)} onSaved={async () => { setAdding(false); await reload(); }} />}

      <div className="overflow-x-auto rounded-lg border border-[#E8EEF4] bg-white shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
        {shown.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#5F6F86]">{scoped.length === 0 ? 'No brand promotions yet. Add the first one above.' : 'Nothing matches this filter.'}</p>
        ) : (
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-[#EEF3F8] bg-[#F7FAFC] text-left text-xs uppercase text-[#7A8BA3]">
              <tr>{!accountId && <th className="px-4 py-3">Sponsor</th>}<th className="px-4 py-3">Package</th><th className="px-4 py-3">Runs</th><th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3 text-right">Paid</th><th className="px-4 py-3">Status</th><th className="w-8 px-2 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-[#EEF3F8]">
              {shown.map((p) => {
                const phase = phaseOf(p, today);
                const owed = owedOf(p);
                return (
                  <Fragment key={p.id}>
                    <tr className="cursor-pointer hover:bg-[#F7FAFC]" onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id}>
                      {!accountId && <td className="px-4 py-3 font-medium text-[#0D1B4C]">{accById.get(p.account_id)?.brand_name || 'Unknown sponsor'}</td>}
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 font-medium text-[#0D1B4C]"><KindDot kind={p.kind} />{p.package_name}</span>
                        <span className="block pl-[18px] text-xs text-[#6B7D93]">{[p.option_label, p.target].filter(Boolean).join(' · ')}</span>
                      </td>
                      <td className="px-4 py-3 text-[#4A5B76]">{p.start_date === p.end_date ? fmtDate(p.start_date) : `${fmtDate(p.start_date)} – ${fmtDate(p.end_date)}`}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#0D1B4C]">{formatMoney(Number(p.price))}</td>
                      <td className={`px-4 py-3 text-right ${p.status !== 'booked' ? 'text-[#8A9AB0]' : owed > 0 ? 'text-amber-700' : 'text-green-700'}`}>{p.status === 'booked' ? formatMoney(paidOf(p)) : '—'}</td>
                      <td className="px-4 py-3"><PhasePill phase={phase} /></td>
                      <td className="px-2 py-3"><ChevronDown className={`h-4 w-4 text-[#8A9AB0] transition ${open === p.id ? 'rotate-180' : ''}`} /></td>
                    </tr>
                    {open === p.id && (
                      <tr className="bg-[#FAFCFD]"><td colSpan={accountId ? 6 : 7} className="px-4 py-4"><EditPromotion p={p} onDone={async () => { await reload(); }} onDeleted={async () => { setOpen(null); await reload(); }} /></td></tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- add form ------------------------------- */

function AddPromotion({ data, accountId, onClose, onSaved }: { data: SponsorData; accountId: string; onClose: () => void; onSaved: () => Promise<void> }) {
  const enabled = data.packages.filter((p) => p.enabled);
  const [account, setAccount] = useState(accountId || (data.accounts.length ? '' : '__new'));
  const [newBrand, setNewBrand] = useState({ brandName: '', contactName: '', contactEmail: '' });
  const [pkgId, setPkgId] = useState(enabled[0]?.id || '');
  const pkg = enabled.find((p) => p.id === pkgId);
  const [optId, setOptId] = useState(pkg?.options[0]?.id || '');
  const option = pkg?.options.find((o) => o.id === optId) ?? pkg?.options[0];
  const [start, setStart] = useState(todayIso());
  const [end, setEnd] = useState('');
  const [price, setPrice] = useState('');
  const [target, setTarget] = useState('');
  const [status, setStatus] = useState<PromoStatus>('proposal');
  const [paid, setPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { setOptId(pkg?.options[0]?.id || ''); }, [pkgId]); // eslint-disable-line react-hooks/exhaustive-deps
  const autoEnd = option ? endDateFor(option.months, start || todayIso()) : '';
  const endValue = end || autoEnd;
  const slotsUsed = pkg?.slots ? data.promotions.filter((p) => p.package_id === pkg.id && p.status === 'booked' && p.end_date >= (start || todayIso()) && p.start_date <= endValue).length : 0;

  const save = async () => {
    setBusy(true); setErr(null);
    try {
      let acc = account;
      if (acc === '__new') {
        if (!newBrand.brandName.trim()) throw new Error('Enter the new brand’s name.');
        const j = await sponsorApi<{ account: { id: string } }>('/api/admin/sponsors/accounts', { method: 'POST', body: JSON.stringify({ ...newBrand, status: 'prospect' }) });
        acc = j.account.id;
        setAccount(acc);
      }
      if (!acc) throw new Error('Choose the sponsor.');
      await sponsorApi('/api/admin/sponsors/promotions', {
        method: 'POST',
        body: JSON.stringify({
          accountId: acc, packageId: pkgId, optionId: option?.id, startDate: start,
          endDate: end || undefined, price: price === '' ? undefined : Number(price), target, notes, status,
          ...(status === 'booked' && paid !== '' ? { payment: { amount: Number(paid), paidAt: todayIso() } } : {}),
        }),
      });
      await onSaved();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <section className={CARD} aria-labelledby="add-promo-title">
      <div className="mb-4 flex items-center justify-between">
        <h3 id="add-promo-title" className="font-semibold text-[#0D1B4C]">Add a brand promotion</h3>
        <button type="button" onClick={onClose} className="rounded p-1 text-[#8A9AB0] hover:bg-[#F2F7FA] hover:text-[#0D1B4C]" aria-label="Close"><X className="h-4 w-4" /></button>
      </div>
      {enabled.length === 0 ? <p className="text-sm text-[#5F6F86]">Turn on at least one package in Packages &amp; pricing first.</p> : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="md:col-span-2 xl:col-span-1">
            <span className={LABEL}>Sponsor</span>
            <select className={INPUT} value={account} onChange={(e) => setAccount(e.target.value)} disabled={!!accountId}>
              <option value="">Choose a sponsor…</option>
              {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.brand_name}{a.status === 'inactive' ? ' (inactive)' : ''}</option>)}
              <option value="__new">+ New sponsor brand</option>
            </select>
          </label>
          {account === '__new' && (
            <>
              <label><span className={LABEL}>Brand name</span><input className={INPUT} value={newBrand.brandName} onChange={(e) => setNewBrand({ ...newBrand, brandName: e.target.value })} placeholder="e.g. Delta Tackle Co." /></label>
              <label><span className={LABEL}>Contact name</span><input className={INPUT} value={newBrand.contactName} onChange={(e) => setNewBrand({ ...newBrand, contactName: e.target.value })} /></label>
              <label><span className={LABEL}>Contact email</span><input type="email" className={INPUT} value={newBrand.contactEmail} onChange={(e) => setNewBrand({ ...newBrand, contactEmail: e.target.value })} /></label>
            </>
          )}
          <label className={account === '__new' ? 'md:col-span-2 xl:col-span-1' : ''}>
            <span className={LABEL}>Package</span>
            <select className={INPUT} value={pkgId} onChange={(e) => setPkgId(e.target.value)}>
              {SPONSOR_KINDS.map((k) => (
                <optgroup key={k} label={KIND_META[k].label}>
                  {enabled.filter((p) => p.kind === k).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label>
            <span className={LABEL}>Price option</span>
            <select className={INPUT} value={option?.id || ''} onChange={(e) => setOptId(e.target.value)}>
              {pkg?.options.map((o) => <option key={o.id} value={o.id}>{o.label} · {formatMoney(o.price)}</option>)}
            </select>
          </label>
          <label>
            <span className={LABEL}>For <span className="font-normal text-[#8A9AB0]">({targetHint(pkg)})</span></span>
            <input className={INPUT} value={target} onChange={(e) => setTarget(e.target.value)} placeholder={pkg?.kind === 'tier' ? 'e.g. 2027 season' : 'e.g. Delta Bass Open 2027'} />
          </label>
          <label><span className={LABEL}>Starts</span><input type="date" className={INPUT} value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <label><span className={LABEL}>Ends</span><input type="date" className={INPUT} value={endValue} min={start} onChange={(e) => setEnd(e.target.value)} /></label>
          <label>
            <span className={LABEL}>Price</span>
            <input type="number" min={0} step="1" className={INPUT} value={price} onChange={(e) => setPrice(e.target.value)} placeholder={option ? String(option.price) : ''} />
          </label>
          <fieldset>
            <legend className={LABEL}>Status</legend>
            <div className="flex h-[40px] overflow-hidden rounded-lg border border-[#D3DEE8]">
              {(['proposal', 'booked'] as PromoStatus[]).map((s) => (
                <button key={s} type="button" onClick={() => setStatus(s)} aria-pressed={status === s}
                  className={`flex-1 text-sm font-semibold transition ${status === s ? 'bg-[#0E7C7B] text-white' : 'bg-white text-[#2E3F5C] hover:bg-[#F5F8FB]'}`}>{s === 'proposal' ? 'Proposal' : 'Booked'}</button>
              ))}
            </div>
          </fieldset>
          {status === 'booked' && (
            <label><span className={LABEL}>Paid so far <span className="font-normal text-[#8A9AB0]">(optional)</span></span><input type="number" min={0} step="1" className={INPUT} value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="0" /></label>
          )}
          <label className="md:col-span-2 xl:col-span-4">
            <span className={LABEL}>Notes</span>
            <textarea rows={2} className={`${INPUT} h-auto py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Deliverables, artwork due dates, invoice number…" />
          </label>
          {pkg && (
            <div className="rounded-lg bg-[#F5F8FB] px-3 py-2 text-[13px] text-[#4A5B76] md:col-span-2 xl:col-span-4">
              <span className="font-semibold text-[#0D1B4C]">{pkg.name}:</span> {pkg.perks.join(' · ') || pkg.blurb}
              {pkg.slots > 0 && <span className={`ml-2 font-semibold ${slotsUsed >= pkg.slots ? 'text-red-600' : 'text-[#0E7C7B]'}`}>{slotsUsed} of {pkg.slots} slot{pkg.slots === 1 ? '' : 's'} booked for these dates</span>}
            </div>
          )}
        </div>
      )}
      {err && <p className="mt-3 text-sm text-red-600" role="alert">{err}</p>}
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={save} disabled={busy || enabled.length === 0} className={BTN}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save promotion</button>
        <button type="button" onClick={onClose} className={BTN_GHOST}>Cancel</button>
      </div>
    </section>
  );
}

/* ------------------------------- edit panel ------------------------------ */

function EditPromotion({ p, onDone, onDeleted }: { p: DbSponsorPromotion; onDone: () => Promise<void>; onDeleted: () => Promise<void> }) {
  const [f, setF] = useState({ price: String(Number(p.price)), start: p.start_date, end: p.end_date, target: p.target || '', notes: p.notes || '', paid: p.amount_paid == null ? '' : String(Number(p.amount_paid)), paidAt: (p.paid_at || '').slice(0, 10) || todayIso() });
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const patch = async (body: Record<string, unknown>, label: string) => {
    setBusy(label); setMsg(null);
    try {
      await sponsorApi(`/api/admin/sponsors/promotions/${p.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      await onDone();
      setMsg({ ok: true, text: 'Saved.' });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(null); }
  };
  const del = async () => {
    if (!window.confirm(`Delete this ${p.package_name} promotion? This can’t be undone.`)) return;
    setBusy('delete');
    try { await sponsorApi(`/api/admin/sponsors/promotions/${p.id}`, { method: 'DELETE' }); await onDeleted(); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); setBusy(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] font-semibold text-[#2E3F5C]">Status:</span>
        {(['proposal', 'booked', 'cancelled'] as PromoStatus[]).map((s) => (
          <button key={s} type="button" disabled={!!busy || p.status === s} onClick={() => patch({ status: s }, s)}
            className={`rounded-full border px-3 py-1 text-[13px] font-semibold transition ${p.status === s ? 'border-[#0E7C7B] bg-[#0E7C7B] text-white' : 'border-[#D3DEE8] bg-white text-[#2E3F5C] hover:bg-[#F5F8FB]'}`}>
            {busy === s ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : s === 'proposal' ? 'Proposal' : s === 'booked' ? 'Booked' : 'Cancelled'}
          </button>
        ))}
        {p.booked_at && <span className="text-xs text-[#6B7D93]">Booked {fmtDate(p.booked_at)}</span>}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <label><span className={LABEL}>Price</span><input type="number" min={0} className={INPUT} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></label>
        <label><span className={LABEL}>Starts</span><input type="date" className={INPUT} value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></label>
        <label><span className={LABEL}>Ends</span><input type="date" className={INPUT} value={f.end} min={f.start} onChange={(e) => setF({ ...f, end: e.target.value })} /></label>
        <label className="col-span-2 md:col-span-1 xl:col-span-3"><span className={LABEL}>For</span><input className={INPUT} value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} /></label>
        <label className="col-span-2 md:col-span-4 xl:col-span-6"><span className={LABEL}>Notes</span><textarea rows={2} className={`${INPUT} h-auto py-2`} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></label>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <button type="button" disabled={!!busy} onClick={() => patch({ price: Number(f.price), startDate: f.start, endDate: f.end, target: f.target, notes: f.notes }, 'save')} className={BTN}>
            {busy === 'save' && <Loader2 className="h-4 w-4 animate-spin" />}Save changes
          </button>
          <button type="button" disabled={!!busy} onClick={del} className={`${BTN_GHOST} text-red-600 hover:bg-red-50`}><Trash2 className="h-4 w-4" />Delete</button>
        </div>
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-[#E3EAF1] bg-white p-3">
          <label className="w-[120px]"><span className={LABEL}>Amount paid</span><input type="number" min={0} className={INPUT} value={f.paid} onChange={(e) => setF({ ...f, paid: e.target.value })} placeholder="0" /></label>
          <label className="w-[160px]"><span className={LABEL}>Paid on</span><input type="date" className={INPUT} value={f.paidAt} onChange={(e) => setF({ ...f, paidAt: e.target.value })} /></label>
          <button type="button" disabled={!!busy || f.paid === ''} onClick={() => patch({ payment: { amount: Number(f.paid), paidAt: f.paidAt } }, 'pay')} className={BTN_GHOST}>{busy === 'pay' && <Loader2 className="h-4 w-4 animate-spin" />}Record payment</button>
          <button type="button" disabled={!!busy} onClick={() => setF({ ...f, paid: String(Number(f.price)) })} className="pb-2 text-xs font-semibold text-[#0E7C7B] hover:underline">Paid in full</button>
        </div>
      </div>
      {msg && <p className={`text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`} role="status">{msg.text}</p>}
    </div>
  );
}
