'use client';

/* Admin → Marketing → Affiliate Management → Affiliate Accounts */

import { Fragment, useMemo, useState } from 'react';
import { Plus, Search, X, Loader2, ChevronDown, Copy, Check, Mail, Phone, Globe, Trash2, UserPlus, Users, UserCheck, Clock, Wallet } from 'lucide-react';
import {
  AFFILIATE_STATUSES, AFFILIATE_STATUS_META, PAYOUT_METHODS, PAYOUT_METHOD_LABEL, referralLink, referralEnds, referralIsEarning, todayIso, formatMoney,
  type AffiliateData, type AffiliateInsights, type AffiliateStatus, type DbAffiliate, type PayoutMethod,
} from '@/lib/affiliates';
import { Header, Tile, CARD, INPUT, LABEL, BTN, BTN_GHOST, ErrorNote, fmtDate, sponsorApi as api } from '../sponsors/shared';
import { useAffiliateData, StatusPill, pct } from './common';
import { RecordPayout } from './AffiliatePages';

const Loading = () => <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#5F6F86]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;

type Form = { name: string; email: string; organization: string; phone: string; website: string; ratePercent: string; windowMonths: string; code: string; payoutMethod: string; payoutDetails: string; audience: string; notes: string; status: AffiliateStatus };
const blank = (d: AffiliateData): Form => ({ name: '', email: '', organization: '', phone: '', website: '', ratePercent: String(d.settings.defaultRate), windowMonths: String(d.settings.windowMonths), code: '', payoutMethod: '', payoutDetails: '', audience: '', notes: '', status: 'active' });
const formOf = (a: DbAffiliate): Form => ({
  name: a.name, email: a.email, organization: a.organization || '', phone: a.phone || '', website: a.website || '', ratePercent: String(Number(a.rate_percent)),
  windowMonths: String(a.window_months), code: a.code, payoutMethod: a.payout_method || '', payoutDetails: a.payout_details || '', audience: a.audience || '', notes: a.notes || '', status: a.status,
});
const bodyOf = (f: Form) => ({ ...f, ratePercent: Number(f.ratePercent), windowMonths: Number(f.windowMonths), code: f.code || undefined });

function Fields({ f, set, isNew }: { f: Form; set: (f: Form) => void; isNew?: boolean }) {
  const input = (k: keyof Form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label><span className={LABEL}>{label}</span><input className={INPUT} value={f[k]} onChange={(e) => set({ ...f, [k]: e.target.value })} {...props} /></label>
  );
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {input('name', 'Name')}
      {input('email', 'Email', { type: 'email' })}
      {input('organization', 'Organization')}
      {input('phone', 'Phone', { type: 'tel' })}
      {input('website', 'Website or social', { placeholder: 'instagram.com/…' })}
      {input('ratePercent', 'Commission (% of HOOX’s cut)', { type: 'number', min: 0, max: 100, step: '0.5' })}
      {input('windowMonths', 'Earns for (months per director)', { type: 'number', min: 1, max: 120 })}
      {input('code', 'Referral code', { placeholder: isNew ? 'Created automatically' : '', style: { textTransform: 'uppercase' } })}
      <label><span className={LABEL}>Payout method</span>
        <select className={INPUT} value={f.payoutMethod} onChange={(e) => set({ ...f, payoutMethod: e.target.value })}>
          <option value="">Not set</option>
          {PAYOUT_METHODS.map((m) => <option key={m} value={m}>{PAYOUT_METHOD_LABEL[m]}</option>)}
        </select>
      </label>
      <label className="md:col-span-1 xl:col-span-2">{/* PayPal email, Venmo handle, mailing address */}
        <span className={LABEL}>Payout details</span><input className={INPUT} value={f.payoutDetails} onChange={(e) => set({ ...f, payoutDetails: e.target.value })} placeholder="PayPal email, @venmo, or mailing address" />
      </label>
      {isNew && (
        <label><span className={LABEL}>Status</span>
          <select className={INPUT} value={f.status} onChange={(e) => set({ ...f, status: e.target.value as AffiliateStatus })}>
            {AFFILIATE_STATUSES.map((s) => <option key={s} value={s}>{AFFILIATE_STATUS_META[s].label}</option>)}
          </select>
        </label>
      )}
      <label className="md:col-span-2 xl:col-span-2"><span className={LABEL}>How they’ll promote HOOX</span><textarea rows={2} className={`${INPUT} h-auto py-2`} value={f.audience} onChange={(e) => set({ ...f, audience: e.target.value })} /></label>
      <label className="md:col-span-2 xl:col-span-2"><span className={LABEL}>Admin notes</span><textarea rows={2} className={`${INPUT} h-auto py-2`} value={f.notes} onChange={(e) => set({ ...f, notes: e.target.value })} /></label>
    </div>
  );
}

