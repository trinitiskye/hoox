'use client';

import { useCallback, useEffect, useState } from 'react';
import { Inbox, Loader2, AlertCircle, ChevronDown, ChevronUp, ExternalLink, Mail, Phone, RefreshCw } from 'lucide-react';
import { Toast, useToast } from '@/components/ui/Toast';
import { PROMO_PACKAGES, type DbEventSubmission, type SubmissionStatus } from '@/lib/eventSubmission';

/* ------------------------------------------------------------------ */
/* Admin → Events → Event Submissions                                  */
/* Review queue for requests sent from /events/submit. All calls go to */
/* /api/admin/event-submissions/**, which re-check the admin session.  */
/* ------------------------------------------------------------------ */

const STATUS_META: Record<SubmissionStatus, { label: string; cls: string }> = {
  new: { label: 'New', cls: 'bg-[#E3F4F4] text-[#0B6564]' },
  in_review: { label: 'In review', cls: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approved', cls: 'bg-green-100 text-green-700' },
  declined: { label: 'Declined', cls: 'bg-gray-100 text-gray-600' },
};
const FILTERS: (SubmissionStatus | 'all')[] = ['all', 'new', 'in_review', 'approved', 'declined'];
const PACKAGE_LABEL = Object.fromEntries(PROMO_PACKAGES.map((p) => [p.id, p.label])) as Record<string, string>;

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

const fmtDate = (d: string | null) =>
  d ? new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  if (children === null || children === undefined || children === '') return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-[#8A9AB0]">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-sm text-[#2E3F5C]">{children}</dd>
    </div>
  );
}

