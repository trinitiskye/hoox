'use client';

import { useCallback, useEffect, useState } from 'react';
import { DollarSign, Loader2, AlertCircle, ExternalLink, RotateCcw, Star, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Toast, useToast } from '@/components/ui/Toast';
import {
  formatMoney, perMonth, savingsPercent,
  type FeaturePlan, type FeaturePricing,
} from '@/lib/clubFeature';
import { PLACEMENTS, PLACEMENT_META, TYPE_META, type ListingType, type Placement, type TypePricing } from '@/lib/featured';

/* ------------------------------------------------------------------ */
/* Admin → Featured Marketing → <type> → Pricing (both products)      */
/* Edits what /clubs/feature shows and what new requests are quoted.   */
/* Saved via /api/admin/feature-pricing (admin session required).      */
/* ------------------------------------------------------------------ */

const input = 'w-full rounded-lg border border-[#D3DEE8] px-3 py-2 text-sm text-[#1F2D3D] focus:outline-none focus:ring-2 focus:ring-[#22B3B5]';
const label = 'mb-1 block text-xs font-semibold text-[#0E7C7B]';

/** Editor keeps list fields as text (one item per line) and numbers as strings while typing */
type PlanDraft = Omit<FeaturePlan, 'price' | 'months' | 'extras'> & { price: string; months: string; extras: string };
type Draft = { perks: string; plans: PlanDraft[] };

const toDraft = (p: FeaturePricing): Draft => ({
  perks: p.perks.join('\n'),
  plans: p.plans.map((x) => ({ ...x, price: String(x.price), months: String(x.months), extras: x.extras.join('\n') })),
});
const lines = (t: string) => t.split('\n').map((x) => x.trim()).filter(Boolean);
const fromDraft = (d: Draft): FeaturePricing => ({
  perks: lines(d.perks),
  plans: d.plans.map((x) => ({ ...x, price: Number(x.price), months: Number(x.months), extras: lines(x.extras) })),
});

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  let json: Record<string, unknown> = {};
  try { json = await res.json(); } catch { /* ignore */ }
  if (!res.ok || json.error) {
    const msg = typeof json.error === 'string' ? json.error : `Request failed (${res.status})`;
    throw new Error(res.status === 403 ? 'Your admin session has expired. Please log in again.' : msg);
  }
  return json as T;
}

type TypeDraft = Record<Placement, Draft>;
const toTypeDraft = (p: TypePricing): TypeDraft => ({ badge: toDraft(p.badge), hero: toDraft(p.hero) });
const fromTypeDraft = (d: TypeDraft): TypePricing => ({ badge: fromDraft(d.badge), hero: fromDraft(d.hero) });
/** Where each type's public pricing lives (only clubs have a public page so far) */
const PUBLIC_PRICING: Partial<Record<ListingType, string>> = { club: '/clubs/feature#pricing' };