export function AffiliateAccountsPage() {
  const { data, ins, error, reload } = useAffiliateData();
  const [status, setStatus] = useState<AffiliateStatus | 'all'>(() => (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('status') === 'pending' ? 'pending' : 'all'));
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [open, setOpen] = useState<string | null>(() => (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('open') : null));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const t = q.trim().toLowerCase();
  const rows = (ins?.totals || []).filter((r) => (status === 'all' || r.affiliate.status === status) && (!t || [r.affiliate.name, r.affiliate.email, r.affiliate.organization, r.affiliate.code].some((v) => (v || '').toLowerCase().includes(t))));

  const create = async () => {
    if (!form) return;
    setBusy(true); setErr(null);
    try { await api('/api/admin/affiliates', { method: 'POST', body: JSON.stringify(bodyOf(form)) }); setAdding(false); setForm(null); await reload(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div>
      <Header title="Affiliate Accounts" sub="Applications, approved affiliates, their referral links and the directors they’ve brought to HOOX" />
      {error && <ErrorNote>{error}</ErrorNote>}
      {!data || !ins ? <Loading /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile icon={UserCheck} label="Active affiliates" value={String(ins.counts.active)} sub={`${ins.counts.paused} paused`} />
            <Tile icon={Clock} label="Applications" value={String(ins.counts.pending)} sub={ins.counts.pending ? 'Waiting for review' : 'All caught up'} tone={ins.counts.pending ? 'down' : undefined} />
            <Tile icon={Users} label="Referred directors" value={String(ins.referrals)} sub={`${ins.earningReferrals} still earning`} />
            <Tile icon={Wallet} label="Owed to affiliates" value={formatMoney(ins.owed)} sub={`${formatMoney(ins.paid)} paid so far`} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter affiliates">
                {(['all', ...AFFILIATE_STATUSES] as const).map((s) => (
                  <button key={s} type="button" role="tab" aria-selected={status === s} onClick={() => setStatus(s)}
                    className={`rounded-full border px-3 py-1 text-[13px] font-medium transition ${status === s ? 'border-[#0E7C7B] bg-[#0E7C7B] text-white' : 'border-[#D3DEE8] bg-white text-[#2E3F5C] hover:bg-[#F5F8FB]'}`}>
                    {s === 'all' ? 'All' : AFFILIATE_STATUS_META[s].label} <span className={status === s ? 'text-white/80' : 'text-[#8A9AB0]'}>{s === 'all' ? data.affiliates.length : ins.counts[s]}</span>
                  </button>
                ))}
              </div>
              <label className="relative block w-[240px]">
                <span className="sr-only">Search affiliates</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9AB0]" />
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or code" className={`${INPUT} pl-9`} />
              </label>
            </div>
            {!adding && <button type="button" onClick={() => { setAdding(true); setForm(blank(data)); }} className={BTN}><Plus className="h-4 w-4" />Add affiliate</button>}
          </div>

          {adding && form && (
            <section className={CARD} aria-labelledby="add-aff">
              <div className="mb-4 flex items-center justify-between">
                <h3 id="add-aff" className="font-semibold text-[#0D1B4C]">Add an affiliate</h3>
                <button type="button" onClick={() => setAdding(false)} className="rounded p-1 text-[#8A9AB0] hover:bg-[#F2F7FA]" aria-label="Close"><X className="h-4 w-4" /></button>
              </div>
              <Fields f={form} set={setForm} isNew />
              {err && <p className="mt-3 text-sm text-red-600" role="alert">{err}</p>}
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={create} disabled={busy} className={BTN}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save affiliate</button>
                <button type="button" onClick={() => setAdding(false)} className={BTN_GHOST}>Cancel</button>
              </div>
            </section>
          )}

          <div className="overflow-x-auto rounded-lg border border-[#E8EEF4] bg-white shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
            {rows.length === 0 ? <p className="py-10 text-center text-sm text-[#5F6F86]">{data.affiliates.length === 0 ? 'No affiliates yet. Applications from the Affiliate Programs page show up here.' : 'No affiliates match.'}</p> : (
              <table className="w-full min-w-[960px] text-sm">
                <thead className="border-b border-[#EEF3F8] bg-[#F7FAFC] text-left text-xs uppercase text-[#7A8BA3]">
                  <tr><th className="px-4 py-3">Affiliate</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3 text-right">Directors</th><th className="px-4 py-3 text-right">Registrations</th><th className="px-4 py-3 text-right">Earned</th><th className="px-4 py-3 text-right">Paid</th><th className="px-4 py-3 text-right">Owed</th><th className="w-8" /></tr>
                </thead>
                <tbody className="divide-y divide-[#EEF3F8]">
                  {rows.map((r) => (
                    <Fragment key={r.affiliate.id}>
                      <tr className="cursor-pointer hover:bg-[#F7FAFC]" onClick={() => setOpen(open === r.affiliate.id ? null : r.affiliate.id)} aria-expanded={open === r.affiliate.id}>
                        <td className="px-4 py-3"><span className="block font-medium text-[#0D1B4C]">{r.affiliate.name}</span><span className="block text-xs text-[#6B7D93]">{r.affiliate.organization || r.affiliate.email}</span></td>
                        <td className="px-4 py-3 font-mono text-[13px] text-[#2E3F5C]">{r.affiliate.code}</td>
                        <td className="px-4 py-3"><StatusPill status={r.affiliate.status} /></td>
                        <td className="px-4 py-3 text-right">{pct(r.affiliate.rate_percent)}</td>
                        <td className="px-4 py-3 text-right">{r.referrals}{r.earningReferrals < r.referrals && <span className="text-[#8A9AB0]"> ({r.earningReferrals} earning)</span>}</td>
                        <td className="px-4 py-3 text-right">{r.registrations}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[#0D1B4C]">{formatMoney(r.earned)}</td>
                        <td className="px-4 py-3 text-right text-[#2E3F5C]">{formatMoney(r.paid)}</td>
                        <td className={`px-4 py-3 text-right ${r.owed > 0 ? 'font-semibold text-amber-700' : 'text-[#8A9AB0]'}`}>{r.owed > 0 ? formatMoney(r.owed) : '—'}</td>
                        <td className="px-2"><ChevronDown className={`h-4 w-4 text-[#8A9AB0] transition ${open === r.affiliate.id ? 'rotate-180' : ''}`} /></td>
                      </tr>
                      {open === r.affiliate.id && <tr className="bg-[#FAFCFD]"><td colSpan={10} className="px-4 py-4"><AffiliateDetail data={data} ins={ins} a={r.affiliate} reload={reload} onDeleted={() => setOpen(null)} /></td></tr>}
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

function CopyLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const link = referralLink(code, typeof window !== 'undefined' ? window.location.origin : undefined);
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#D3DEE8] bg-white py-1 pl-3 pr-1">
      <span className="min-w-0 truncate font-mono text-[12.5px] text-[#2E3F5C]">{link}</span>
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* blocked */ } }}
        className="flex flex-shrink-0 items-center gap-1 rounded-md bg-[#0E7C7B] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0B6564]">
        {copied ? <><Check className="h-3.5 w-3.5" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy link</>}
      </button>
    </div>
  );
}

function AffiliateDetail({ data, ins, a, reload, onDeleted }: { data: AffiliateData; ins: AffiliateInsights; a: DbAffiliate; reload: () => Promise<void>; onDeleted: () => void }) {
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState<Form>(() => formOf(a));
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [credit, setCredit] = useState({ directorId: '', referredAt: todayIso() });
  const today = todayIso();
  const tot = ins.totals.find((x) => x.affiliate.id === a.id)!;
  const refs = data.referrals.filter((r) => r.affiliate_id === a.id && r.status === 'active');
  const lines = ins.lines.filter((l) => l.referral.affiliate_id === a.id);
  const pays = data.payouts.filter((p) => p.affiliate_id === a.id);
  const credited = useMemo(() => new Set(data.referrals.filter((r) => r.status === 'active').map((r) => r.director_id)), [data.referrals]);
  const available = data.directors.filter((d) => !credited.has(d.id));

  const run = async (label: string, url: string, init: RequestInit, ok: string, after?: () => void) => {
    setBusy(label); setMsg(null);
    try { await api(url, init); await reload(); setMsg({ ok: true, text: ok }); after?.(); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(null); }
  };
  const patch = (body: Record<string, unknown>, label: string, ok: string, after?: () => void) => run(label, `/api/admin/affiliates/${a.id}`, { method: 'PATCH', body: JSON.stringify(body) }, ok, after);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {a.status === 'pending' && <>
            <button type="button" disabled={!!busy} onClick={() => patch({ status: 'active' }, 'approve', `${a.name} is approved. Send them their referral link.`)} className={BTN}>{busy === 'approve' && <Loader2 className="h-4 w-4 animate-spin" />}Approve</button>
            <button type="button" disabled={!!busy} onClick={() => patch({ status: 'declined' }, 'decline', 'Application declined.')} className={`${BTN_GHOST} text-red-600 hover:bg-red-50`}>Decline</button>
          </>}
          {a.status === 'active' && <button type="button" disabled={!!busy} onClick={() => patch({ status: 'paused' }, 'pause', 'Paused. Their link stops crediting new directors; existing referrals keep earning.')} className={BTN_GHOST}>Pause</button>}
          {(a.status === 'paused' || a.status === 'declined') && <button type="button" disabled={!!busy} onClick={() => patch({ status: 'active' }, 'activate', 'Affiliate is active.')} className={BTN_GHOST}>{a.status === 'declined' ? 'Approve' : 'Reactivate'}</button>}
          <button type="button" onClick={() => { setEditing((v) => !v); setF(formOf(a)); }} className={BTN_GHOST}>{editing ? 'Close editor' : 'Edit details'}</button>
          {refs.length === 0 && pays.length === 0 && (
            <button type="button" disabled={!!busy} onClick={() => { if (window.confirm(`Delete ${a.name}? This can’t be undone.`)) run('delete', `/api/admin/affiliates/${a.id}`, { method: 'DELETE' }, 'Deleted.', onDeleted); }} className={`${BTN_GHOST} text-red-600 hover:bg-red-50`}><Trash2 className="h-4 w-4" />Delete</button>
          )}
        </div>
        {a.status === 'active' && <div className="w-full max-w-[520px]"><CopyLink code={a.code} /></div>}
      </div>
      {msg && <p className={`text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`} role="status">{msg.text}</p>}

      {editing ? (
        <div>
          <Fields f={f} set={setF} />
          <p className="mt-2 text-xs text-[#6B7D93]">A new rate or window applies to directors referred from now on. Change an existing referral below.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={!!busy} onClick={() => patch(bodyOf(f), 'save', 'Saved.', () => setEditing(false))} className={BTN}>{busy === 'save' && <Loader2 className="h-4 w-4 animate-spin" />}Save changes</button>
            <button type="button" onClick={() => setEditing(false)} className={BTN_GHOST}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 text-[13px] text-[#2E3F5C] lg:grid-cols-3">
          <div className="space-y-1.5">
            <a href={`mailto:${a.email}`} className="flex items-center gap-1.5 text-[#0E7C7B] hover:underline"><Mail className="h-3.5 w-3.5" />{a.email}</a>
            {a.phone && <a href={`tel:${a.phone}`} className="flex items-center gap-1.5 hover:underline"><Phone className="h-3.5 w-3.5" />{a.phone}</a>}
            {a.website && <a href={a.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#0E7C7B] hover:underline"><Globe className="h-3.5 w-3.5" />{a.website.replace(/^https?:\/\//, '')}</a>}
            <p className="text-[#6B7D93]">{a.source === 'web' ? 'Applied' : 'Added by HOOX'} {fmtDate(a.created_at)}{a.approved_at ? ` · approved ${fmtDate(a.approved_at)}` : ''}</p>
          </div>
          <div className="space-y-1.5">
            <p><span className="font-semibold text-[#0D1B4C]">Terms:</span> {pct(a.rate_percent)} of HOOX’s cut for {a.window_months} months per director</p>
            <p><span className="font-semibold text-[#0D1B4C]">Payout:</span> {a.payout_method ? `${PAYOUT_METHOD_LABEL[a.payout_method as PayoutMethod]}${a.payout_details ? ` · ${a.payout_details}` : ''}` : 'Not set yet'}</p>
            {a.notes && <p className="whitespace-pre-line text-[#4A5B76]"><span className="font-semibold text-[#0D1B4C]">Notes:</span> {a.notes}</p>}
          </div>
          {a.audience && <div><p className="font-semibold text-[#0D1B4C]">How they’ll promote HOOX</p><p className="mt-0.5 whitespace-pre-line text-[#4A5B76]">{a.audience}</p></div>}
        </div>
      )}

      {/* Earnings summary */}
      <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3 xl:grid-cols-6">
        {[['Tournaments', String(tot.tournaments)], ['Registrations', String(tot.registrations)], ['HOOX revenue generated', formatMoney(tot.hooxRevenue)], ['Commission earned', formatMoney(tot.earned)], ['Paid', formatMoney(tot.paid)], ['Owed', formatMoney(tot.owed)]].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-[#E8EEF4] bg-white px-3 py-2"><dt className="text-xs text-[#6B7D93]">{k}</dt><dd className="font-montserrat text-lg font-bold text-[#0D1B4C]">{v}</dd></div>
        ))}
      </dl>

      {/* Referred directors */}
      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7A8BA3]">Referred tournament directors</h4>
        <div className="overflow-x-auto rounded-lg border border-[#E8EEF4] bg-white">
          {refs.length === 0 ? <p className="py-6 text-center text-sm text-[#8A9AB0]">No directors yet. Directors who sign up with this affiliate’s link appear here automatically.</p> : (
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-[#EEF3F8] bg-[#F7FAFC] text-left text-xs uppercase text-[#7A8BA3]"><tr><th className="px-3 py-2">Director</th><th className="px-3 py-2">Referred</th><th className="px-3 py-2">Earns until</th><th className="px-3 py-2 text-right">Rate</th><th className="px-3 py-2 text-right">Tournaments</th><th className="px-3 py-2 text-right">Registrations</th><th className="px-3 py-2 text-right">Commission</th><th className="px-3 py-2" /></tr></thead>
              <tbody className="divide-y divide-[#EEF3F8]">
                {refs.map((r) => {
                  const my = lines.filter((l) => l.referral.id === r.id);
                  const earning = referralIsEarning(r, today);
                  return (
                    <tr key={r.id}>
                      <td className="px-3 py-2"><span className="block font-medium text-[#0D1B4C]">{r.director_name}</span><span className="block text-xs text-[#6B7D93]">{r.director_email}{r.source === 'admin' ? ' · added by HOOX' : ' · via link'}</span></td>
                      <td className="px-3 py-2 text-[#4A5B76]">{fmtDate(r.referred_at)}</td>
                      <td className={`px-3 py-2 ${earning ? 'text-[#4A5B76]' : 'text-[#8A9AB0]'}`}>{fmtDate(referralEnds(r))}{!earning && ' (ended)'}</td>
                      <td className="px-3 py-2 text-right">{pct(r.rate_percent)}</td>
                      <td className="px-3 py-2 text-right">{new Set(my.map((l) => l.tournament.id)).size}</td>
                      <td className="px-3 py-2 text-right">{my.length}</td>
                      <td className="px-3 py-2 text-right font-semibold text-[#0D1B4C]">{formatMoney(my.reduce((n, l) => n + l.commission, 0))}</td>
                      <td className="px-3 py-2 text-right">
                        <button type="button" disabled={!!busy} onClick={() => { if (window.confirm(`Stop crediting ${r.director_name} to ${a.name}? Commission already earned on their registrations is removed too.`)) run('rm' + r.id, `/api/admin/affiliates/referrals/${r.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'removed' }) }, 'Director removed.'); }}
                          className="text-xs font-semibold text-red-600 hover:underline">Remove</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {a.status !== 'declined' && (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="w-[300px]"><span className={LABEL}>Credit a director by hand</span>
              <select className={INPUT} value={credit.directorId} onChange={(e) => setCredit({ ...credit, directorId: e.target.value })}>
                <option value="">{available.length ? 'Choose a tournament director…' : 'Every director is already credited'}</option>
                {available.map((d) => <option key={d.id} value={d.id}>{d.name}{d.organization ? ` · ${d.organization}` : ''}</option>)}
              </select>
            </label>
            <label className="w-[170px]"><span className={LABEL}>Referred on</span><input type="date" className={INPUT} value={credit.referredAt} onChange={(e) => setCredit({ ...credit, referredAt: e.target.value })} /></label>
            <button type="button" disabled={!!busy || !credit.directorId} onClick={() => run('credit', '/api/admin/affiliates/referrals', { method: 'POST', body: JSON.stringify({ affiliateId: a.id, ...credit }) }, 'Director credited.', () => setCredit({ directorId: '', referredAt: todayIso() }))} className={BTN_GHOST}>
              {busy === 'credit' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}Credit director
            </button>
          </div>
        )}
      </section>

      {/* Payouts */}
      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7A8BA3]">Payouts</h4>
        {pays.length > 0 && (
          <ul className="mb-3 divide-y divide-[#EEF3F8] rounded-lg border border-[#E8EEF4] bg-white text-sm">
            {pays.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <span className="text-[#2E3F5C]">{fmtDate(p.paid_at)} · {p.method ? PAYOUT_METHOD_LABEL[p.method] : 'Payment'}{p.reference ? ` · ${p.reference}` : ''}{p.notes ? <span className="text-[#6B7D93]"> · {p.notes}</span> : null}</span>
                <span className="font-semibold text-[#0D1B4C]">{formatMoney(Number(p.amount))}</span>
              </li>
            ))}
          </ul>
        )}
        <RecordPayout affiliate={a} owed={tot.owed} onSaved={reload} />
      </section>
    </div>
  );
}
