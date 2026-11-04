'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Star, Loader2, AlertCircle, Mail, Phone, RefreshCw, Plus, X, LayoutPanelTop, BadgeCheck, DollarSign, Link2, Search } from 'lucide-react';
import { Toast, useToast } from '@/components/ui/Toast';
import { useListingOptions } from '@/lib/useListingOptions';
import {
  TYPE_META, PLACEMENT_META, PLACEMENTS, formatMoney, isActivePlacement, priceOf, enabledPlans,
  type DbFeaturedRequest, type ListingType, type Placement, type SubmissionStatus, type TypePricing,
} from '@/lib/featured';

/* ------------------------------------------------------------------ */
/* Admin → Marketing Promotions → <type> → Requests                       */
/* Requests from the public pages and placements added by HOOX, for    */
/* both products (Featured listing / Featured page hero).              */
/* ------------------------------------------------------------------ */

const STATUS_META: Record<SubmissionStatus, { label: string; cls: string }> = {
  new: { label: 'New', cls: 'bg-[#E3F4F4] text-[#0B6564]' },
  in_review: { label: 'Invoice sent', cls: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approved', cls: 'bg-green-100 text-green-700' },
  declined: { label: 'Declined / ended', cls: 'bg-gray-100 text-gray-600' },
};
type Filter = 'all' | SubmissionStatus | 'live';
const ROLE_LABEL: Record<string, string> = { angler: 'Angler', director: 'Tournament Director', admin: 'Admin', customer: 'Customer', sponsor: 'Partner' };
const input = 'h-[38px] w-full rounded-lg border border-[#D3DEE8] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#22B3B5]';
const lbl = 'mb-1 block text-xs font-semibold text-[#0E7C7B]';

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init });
  let json: Record<string, unknown> = {};
  try { json = await res.json(); } catch { /* ignore */ }
  if (!res.ok || json.error) {
    const msg = typeof json.error === 'string' ? json.error : `Request failed (${res.status})`;
    throw new Error(res.status === 403 ? 'Your admin session has expired. Please log in again.' : msg);
  }
  return json as T;
}
const fmt = (d: string | null) => (d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
const PlacementIcon = ({ p, className = 'h-3.5 w-3.5' }: { p: Placement; className?: string }) => (p === 'hero' ? <LayoutPanelTop className={className} /> : <BadgeCheck className={className} />);

function Row({ r, type, onChanged }: { r: DbFeaturedRequest; type: ListingType; onChanged: (r: DbFeaturedRequest, msg: string, warn: boolean) => void }) {
  const [notes, setNotes] = useState(r.admin_notes || '');
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [amount, setAmount] = useState(String(Math.max(0, priceOf(r) - Number(r.amount_paid ?? 0)) || priceOf(r)));
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [linking, setLinking] = useState(false);
  const live = isActivePlacement(r);
  const paid = Number(r.amount_paid ?? 0);
  const price = priceOf(r);

  const save = async (body: Record<string, unknown>, msg: string) => {
    setSaving(true);
    try {
      const j = await api<{ request: DbFeaturedRequest; warning: string | null }>(`/api/admin/featured/requests/${r.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const n = j.request;
      onChanged(n, j.warning || (body.status === 'approved' && n.featured_until ? `${n.club_name} is featured ${fmt(n.featured_from)} – ${fmt(n.featured_until)}` : msg), !!j.warning);
      return true;
    } catch (e) {
      onChanged(r, (e as Error).message, true);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="grid grid-cols-1 gap-4 border-b border-[#EEF3F8] px-5 py-4 last:border-0 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Star className="h-4 w-4 text-[#0E7C7B]" />
          <span className="font-medium text-[#0D1B4C]">{r.club_name}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_META[r.status].cls}`}>{STATUS_META[r.status].label}</span>
          {live && <span className="flex items-center gap-1 rounded-full bg-green-600 px-2 py-0.5 text-xs font-semibold text-white"><span className="h-1.5 w-1.5 rounded-full bg-white" /> Live now</span>}
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${r.placement === 'hero' ? 'bg-[#FCEEE4] text-[#A64912]' : 'bg-[#E3F4F4] text-[#0B6564]'}`}>
            <PlacementIcon p={r.placement} /> {PLACEMENT_META[r.placement].label}
          </span>
          <span className="rounded-full bg-[#FFF4E5] px-2 py-0.5 text-xs text-[#9A5B00]">{r.plan_name || r.plan} · {formatMoney(price)}</span>
          {!r.listing_id && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">Not linked to a listing</span>}
          {r.source === 'admin' && <span className="rounded-full bg-[#F1EAFA] px-2 py-0.5 text-xs text-[#59338A]">Added by HOOX</span>}
        </div>
        <div className="mt-1 text-xs text-[#5F6F86]">
          {r.featured_until ? <>Runs {fmt(r.featured_from)} – {fmt(r.featured_until)}</> : <>Start {r.start_date ? fmt(r.start_date) : 'on approval'}</>}
          {' · '}received {fmt(r.created_at)}{r.promo_code ? ` · promo ${r.promo_code}` : ''}
          {' · '}<span className={paid >= price && price > 0 ? 'font-semibold text-green-700' : paid > 0 ? 'text-amber-700' : ''}>{paid >= price && price > 0 ? `Paid ${formatMoney(paid)}${r.paid_at ? ` on ${fmt(r.paid_at)}` : ''}` : paid > 0 ? `Partly paid ${formatMoney(paid)} of ${formatMoney(price)}` : 'Not paid yet'}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="text-[#2E3F5C]">{r.requester_name} ({ROLE_LABEL[r.requester_role] || r.requester_role})</span>
          <a href={`mailto:${r.requester_email}?subject=${encodeURIComponent(`Featuring ${r.club_name} on HOOX`)}`} className="flex items-center gap-1.5 text-[#0E7C7B] hover:underline"><Mail className="h-3.5 w-3.5" />{r.requester_email}</a>
          {r.contact_phone && <a href={`tel:${r.contact_phone}`} className="flex items-center gap-1.5 text-[#2E3F5C]"><Phone className="h-3.5 w-3.5" />{r.contact_phone}</a>}
        </div>
        {r.notes && <p className="mt-2 whitespace-pre-line rounded bg-[#F5F8FB] px-3 py-2 text-sm text-[#2E3F5C]">{r.notes}</p>}
        {linking && <LinkListing type={type} r={r} onCancel={() => setLinking(false)} onSave={async (id, name) => { if (await save({ listingId: id, listingName: name }, 'Listing linked')) setLinking(false); }} />}
      </div>
      <div className="space-y-2">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} aria-label="Internal notes"
          className="w-full rounded-lg border border-[#D3DEE8] px-3 py-2 text-sm focus:ring-2 focus:ring-[#22B3B5]" placeholder="Invoice #, contact notes…" />
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={saving || notes === (r.admin_notes || '')} onClick={() => save({ adminNotes: notes }, 'Notes saved')}
            className="rounded-lg border border-[#D3DEE8] px-3 py-1.5 text-sm font-medium text-[#2E3F5C] hover:bg-[#F5F8FB] disabled:opacity-50">Save notes</button>
          {r.status === 'new' && (
            <button type="button" disabled={saving} onClick={() => save({ status: 'in_review' }, 'Marked invoice sent')}
              className="rounded-lg border border-[#D3DEE8] px-3 py-1.5 text-sm font-semibold text-[#2E3F5C] hover:bg-[#F5F8FB] disabled:opacity-50">Invoice sent</button>
          )}
          {r.status !== 'approved' && r.status !== 'declined' && (
            <button type="button" disabled={saving} onClick={() => save({ status: 'approved' }, 'Approved')}
              className="rounded-lg bg-[#0E7C7B] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#0B6564] disabled:opacity-50">Approve & feature</button>
          )}
          <button type="button" disabled={saving} onClick={() => setPaying((v) => !v)}
            className="flex items-center gap-1 rounded-lg border border-[#D3DEE8] px-3 py-1.5 text-sm font-medium text-[#2E3F5C] hover:bg-[#F5F8FB] disabled:opacity-50"><DollarSign className="h-3.5 w-3.5" />{paid ? 'Edit payment' : 'Record payment'}</button>
          <button type="button" disabled={saving} onClick={() => setLinking((v) => !v)}
            className="flex items-center gap-1 rounded-lg border border-[#D3DEE8] px-3 py-1.5 text-sm font-medium text-[#2E3F5C] hover:bg-[#F5F8FB] disabled:opacity-50"><Link2 className="h-3.5 w-3.5" />{r.listing_id ? 'Change listing' : 'Link listing'}</button>
          {r.status === 'approved' ? (
            <button type="button" disabled={saving} onClick={() => save({ status: 'declined' }, 'Placement ended')}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">End placement</button>
          ) : r.status !== 'declined' ? (
            <button type="button" disabled={saving} onClick={() => save({ status: 'declined' }, 'Declined')}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">Decline</button>
          ) : (
            <button type="button" disabled={saving} onClick={() => save({ status: 'new' }, 'Reopened')}
              className="rounded-lg border border-[#D3DEE8] px-3 py-1.5 text-sm font-medium text-[#2E3F5C] hover:bg-[#F5F8FB] disabled:opacity-50">Reopen</button>
          )}
          {saving && <Loader2 className="h-4 w-4 animate-spin self-center text-[#8A9AB0]" />}
        </div>
        {paying && (
          <form noValidate onSubmit={async (e) => { e.preventDefault(); if (await save({ payment: { amount: Number(amount), paidAt: paidOn } }, 'Payment recorded')) setPaying(false); }}
            className="flex flex-wrap items-end gap-2 rounded-lg bg-[#F5F8FB] p-3">
            <div className="w-[120px]"><label className={lbl} htmlFor={`amt-${r.id}`}>Amount paid</label><input id={`amt-${r.id}`} type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={input} /></div>
            <div className="w-[150px]"><label className={lbl} htmlFor={`pd-${r.id}`}>Paid on</label><input id={`pd-${r.id}`} type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} className={input} /></div>
            <button type="submit" className="h-[38px] rounded-lg bg-[#0E7C7B] px-3 text-sm font-semibold text-white">Save</button>
            {paid > 0 && <button type="button" onClick={async () => { if (await save({ payment: null }, 'Payment cleared')) setPaying(false); }} className="h-[38px] rounded-lg border border-[#D3DEE8] px-3 text-sm text-[#2E3F5C]">Clear payment</button>}
          </form>
        )}
      </div>
    </li>
  );
}

function ListingPicker({ type, value, onChange }: { type: ListingType; value: { id: string; name: string }; onChange: (v: { id: string; name: string }) => void }) {
  const options = useListingOptions(type);
  const [q, setQ] = useState(value.name);
  const [open, setOpen] = useState(false);
  const matches = (options || []).filter((o) => !q.trim() || o.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8);
  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9AB0]" />
        <input value={q} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => { setQ(e.target.value); onChange({ id: '', name: e.target.value }); setOpen(true); }}
          placeholder={`Search ${TYPE_META[type].plural.toLowerCase()}…`} className={`${input} pl-9`} aria-label="Listing" />
      </div>
      {value.id ? <p className="mt-1 text-[11px] text-green-700">Linked to a listing on HOOX</p> : q.trim() ? <p className="mt-1 text-[11px] text-amber-700">Not linked yet. Pick from the list so it shows on the site.</p> : null}
      {open && (
        <ul className="absolute z-20 mt-1 max-h-[240px] w-full overflow-y-auto rounded-lg border border-[#E3EAF1] bg-white py-1 shadow-lg">
          {options === null ? <li className="px-3 py-2 text-sm text-[#8A9AB0]">Loading…</li>
            : matches.length === 0 ? <li className="px-3 py-2 text-sm text-[#8A9AB0]">No matches</li>
            : matches.map((o) => (
              <li key={o.id}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange({ id: o.id, name: o.name }); setQ(o.name); setOpen(false); }}
                  className="block w-full px-3 py-2 text-left hover:bg-[#F2F7FA]">
                  <span className="block text-sm font-medium text-[#0D1B4C]">{o.name}</span>
                  <span className="block text-xs text-[#8A9AB0]">{o.sub}</span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

function LinkListing({ type, r, onCancel, onSave }: { type: ListingType; r: DbFeaturedRequest; onCancel: () => void; onSave: (id: string, name: string) => void }) {
  const [v, setV] = useState({ id: r.listing_id || '', name: r.club_name });
  return (
    <div className="mt-3 flex flex-wrap items-start gap-2 rounded-lg bg-[#F5F8FB] p-3">
      <div className="min-w-[240px] flex-1"><ListingPicker type={type} value={v} onChange={setV} /></div>
      <button type="button" disabled={!v.id} onClick={() => onSave(v.id, v.name)} className="h-[38px] rounded-lg bg-[#0E7C7B] px-3 text-sm font-semibold text-white disabled:opacity-50">Link</button>
      <button type="button" onClick={onCancel} className="h-[38px] rounded-lg border border-[#D3DEE8] px-3 text-sm text-[#2E3F5C]">Cancel</button>
    </div>
  );
}

function AddPlacement({ type, onClose, onAdded }: { type: ListingType; onClose: () => void; onAdded: (r: DbFeaturedRequest, warning: string | null) => void }) {
  const [pricing, setPricing] = useState<TypePricing | null>(null);
  const [placement, setPlacement] = useState<Placement>('badge');
  const [plan, setPlan] = useState('');
  const [listing, setListing] = useState({ id: '', name: '' });
  const [f, setF] = useState({ customerName: '', customerEmail: '', phone: '', startDate: '', price: '', notes: '' });
  const [approve, setApprove] = useState(true);
  const [paidNow, setPaidNow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ pricing: TypePricing }>(`/api/admin/feature-pricing?type=${type}`).then((j) => setPricing(j.pricing)).catch((e) => setError((e as Error).message));
  }, [type]);
  const plans = pricing ? enabledPlans(pricing[placement]) : [];
  useEffect(() => { if (plans.length && !plans.some((p) => p.id === plan)) setPlan((plans.find((p) => p.highlight) ?? plans[0]).id); }, [pricing, placement]); // eslint-disable-line react-hooks/exhaustive-deps
  const chosen = plans.find((p) => p.id === plan);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async () => {
    setSaving(true); setError('');
    try {
      const price = f.price === '' ? chosen?.price : Number(f.price);
      const j = await api<{ request: DbFeaturedRequest; warning: string | null }>('/api/admin/featured/requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, placement, plan, listingId: listing.id, listingName: listing.name, ...f, price: f.price, approve, paidAmount: paidNow ? price : null }),
      });
      onAdded(j.request, j.warning);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#0A1A2E]/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="add-placement-title" className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="add-placement-title" className="font-montserrat text-lg font-bold text-[#0D1B4C]">Add a {TYPE_META[type].label.toLowerCase()} placement</h3>
            <p className="mt-0.5 text-sm text-[#5F6F86]">For deals made by phone or email. It’s tracked in revenue like any other request.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-[#8A9AB0] hover:text-[#0D1B4C]"><X className="h-5 w-5" /></button>
        </div>
        <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} className="mt-4 space-y-4">
          <div><span className={lbl}>{TYPE_META[type].label}</span><ListingPicker type={type} value={listing} onChange={setListing} /></div>
          <fieldset>
            <legend className={lbl}>Product</legend>
            <div className="grid grid-cols-2 gap-2">
              {PLACEMENTS.map((p) => (
                <button key={p} type="button" aria-pressed={placement === p} onClick={() => setPlacement(p)}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm font-semibold ${placement === p ? 'border-[#0E7C7B] bg-[#F1F9F9] text-[#0B6564] ring-1 ring-[#0E7C7B]' : 'border-[#D3DEE8] text-[#2E3F5C]'}`}>
                  <PlacementIcon p={p} className="h-4 w-4" /> {PLACEMENT_META[p].label}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className={lbl} htmlFor="ap-plan">Plan</label>
              <select id="ap-plan" value={plan} onChange={(e) => setPlan(e.target.value)} className={input}>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name} · {formatMoney(p.price)} / {p.term}</option>)}
              </select>
            </div>
            <div><label className={lbl} htmlFor="ap-price">Price (optional)</label><input id="ap-price" type="number" min={0} step="0.01" value={f.price} onChange={set('price')} placeholder={chosen ? String(chosen.price) : ''} className={input} /></div>
            <div><label className={lbl} htmlFor="ap-start">Start date</label><input id="ap-start" type="date" value={f.startDate} onChange={set('startDate')} className={input} /></div>
            <div className="sm:col-span-2"><label className={lbl} htmlFor="ap-name">Customer name</label><input id="ap-name" value={f.customerName} onChange={set('customerName')} className={input} /></div>
            <div className="sm:col-span-2"><label className={lbl} htmlFor="ap-email">Customer email</label><input id="ap-email" type="email" value={f.customerEmail} onChange={set('customerEmail')} className={input} /></div>
            <div><label className={lbl} htmlFor="ap-phone">Phone</label><input id="ap-phone" value={f.phone} onChange={set('phone')} className={input} /></div>
            <div className="sm:col-span-3"><label className={lbl} htmlFor="ap-notes">Notes</label><textarea id="ap-notes" rows={2} value={f.notes} onChange={set('notes')} className="w-full rounded-lg border border-[#D3DEE8] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#22B3B5]" /></div>
          </div>
          <div className="space-y-2 text-sm text-[#2E3F5C]">
            <label className="flex items-center gap-2"><input type="checkbox" checked={approve} onChange={(e) => setApprove(e.target.checked)} className="h-4 w-4 accent-[#0E7C7B]" /> Approve now and put it live{f.startDate ? ` from ${f.startDate}` : ''}</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={paidNow} onChange={(e) => setPaidNow(e.target.checked)} className="h-4 w-4 accent-[#0E7C7B]" /> Already paid in full</label>
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-[#EEF3F8] pt-4">
            <button type="button" onClick={onClose} className="h-[38px] rounded-lg border border-[#D3DEE8] px-4 text-sm font-medium text-[#2E3F5C]">Cancel</button>
            <button type="submit" disabled={saving || !pricing} className="flex h-[38px] items-center gap-1.5 rounded-lg bg-[#0E7C7B] px-4 text-sm font-semibold text-white disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Add placement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FeaturedRequestsManager({ type }: { type: ListingType }) {
  const [items, setItems] = useState<DbFeaturedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('new');
  const [placement, setPlacement] = useState<'all' | Placement>('all');
  const [adding, setAdding] = useState(false);
  const { toasts, remove, success, error: toastError } = useToast();

  const load = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const { requests } = await api<{ requests: DbFeaturedRequest[] }>(`/api/admin/featured/requests?type=${type}`);
      setItems(requests);
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [type]);
  useEffect(() => { load(); }, [load]);

  const byPlacement = useMemo(() => items.filter((r) => placement === 'all' || r.placement === placement), [items, placement]);
  const counts = byPlacement.reduce<Record<string, number>>((m, s) => ({ ...m, [s.status]: (m[s.status] || 0) + 1 }), {});
  const liveCount = byPlacement.filter((r) => isActivePlacement(r)).length;
  const shown = byPlacement.filter((r) => filter === 'all' || (filter === 'live' ? isActivePlacement(r) : r.status === filter));
  const FILTERS: [Filter, string][] = [['new', `New (${counts.new || 0})`], ['in_review', `Invoice sent (${counts.in_review || 0})`], ['live', `Live now (${liveCount})`], ['approved', `Approved (${counts.approved || 0})`], ['declined', `Declined / ended (${counts.declined || 0})`], ['all', `All (${byPlacement.length})`]];

  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-[#E8EEF4] bg-white shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF3F8] px-5 py-3.5">
        <div>
          <span className="font-semibold text-[#0D1B4C]">{TYPE_META[type].plural} · Requests & placements</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1.5 rounded-lg bg-[#0E7C7B] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#0B6564]"><Plus className="h-4 w-4" /> Add placement</button>
          <button type="button" onClick={load} aria-label="Refresh" className="rounded-lg p-1.5 text-[#8A9AB0] hover:bg-[#F5F8FB] hover:text-[#0E7C7B]"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EEF3F8] px-5 py-2.5">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(([f, label]) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter === f ? 'bg-[#0E7C7B] text-white' : 'bg-[#F0F4F8] text-[#4A5B76] hover:bg-[#E3EAF1]'}`}>{label}</button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg bg-[#F0F4F8] p-0.5" role="group" aria-label="Product">
          {(['all', ...PLACEMENTS] as const).map((p) => (
            <button key={p} type="button" onClick={() => setPlacement(p)} aria-pressed={placement === p}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${placement === p ? 'bg-white text-[#0D1B4C] shadow-sm' : 'text-[#5F6F86]'}`}>
              {p === 'all' ? 'Both products' : PLACEMENT_META[p].label}
            </button>
          ))}
        </div>
      </div>
      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#5F6F86]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : loadError ? (
        <div className="flex items-start gap-2 px-5 py-6 text-sm text-red-600"><AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /><span>{loadError}</span></div>
      ) : shown.length === 0 ? (
        <div className="py-10 text-center text-sm text-[#5F6F86]">Nothing here yet.</div>
      ) : (
        <ul>
          {shown.map((r) => (
            <Row key={r.id} r={r} type={type} onChanged={(next, msg, warn) => { setItems((l) => l.map((x) => (x.id === next.id ? next : x))); (warn ? toastError : success)(msg); }} />
          ))}
        </ul>
      )}
      {adding && <AddPlacement type={type} onClose={() => setAdding(false)} onAdded={(r, warning) => { setAdding(false); setItems((l) => [r, ...l]); setFilter(r.status === 'approved' ? 'live' : 'new'); (warning ? toastError : success)(warning || 'Placement added'); }} />}
      <Toast toasts={toasts} onRemove={remove} />
    </div>
  );
}