export default function FeaturePricingEditor({ type = 'club' }: { type?: ListingType }) {
  const [product, setProduct] = useState<Placement>('badge');
  const [drafts, setDrafts] = useState<TypeDraft | null>(null);
  const draft = drafts?.[product] ?? null;
  const setDraft = (v: Draft | null | ((d: Draft | null) => Draft | null)) =>
    setDrafts((ds) => {
      if (!ds) return ds;
      const next = typeof v === 'function' ? v(ds[product]) : v;
      return next ? { ...ds, [product]: next } : ds;
    });
  const [savedJson, setSavedJson] = useState('');
  const [defaults, setDefaults] = useState<TypePricing | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toasts, remove, success } = useToast();

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const j = await api<{ pricing: TypePricing; defaults: TypePricing; saved: boolean; updatedAt: string | null }>(`/api/admin/feature-pricing?type=${type}`);
      const d = toTypeDraft(j.pricing);
      setDrafts(d); setSavedJson(JSON.stringify(d)); setDefaults(j.defaults); setIsCustom(j.saved); setUpdatedAt(j.updatedAt);
    } catch (e) {
      setLoadError((e as Error).message);
    }
  }, [type]);
  useEffect(() => { load(); }, [load]);

  if (loadError) {
    return (
      <div className="mb-6 flex items-start gap-2 rounded-lg border border-[#E8EEF4] bg-white px-5 py-5 text-sm text-red-600">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {loadError}
      </div>
    );
  }
  if (!draft || !drafts) {
    return <div className="mb-6 flex items-center gap-2 rounded-lg border border-[#E8EEF4] bg-white px-5 py-8 text-sm text-[#5F6F86]"><Loader2 className="h-4 w-4 animate-spin" /> Loading pricing…</div>;
  }

  const dirty = JSON.stringify(drafts) !== savedJson;
  const dirtyProduct = (p: Placement) => JSON.stringify(drafts[p]) !== JSON.stringify((JSON.parse(savedJson) as TypeDraft)[p]);
  const preview = fromDraft(draft);
  const setPlan = (i: number, patch: Partial<PlanDraft>) =>
    setDraft((d) => d && { ...d, plans: d.plans.map((p, j) => (j === i ? { ...p, ...patch } : patch.highlight ? { ...p, highlight: false } : p)) });

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const j = await api<{ pricing: TypePricing; updatedAt: string }>(`/api/admin/feature-pricing?type=${type}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pricing: fromTypeDraft(drafts) }),
      });
      const d = toTypeDraft(j.pricing);
      setDrafts(d); setSavedJson(JSON.stringify(d)); setIsCustom(true); setUpdatedAt(j.updatedAt);
      success(`${TYPE_META[type].plural} pricing saved.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-[#E8EEF4] bg-white shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF3F8] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-[#0E7C7B]" />
          <span className="font-semibold text-[#0D1B4C]">{TYPE_META[type].plural} featured pricing</span>
          <span className="text-xs text-[#5F6F86]">
            {isCustom && updatedAt ? `Last saved ${new Date(updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : 'Using recommended pricing'}
          </span>
        </div>
        {PUBLIC_PRICING[type] && (
          <a href={PUBLIC_PRICING[type]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-[#0E7C7B] hover:underline">
            View public page <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* Product switch */}
      <div className="flex gap-1 border-b border-[#EEF3F8] px-5" role="tablist" aria-label="Product">
        {PLACEMENTS.map((p) => (
          <button key={p} type="button" role="tab" aria-selected={product === p} onClick={() => setProduct(p)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${product === p ? 'border-[#0E7C7B] text-[#0E7C7B]' : 'border-transparent text-[#5F6F86] hover:text-[#2E3F5C]'}`}>
            {PLACEMENT_META[p].label}
            {dirtyProduct(p) && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-label="Unsaved changes" />}
          </button>
        ))}
      </div>

      <div className="space-y-6 p-5">
        <p className="-mb-2 text-xs text-[#5F6F86]">{PLACEMENT_META[product].blurb}</p>
        <div>
           <label htmlFor={`pricing-perks-${product}`} className={label}>Included with every {PLACEMENT_META[product].label.toLowerCase()} plan (one per line)</label>
          <textarea id={`pricing-perks-${product}`} rows={4} value={draft.perks} onChange={(e) => setDraft({ ...draft, perks: e.target.value })} className={input} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {draft.plans.map((p, i) => {
            const live = preview.plans[i];
            const valid = Number.isFinite(live.price) && live.price >= 0 && Number.isInteger(live.months) && live.months >= 1;
            const pct = valid ? savingsPercent(live, preview) : 0;
            return (
              <div key={p.id} className={`rounded-lg border p-4 ${!p.enabled ? 'border-dashed border-[#D3DEE8] bg-[#FAFCFD] opacity-75' : p.highlight ? 'border-[#0E7C7B] ring-1 ring-[#0E7C7B]' : 'border-[#E8EEF4]'}`}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#8A9AB0]">Plan {i + 1}</span>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => setPlan(i, { highlight: !p.highlight })} disabled={!p.enabled} aria-pressed={p.highlight}
                      title="Highlight as the recommended plan"
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition disabled:opacity-40 ${p.highlight ? 'bg-[#0E7C7B] text-white' : 'bg-[#F0F4F8] text-[#4A5B76] hover:bg-[#E3EAF1]'}`}>
                      <Star className="h-3 w-3" /> {p.highlight ? 'Highlighted' : 'Highlight'}
                    </button>
                    <button type="button" onClick={() => setPlan(i, { enabled: !p.enabled, highlight: p.enabled ? false : p.highlight })} aria-pressed={p.enabled}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${p.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.enabled ? <><Eye className="h-3 w-3" /> Shown</> : <><EyeOff className="h-3 w-3" /> Hidden</>}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={label} htmlFor={`pl-name-${p.id}`}>Plan name</label>
                    <input id={`pl-name-${p.id}`} value={p.name} maxLength={40} onChange={(e) => setPlan(i, { name: e.target.value })} className={input} />
                  </div>
                  <div>
                    <label className={label} htmlFor={`pl-price-${p.id}`}>Price (USD)</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8A9AB0]">$</span>
                      <input id={`pl-price-${p.id}`} type="number" min={0} step="0.01" inputMode="decimal" value={p.price} onChange={(e) => setPlan(i, { price: e.target.value })} className={`${input} pl-6`} />
                    </div>
                  </div>
                  <div>
                    <label className={label} htmlFor={`pl-months-${p.id}`}>Length (months)</label>
                    <input id={`pl-months-${p.id}`} type="number" min={1} max={36} step={1} value={p.months} onChange={(e) => setPlan(i, { months: e.target.value })} className={input} />
                  </div>
                  <div className="col-span-2">
                    <label className={label} htmlFor={`pl-term-${p.id}`}>Shown after the price</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#5F6F86]">/</span>
                      <input id={`pl-term-${p.id}`} value={p.term} maxLength={30} onChange={(e) => setPlan(i, { term: e.target.value })} placeholder="3 months" className={input} />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className={label} htmlFor={`pl-badge-${p.id}`}>Badge <span className="font-normal text-[#8A9AB0]">(optional)</span></label>
                    <input id={`pl-badge-${p.id}`} value={p.badge} maxLength={40} onChange={(e) => setPlan(i, { badge: e.target.value })} placeholder="Best value" className={input} />
                    {pct > 0 && !p.badge.includes(`${pct}%`) && (
                      <button type="button" onClick={() => setPlan(i, { badge: p.highlight ? `Best value · Save ${pct}%` : `Save ${pct}%` })}
                        className="mt-1.5 flex items-center gap-1 text-xs font-medium text-[#0E7C7B] hover:underline">
                        <Sparkles className="h-3 w-3" /> Use “{p.highlight ? `Best value · Save ${pct}%` : `Save ${pct}%`}”
                      </button>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className={label} htmlFor={`pl-extras-${p.id}`}>Extra perks for this plan (one per line)</label>
                    <textarea id={`pl-extras-${p.id}`} rows={2} value={p.extras} onChange={(e) => setPlan(i, { extras: e.target.value })} className={input} />
                  </div>
                </div>

                <p className="mt-3 rounded bg-[#F5F8FB] px-3 py-2 text-xs text-[#4A5B76]">
                  {valid
                    ? <>Page shows <strong className="text-[#0D1B4C]">{formatMoney(live.price)} / {live.term || '…'}</strong>{live.months > 1 && <> · about {formatMoney(perMonth(live))}/month</>}{pct > 0 && <> · saves {pct}%</>}</>
                    : 'Enter a price and a length in whole months.'}
                </p>
              </div>
            );
          })}
        </div>

        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF3F8] pt-4">
          <p className="text-xs text-[#5F6F86]">Changes apply to the public page and to new requests. Requests already sent keep the price they were quoted.</p>
          <div className="flex gap-2">
            {defaults && (
              <button type="button" onClick={() => setDraft(toDraft(defaults[product]))} className="flex items-center gap-1.5 rounded-lg border border-[#D3DEE8] px-3 py-2 text-sm font-medium text-[#2E3F5C] hover:bg-[#F5F8FB]">
                <RotateCcw className="h-3.5 w-3.5" /> Recommended {PLACEMENT_META[product].short.toLowerCase()} pricing
              </button>
            )}
            <button type="button" disabled={!dirty || saving} onClick={() => { setDrafts(JSON.parse(savedJson)); setError(null); }}
              className="rounded-lg border border-[#D3DEE8] px-3 py-2 text-sm font-medium text-[#2E3F5C] hover:bg-[#F5F8FB] disabled:opacity-50">
              Discard changes
            </button>
            <button type="button" disabled={!dirty || saving} onClick={save}
              className="flex items-center gap-2 rounded-lg bg-[#0E7C7B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B6564] disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save pricing
            </button>
          </div>
        </div>
      </div>
      <Toast toasts={toasts} onRemove={remove} />
    </div>
  );
}