function SubmissionRow({ s, onChanged }: { s: DbEventSubmission; onChanged: (s: DbEventSubmission, msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(s.admin_notes || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async (updates: { status?: SubmissionStatus; adminNotes?: string }, msg: string) => {
    setSaving(true); setErr(null);
    try {
      const { submission } = await api<{ submission: DbEventSubmission }>(`/api/admin/event-submissions/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      onChanged(submission, msg);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const meta = STATUS_META[s.status];
  const dates = s.start_date === s.end_date ? fmtDate(s.start_date) : `${fmtDate(s.start_date)} – ${fmtDate(s.end_date)}`;

  return (
    <li className="border-b border-[#EEF3F8] last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-[#F5F8FB]"
      >
        <div className="flex h-12 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-[#EEF3F8]">
          {s.hero_image_url ? <img src={s.hero_image_url} alt="" className="h-full w-full object-cover" />
            : s.logo_url ? <img src={s.logo_url} alt="" className="h-full w-full object-contain p-1" />
            : <Inbox className="h-5 w-5 text-[#8A9AB0]" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-[#0D1B4C]">{s.event_name}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${meta.cls}`}>{meta.label}</span>
            <span className="rounded-full bg-[#F0F4F8] px-2 py-0.5 text-xs text-[#4A5B76]">{s.event_type}</span>
          </div>
          <div className="mt-0.5 text-xs text-[#5F6F86]">
            {dates} · {s.city}, {s.state} · {s.organization} · received {fmtDate(s.created_at)}
          </div>
        </div>
        <div className="hidden max-w-[260px] flex-wrap justify-end gap-1 md:flex">
          {s.packages.map((p) => (
            <span key={p} className="rounded bg-[#FFF4E5] px-1.5 py-0.5 text-[11px] text-[#9A5B00]">{PACKAGE_LABEL[p] || p}</span>
          ))}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-[#8A9AB0]" /> : <ChevronDown className="h-4 w-4 text-[#8A9AB0]" />}
      </button>

      {open && (
        <div className="grid grid-cols-1 gap-6 bg-[#FAFCFD] px-5 pb-6 pt-2 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="space-y-5">
            {s.hero_image_url && (
              <a href={s.hero_image_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md border border-[#E8EEF4]">
                <img src={s.hero_image_url} alt={s.hero_alt_text || ''} className="aspect-video w-full object-cover" />
              </a>
            )}
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Detail label="Short description">{s.short_description}</Detail>
              <Detail label="Venue">{[s.venue_name, s.address, `${s.city}, ${s.state} ${s.zip || ''}`.trim(), s.country].filter(Boolean).join('\n')}</Detail>
              <Detail label="Hours">{s.daily_hours}</Detail>
              <Detail label="Tickets">{[s.ticket_price, s.ticket_url].filter(Boolean).join('\n')}</Detail>
              <Detail label="Attendance">{s.expected_attendance?.toLocaleString()}</Detail>
              <Detail label="Exhibitors">{s.exhibitor_count?.toLocaleString()}</Detail>
              <Detail label="Fishing focus">{s.fishing_focus.join(', ')}</Detail>
              <Detail label="Social">{s.social_links}</Detail>
              <Detail label="Hero alt text">{s.hero_alt_text}</Detail>
              {s.logo_url && (
                <Detail label="Logo">
                  <a href={s.logo_url} target="_blank" rel="noopener noreferrer"><img src={s.logo_url} alt="" className="h-16 w-auto rounded border border-[#E8EEF4] bg-white p-1" /></a>
                </Detail>
              )}
            </dl>
            <Detail label="Full description">{s.long_description}</Detail>
          </div>

          <div className="space-y-5">
            <div className="rounded-md border border-[#E8EEF4] bg-white p-4">
              <div className="font-medium text-[#0D1B4C]">{s.contact_name}{s.contact_title ? `, ${s.contact_title}` : ''}</div>
              <div className="text-sm text-[#5F6F86]">{s.organization}</div>
              <div className="mt-3 space-y-1.5 text-sm">
                <a href={`mailto:${s.contact_email}?subject=${encodeURIComponent(`Your HOOX event submission: ${s.event_name}`)}`} className="flex items-center gap-2 text-[#0E7C7B] hover:underline">
                  <Mail className="h-3.5 w-3.5" /> {s.contact_email}
                </a>
                {s.contact_phone && <a href={`tel:${s.contact_phone}`} className="flex items-center gap-2 text-[#2E3F5C]"><Phone className="h-3.5 w-3.5" /> {s.contact_phone}</a>}
                {s.organization_website && (
                  <a href={s.organization_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#0E7C7B] hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> {s.organization_website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Detail label="Requested">{s.packages.map((p) => PACKAGE_LABEL[p] || p).join('\n')}</Detail>
              <Detail label="Preferred run">{s.preferred_start || s.preferred_end ? `${fmtDate(s.preferred_start) || '—'} – ${fmtDate(s.preferred_end) || '—'}` : ''}</Detail>
              <Detail label="Billing">{[s.billing_name, s.billing_email].filter(Boolean).join('\n')}</Detail>
              <Detail label="Promo code">{s.promo_code}</Detail>
              <Detail label="Marketing opt-in">{s.marketing_opt_in ? 'Yes' : 'No'}</Detail>
            </dl>
            <Detail label="Organizer notes">{s.notes}</Detail>

            <div>
              <label htmlFor={`notes-${s.id}`} className="block text-xs font-semibold uppercase text-[#8A9AB0]">Internal notes</label>
              <textarea
                id={`notes-${s.id}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-[#D3DEE8] px-3 py-2 text-sm focus:ring-2 focus:ring-[#22B3B5]"
                placeholder="Quote sent, invoice #, placement dates…"
              />
              <button
                type="button"
                disabled={saving || notes === (s.admin_notes || '')}
                onClick={() => save({ adminNotes: notes }, 'Notes saved')}
                className="mt-2 rounded-lg border border-[#D3DEE8] px-3 py-1.5 text-sm font-medium text-[#2E3F5C] hover:bg-[#F5F8FB] disabled:opacity-50"
              >
                Save notes
              </button>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-[#EEF3F8] pt-4">
              {(['in_review', 'approved', 'declined', 'new'] as SubmissionStatus[])
                .filter((st) => st !== s.status)
                .map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={saving}
                    onClick={() => save({ status: st }, `Marked ${STATUS_META[st].label.toLowerCase()}`)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                      st === 'approved' ? 'bg-[#0E7C7B] text-white hover:bg-[#0B6564]'
                        : st === 'declined' ? 'border border-red-200 text-red-600 hover:bg-red-50'
                        : 'border border-[#D3DEE8] text-[#2E3F5C] hover:bg-[#F5F8FB]'
                    }`}
                  >
                    {st === 'new' ? 'Reset to new' : st === 'in_review' ? 'Mark in review' : st === 'approved' ? 'Approve' : 'Decline'}
                  </button>
                ))}
              {saving && <Loader2 className="h-4 w-4 animate-spin self-center text-[#8A9AB0]" />}
            </div>
            {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
          </div>
        </div>
      )}
    </li>
  );
}

export default function EventSubmissionsManager() {
  const [items, setItems] = useState<DbEventSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SubmissionStatus | 'all'>('new');
  const { toasts, remove, success } = useToast();

  const load = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const { submissions } = await api<{ submissions: DbEventSubmission[] }>('/api/admin/event-submissions');
      setItems(submissions);
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
          <span className="font-semibold text-[#0D1B4C]">Event Submissions</span>
          <span className="ml-2 text-xs text-[#5F6F86]">Requests from the public “Submit your Event” form</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter === f ? 'bg-[#0E7C7B] text-white' : 'bg-[#F0F4F8] text-[#4A5B76] hover:bg-[#E3EAF1]'}`}
            >
              {f === 'all' ? `All (${items.length})` : `${STATUS_META[f].label} (${counts[f] || 0})`}
            </button>
          ))}
          <button type="button" onClick={load} aria-label="Refresh" className="ml-1 rounded-lg p-1.5 text-[#8A9AB0] hover:bg-[#F5F8FB] hover:text-[#0E7C7B]">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#5F6F86]"><Loader2 className="h-4 w-4 animate-spin" /> Loading submissions…</div>
      ) : loadError ? (
        <div className="flex items-start gap-2 px-5 py-6 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{loadError} If this is the first run, make sure <code>supabase/migration_2026_11_event_submissions.sql</code> has been run in Supabase.</span>
        </div>
      ) : shown.length === 0 ? (
        <div className="py-10 text-center text-sm text-[#5F6F86]">No {filter === 'all' ? '' : STATUS_META[filter].label.toLowerCase() + ' '}submissions.</div>
      ) : (
        <ul>
          {shown.map((s) => (
            <SubmissionRow
              key={s.id}
              s={s}
              onChanged={(next, msg) => { setItems((list) => list.map((x) => (x.id === next.id ? next : x))); success(msg); }}
            />
          ))}
        </ul>
      )}
      <Toast toasts={toasts} onRemove={remove} />
    </div>
  );
}
