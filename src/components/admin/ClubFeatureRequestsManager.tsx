'use client';

import { useCallback, useEffect, useState } from 'react';
import { Star, Loader2, AlertCircle, Mail, Phone, RefreshCw } from 'lucide-react';
import { Toast, useToast } from '@/components/ui/Toast';
import { DEFAULT_FEATURE_PRICING, planIn, formatMoney, type DbClubFeatureRequest, type SubmissionStatus } from '@/lib/clubFeature';

/* ------------------------------------------------------------------ */
/* Admin → Clubs → Feature Requests                                    */
/* Approving a request linked to a listed club features it for the     */
/* plan's length (see /api/admin/club-feature-requests/[id]).          */
/* ------------------------------------------------------------------ */

const STATUS_META: Record<SubmissionStatus, { label: string; cls: string }> = {
  new: { label: 'New', cls: 'bg-[#E3F4F4] text-[#0B6564]' },
  in_review: { label: 'Invoice sent', cls: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Featured', cls: 'bg-green-100 text-green-700' },
  declined: { label: 'Declined', cls: 'bg-gray-100 text-gray-600' },
};
const FILTERS: (SubmissionStatus | 'all')[] = ['all', 'new', 'in_review', 'approved', 'declined'];
const ROLE_LABEL: Record<string, string> = { angler: 'Angler', director: 'Tournament Director', admin: 'Admin' };

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
const fmt = (d: string | null) => (d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

function Row({ r, onChanged }: { r: DbClubFeatureRequest; onChanged: (r: DbClubFeatureRequest, msg: string, warn: boolean) => void }) {
  const [notes, setNotes] = useState(r.admin_notes || '');
  const [saving, setSaving] = useState(false);
  // Show what was quoted when they asked (older requests fall back to the default plan)
  const fallback = planIn(DEFAULT_FEATURE_PRICING, r.plan);
  const planName = r.plan_name || fallback?.name || r.plan;
  const price = r.price_quoted ?? fallback?.price;

  const save = async (body: Record<string, unknown>, msg: string) => {
    setSaving(true);
    try {
      const j = await api<{ request: DbClubFeatureRequest; featuredThrough: string | null; warning: string | null }>(
        `/api/admin/club-feature-requests/${r.id}`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      );
      onChanged(j.request, j.warning || (j.featuredThrough ? `${r.club_name} is featured through ${fmt(j.featuredThrough)}` : msg), !!j.warning);
    } catch (e) {
      onChanged(r, (e as Error).message, true);
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
          <span className="rounded-full bg-[#FFF4E5] px-2 py-0.5 text-xs text-[#9A5B00]">{price != null ? `${planName} · ${formatMoney(Number(price))}` : planName}</span>
          {!r.club_submission_id && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">Club not listed</span>}
        </div>
        <div className="mt-1 text-xs text-[#5F6F86]">
          Start {r.start_date ? fmt(r.start_date) : 'on approval'} · received {fmt(r.created_at)}{r.promo_code ? ` · promo ${r.promo_code}` : ''}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="text-[#2E3F5C]">{r.requester_name} ({ROLE_LABEL[r.requester_role] || r.requester_role})</span>
          <a href={`mailto:${r.requester_email}?subject=${encodeURIComponent(`Featuring ${r.club_name} on HOOX`)}`} className="flex items-center gap-1.5 text-[#0E7C7B] hover:underline"><Mail className="h-3.5 w-3.5" />{r.requester_email}</a>
          {r.contact_phone && <a href={`tel:${r.contact_phone}`} className="flex items-center gap-1.5 text-[#2E3F5C]"><Phone className="h-3.5 w-3.5" />{r.contact_phone}</a>}
        </div>
        {r.notes && <p className="mt-2 whitespace-pre-line rounded bg-[#F5F8FB] px-3 py-2 text-sm text-[#2E3F5C]">{r.notes}</p>}
      </div>
      <div className="space-y-2">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} aria-label="Internal notes"
          className="w-full rounded-lg border border-[#D3DEE8] px-3 py-2 text-sm focus:ring-2 focus:ring-[#22B3B5]" placeholder="Invoice #, paid date…" />
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={saving || notes === (r.admin_notes || '')} onClick={() => save({ adminNotes: notes }, 'Notes saved')}
            className="rounded-lg border border-[#D3DEE8] px-3 py-1.5 text-sm font-medium text-[#2E3F5C] hover:bg-[#F5F8FB] disabled:opacity-50">Save notes</button>
          {r.status !== 'in_review' && r.status !== 'approved' && (
            <button type="button" disabled={saving} onClick={() => save({ status: 'in_review' }, 'Marked invoice sent')}
              className="rounded-lg border border-[#D3DEE8] px-3 py-1.5 text-sm font-semibold text-[#2E3F5C] hover:bg-[#F5F8FB] disabled:opacity-50">Invoice sent</button>
          )}
          {r.status !== 'approved' && (
            <button type="button" disabled={saving} onClick={() => save({ status: 'approved' }, 'Approved')}
              className="rounded-lg bg-[#0E7C7B] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#0B6564] disabled:opacity-50">Approve & feature</button>
          )}
          {r.status === 'approved' ? (
            <button type="button" disabled={saving} onClick={() => save({ status: 'declined' }, 'Featuring ended')}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">End featuring</button>
          ) : r.status !== 'declined' && (
            <button type="button" disabled={saving} onClick={() => save({ status: 'declined' }, 'Declined')}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">Decline</button>
          )}
          {saving && <Loader2 className="h-4 w-4 animate-spin self-center text-[#8A9AB0]" />}
        </div>
      </div>
    </li>
  );
}

export default function ClubFeatureRequestsManager() {
  const [items, setItems] = useState<DbClubFeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SubmissionStatus | 'all'>('new');
  const { toasts, remove, success, error: toastError } = useToast();

  const load = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const { requests } = await api<{ requests: DbClubFeatureRequest[] }>('/api/admin/club-feature-requests');
      setItems(requests);
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const counts = items.reduce<Record<string, number>>((m, s) => ({ ...m, [s.status]: (m[s.status] || 0) + 1 }), {});
  const shown = filter === 'all' ? items : items.filter((s) => s.status === filter);

  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-[#E8EEF4] bg-white shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF3F8] px-5 py-3.5">
        <div>
          <span className="font-semibold text-[#0D1B4C]">Feature Requests</span>
          <span className="ml-2 text-xs text-[#5F6F86]">From the “Feature your Club” page</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter === f ? 'bg-[#0E7C7B] text-white' : 'bg-[#F0F4F8] text-[#4A5B76] hover:bg-[#E3EAF1]'}`}>
              {f === 'all' ? `All (${items.length})` : `${STATUS_META[f].label} (${counts[f] || 0})`}
            </button>
          ))}
          <button type="button" onClick={load} aria-label="Refresh" className="ml-1 rounded-lg p-1.5 text-[#8A9AB0] hover:bg-[#F5F8FB] hover:text-[#0E7C7B]">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#5F6F86]"><Loader2 className="h-4 w-4 animate-spin" /> Loading requests…</div>
      ) : loadError ? (
        <div className="flex items-start gap-2 px-5 py-6 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{loadError} If this is the first run, make sure <code>supabase/migration_2026_11_club_feature_requests.sql</code> has been run in Supabase.</span>
        </div>
      ) : shown.length === 0 ? (
        <div className="py-10 text-center text-sm text-[#5F6F86]">No {filter === 'all' ? '' : STATUS_META[filter].label.toLowerCase() + ' '}feature requests.</div>
      ) : (
        <ul>
          {shown.map((r) => (
            <Row key={r.id} r={r} onChanged={(next, msg, warn) => { setItems((l) => l.map((x) => (x.id === next.id ? next : x))); (warn ? toastError : success)(msg); }} />
          ))}
        </ul>
      )}
      <Toast toasts={toasts} onRemove={remove} />
    </div>
  );
}
