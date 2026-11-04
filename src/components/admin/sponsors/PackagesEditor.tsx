'use client';

/* Sponsor packages & prices (tiers and à-la-carte placements) */

import { useState } from 'react';
import { Plus, Trash2, Loader2, RotateCcw, Check } from 'lucide-react';
import { KIND_META, SPONSOR_KINDS, todayIso, phaseOf, type SponsorKind, type SponsorPackage } from '@/lib/sponsors';
import { INPUT, LABEL, CARD, BTN, BTN_GHOST, sponsorApi, KindDot, type SponsorData } from './shared';

const TERMS: [number, string][] = [[0, 'One-time'], [1, '1 month'], [3, '3 months'], [6, '6 months'], [12, '12 months']];
type Draft = SponsorPackage & { perksText: string; key: string };
const toDraft = (p: SponsorPackage, i: number): Draft => ({ ...p, perksText: p.perks.join('\n'), key: `${p.id}-${i}` });

export default function PackagesEditor({ data, onSaved }: { data: SponsorData; onSaved: (packages: SponsorPackage[]) => void }) {
  const [drafts, setDrafts] = useState<Draft[]>(() => data.packages.map(toDraft));
  const [busy, setBusy] = useState<'save' | 'reset' | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const today = todayIso();
  const liveOf = (id: string) => data.promotions.filter((p) => p.package_id === id && p.status === 'booked' && phaseOf(p, today) === 'live').length;

  const edit = (key: string, patch: Partial<Draft>) => { setDrafts((d) => d.map((x) => (x.key === key ? { ...x, ...patch } : x))); setDirty(true); setMsg(null); };
  const add = (kind: SponsorKind) => {
    setDrafts((d) => [...d, { id: '', kind, name: kind === 'tier' ? 'New tier' : 'New placement', blurb: '', perks: [], perksText: '', slots: 0, enabled: true, key: `new-${Date.now()}`,
      options: kind === 'tier' ? [{ id: 'monthly', label: 'Monthly', price: 0, months: 1 }, { id: 'annual', label: 'Annual', price: 0, months: 12 }] : [{ id: 'per_event', label: 'Per tournament', price: 0, months: 0 }] }]);
    setDirty(true);
  };
  const remove = (d: Draft) => {
    const inUse = data.promotions.some((p) => p.package_id === d.id);
    if (!window.confirm(inUse ? `${d.name} has promotions. They’ll keep their name and price, but you won’t be able to sell it again. Remove it?` : `Remove ${d.name}?`)) return;
    setDrafts((x) => x.filter((y) => y.key !== d.key)); setDirty(true);
  };

  const save = async () => {
    setBusy('save'); setMsg(null);
    try {
      const packages = drafts.map((d) => {
        const { perksText, key, ...p } = d; void key;
        return { ...p, perks: perksText.split('\n').map((s) => s.trim()).filter(Boolean) };
      });
      const j = await sponsorApi<{ packages: SponsorPackage[] }>('/api/admin/sponsors/packages', { method: 'PUT', body: JSON.stringify({ packages }) });
      setDrafts(j.packages.map(toDraft)); setDirty(false); onSaved(j.packages);
      setMsg({ ok: true, text: 'Packages saved.' });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(null); }
  };
  const reset = async () => {
    if (!window.confirm('Replace all packages with the recommended HOOX defaults?')) return;
    setBusy('reset'); setMsg(null);
    try {
      const j = await sponsorApi<{ packages: SponsorPackage[] }>('/api/admin/sponsors/packages', { method: 'DELETE' });
      setDrafts(j.packages.map(toDraft)); setDirty(false); onSaved(j.packages);
      setMsg({ ok: true, text: 'Recommended packages restored.' });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#F1F6FA]/95 px-1 py-2 backdrop-blur">
        <p className="text-sm text-[#5F6F86]">{data.packagesSaved ? 'Your saved packages.' : 'Recommended starting packages (not saved yet).'} Prices here fill in automatically when you add a promotion.</p>
        <div className="flex items-center gap-2">
          {msg && <span className={`flex items-center gap-1 text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`} role="status">{msg.ok && <Check className="h-4 w-4" />}{msg.text}</span>}
          <button type="button" onClick={reset} disabled={!!busy} className={BTN_GHOST}>{busy === 'reset' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}Use recommended</button>
          <button type="button" onClick={save} disabled={!!busy || (!dirty && data.packagesSaved)} className={BTN}>{busy === 'save' && <Loader2 className="h-4 w-4 animate-spin" />}Save packages</button>
        </div>
      </div>

      {SPONSOR_KINDS.map((kind) => (
        <section key={kind} aria-labelledby={`pk-${kind}`}>
          <div className="mb-3 flex items-center justify-between">
            <h3 id={`pk-${kind}`} className="flex items-center gap-2 font-montserrat text-lg font-bold text-[#0D1B4C]"><KindDot kind={kind} />{KIND_META[kind].label}</h3>
            <button type="button" onClick={() => add(kind)} className={BTN_GHOST}><Plus className="h-4 w-4" />Add {kind === 'tier' ? 'tier' : 'placement'}</button>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {drafts.filter((d) => d.kind === kind).map((d) => (
              <div key={d.key} className={`${CARD} ${d.enabled ? '' : 'opacity-70'}`}>
                <div className="flex items-start gap-3">
                  <label className="flex-1"><span className={LABEL}>Name</span><input className={`${INPUT} font-semibold`} value={d.name} onChange={(e) => edit(d.key, { name: e.target.value })} /></label>
                  <label className="w-[110px]"><span className={LABEL}>Slots</span>
                    <input type="number" min={0} max={99} className={INPUT} value={d.slots} onChange={(e) => edit(d.key, { slots: Number(e.target.value) })} title="How many brands can hold this at once. 0 = no limit" />
                  </label>
                  <label className="mt-6 flex items-center gap-2 text-sm text-[#2E3F5C]">
                    <input type="checkbox" checked={d.enabled} onChange={(e) => edit(d.key, { enabled: e.target.checked })} className="h-4 w-4 accent-[#0E7C7B]" />On sale
                  </label>
                </div>
                <label className="mt-3 block"><span className={LABEL}>Short description</span><input className={INPUT} value={d.blurb} onChange={(e) => edit(d.key, { blurb: e.target.value })} /></label>
                <label className="mt-3 block"><span className={LABEL}>What’s included <span className="font-normal text-[#8A9AB0]">(one per line)</span></span>
                  <textarea rows={4} className={`${INPUT} h-auto py-2`} value={d.perksText} onChange={(e) => edit(d.key, { perksText: e.target.value })} />
                </label>
                <div className="mt-3">
                  <span className={LABEL}>Prices</span>
                  <ul className="space-y-2">
                    {d.options.map((o, i) => (
                      <li key={i} className="grid grid-cols-[minmax(0,1fr)_96px_minmax(0,116px)_32px] items-center gap-2">
                        <input aria-label="Price label" className={INPUT} value={o.label} onChange={(e) => edit(d.key, { options: d.options.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                        <span className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8A9AB0]">$</span>
                          <input aria-label="Price" type="number" min={0} className={`${INPUT} pl-6`} value={o.price} onChange={(e) => edit(d.key, { options: d.options.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)) })} />
                        </span>
                        <select aria-label="Term" className={INPUT} value={o.months} onChange={(e) => edit(d.key, { options: d.options.map((x, j) => (j === i ? { ...x, months: Number(e.target.value) } : x)) })}>
                          {TERMS.map(([m, l]) => <option key={m} value={m}>{l}</option>)}
                        </select>
                        <button type="button" aria-label="Remove price" disabled={d.options.length === 1} onClick={() => edit(d.key, { options: d.options.filter((_, j) => j !== i) })} className="rounded p-1.5 text-[#8A9AB0] hover:bg-red-50 hover:text-red-600 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                      </li>
                    ))}
                  </ul>
                  {d.options.length < 6 && <button type="button" onClick={() => edit(d.key, { options: [...d.options, { id: '', label: 'New price', price: 0, months: 1 }] })} className="mt-2 text-[13px] font-semibold text-[#0E7C7B] hover:underline">+ Add price</button>}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#EEF3F8] pt-3 text-xs text-[#6B7D93]">
                  <span>{d.id ? `${liveOf(d.id)} live now${d.slots ? ` · ${d.slots} slot${d.slots === 1 ? '' : 's'}` : ''}` : 'New'}</span>
                  <button type="button" onClick={() => remove(d)} className="flex items-center gap-1 font-semibold text-red-600 hover:underline"><Trash2 className="h-3.5 w-3.5" />Remove</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
