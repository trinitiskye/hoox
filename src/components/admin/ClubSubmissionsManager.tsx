'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users, Loader2, AlertCircle, ChevronDown, ChevronUp, ExternalLink, Mail, Phone, RefreshCw } from 'lucide-react';
import { Toast, useToast } from '@/components/ui/Toast';
import type { DbClubSubmission, SubmissionStatus } from '@/lib/clubSubmission';

/* ------------------------------------------------------------------ */
/* Admin → Clubs → Club Submissions                                    */
/* Review queue for requests sent from /clubs/submit. All calls go to  */
/* /api/admin/club-submissions/**, which re-check the admin session.   */
/* ------------------------------------------------------------------ */

const STATUS_META: Record<SubmissionStatus, { label: string; cls: string }> = {
  new: { label: 'New', cls: 'bg-[#E3F4F4] text-[#0B6564]' },
  in_review: { label: 'In review', cls: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approved', cls: 'bg-green-100 text-green-700' },
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

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  if (children === null || children === undefined || children === '') return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-[#8A9AB0]">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-sm text-[#2E3F5C]">{children}</dd>
    </div>
  );
}

function Row({ s, onChanged }: { s: DbClubSubmission; onChanged: (s: DbClubSubmission, msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(s.admin_notes || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async (updates: { status?: SubmissionStatus; adminNotes?: string }, msg: string) => {
    setSaving(true); setErr(null);
    try {
      const { submission } = await api<{ submission: DbClubSubmission }>(`/api/admin/club-submissions/${s.id}`, {
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
  const contact = s.contact_email || s.submitter_email;

  return (
    <li className="border-b border-[#EEF3F8] last:border-0">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-[#F5F8FB]">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-[#EEF3F8]">
          {s.logo_url ? <img src={s.logo_url} alt="" className="h-full w-full object-contain p-0.5" />
            : s.cover_image_url ? <img src={s.cover_image_url} alt="" className="h-full w-full object-cover" />
            : <Users className="h-5 w-5 text-[#8A9AB0]" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-[#0D1B4C]">{s.club_name}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${meta.cls}`}>{meta.label}</span>
            {s.styles.map((st) => <span key={st} className="rounded-full bg-[#F0F4F8] px-2 py-0.5 text-xs text-[#4A5B76]">{st}</span>)}
          </div>
          <div className="mt-0.5 text-xs text-[#5F6F86]">
            {s.city}, {s.state} · by {s.submitter_name} ({ROLE_LABEL[s.submitter_role] || s.submitter_role}) · received {fmtDate(s.created_at)}
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-[#8A9AB0]" /> : <ChevronDown className="h-4 w-4 text-[#8A9AB0]" />}
      </button>

      {open && (
        <div className="grid grid-cols-1 gap-6 bg-[#FAFCFD] px-5 pb-6 pt-2 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="space-y-5">
            {s.cover_image_url && (
              <a href={s.cover_image_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md border border-[#E8EEF4]">
                <img src={s.cover_image_url} alt="" className="aspect-video w-full object-cover" />
              </a>
            )}
            <Detail label="About">{s.about}</Detail>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Detail label="Location">{`${s.city}, ${s.state}, ${s.country}`}</Detail>
              <Detail label="Species">{s.species}</Detail>
              <Detail label="Skill level">{s.skill_level}</Detail>
              <Detail label="Schedule">{s.schedule}</Detail>
              <Detail label="Members">{s.member_count?.toLocaleString()}</Detail>
              <Detail label="Membership">{s.membership === 'paid' ? `Paid${s.dues ? ` (${s.dues})` : ''}` : s.membership === 'free' ? 'Free' : ''}</Detail>
              <Detail label="Social">{s.social_links}</Detail>
              {s.logo_url && (
                <Detail label="Logo">
                  <a href={s.logo_url} target="_blank" rel="noopener noreferrer"><img src={s.logo_url} alt="" className="h-16 w-auto rounded border border-[#E8EEF4] bg-white p-1" /></a>
                </Detail>
              )}
            </dl>
          </div>

          <div className="space-y-5">
            <div className="rounded-md border border-[#E8EEF4] bg-white p-4">
              <div className="font-medium text-[#0D1B4C]">{s.submitter_name}</div>
              <div className="text-sm text-[#5F6F86]">{ROLE_LABEL[s.submitter_role] || s.submitter_role} account{s.club_role ? ` · ${s.club_role}` : ''}</div>
              <div className="mt-3 space-y-1.5 text-sm">
                <a href={`mailto:${contact}?subject=${encodeURIComponent(`Your HOOX club listing: ${s.club_name}`)}`} className="flex items-center gap-2 text-[#0E7C7B] hover:underline">
                  <Mail className="h-3.5 w-3.5" /> {contact}
                </a>
                {contact !== s.submitter_email && <div className="pl-5 text-xs text-[#8A9AB0]">Account: {s.submitter_email}</div>}
                {s.contact_phone && <a href={`tel:${s.contact_phone}`} className="flex items-center gap-2 text-[#2E3F5C]"><Phone className="h-3.5 w-3.5" /> {s.contact_phone}</a>}
                {s.website && (
                  <a href={s.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#0E7C7B] hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> {s.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>

            <div>
              <label htmlFor={`cnotes-${s.id}`} className="block text-xs font-semibold uppercase text-[#8A9AB0]">Internal notes</label>
              <textarea id={`cnotes-${s.id}`} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                className="mt-1 w-full rounded-lg border border-[#D3DEE8] px-3 py-2 text-sm focus:ring-2 focus:ring-[#22B3B5]" placeholder="Verified with club president…" />
              <button type="button" disabled={saving || notes === (s.admin_notes || '')} onClick={() => save({ adminNotes: notes }, 'Notes saved')}
                className="mt-2 rounded-lg border border-[#D3DEE8] px-3 py-1.5 text-sm font-medium text-[#2E3F5C] hover:bg-[#F5F8FB] disabled:opacity-50">
                Save notes
              </button>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-[#EEF3F8] pt-4">
              {(['in_review', 'approved', 'declined', 'new'] as SubmissionStatus[]).filter((st) => st !== s.status).map((st) => (
                <button key={st} type="button" disabled={saving} onClick={() => save({ status: st }, `Marked ${STATUS_META[st].label.toLowerCase()}`)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                    st === 'approved' ? 'bg-[#0E7C7B] text-white hover:bg-[#0B6564]'
                      : st === 'declined' ? 'border border-red-200 text-red-600 hover:bg-red-50'
                      : 'border border-[#D3DEE8] text-[#2E3F5C] hover:bg-[#F5F8FB]'}`}>
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

export default function ClubSubmissionsManager() {
  const [items, setItems] = useState<DbClubSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SubmissionStatus | 'all'>('new');
  const { toasts, remove, success } = useToast();

  const load = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const { submissions } = await api<{ submissions: DbClubSubmission[] }>('/api/admin/club-submissions');
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
          <span className="font-semibold text-[#0D1B4C]">Club Submissions</span>
          <span className="ml-2 text-xs text-[#5F6F86]">Requests from the “Submit a Club” form</span>
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
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#5F6F86]"><Loader2 className="h-4 w-4 animate-spin" /> Loading submissions…</div>
      ) : loadError ? (
        <div className="flex items-start gap-2 px-5 py-6 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{loadError} If this is the first run, make sure <code>supabase/migration_2026_11_club_submissions.sql</code> has been run in Supabase.</span>
        </div>
      ) : shown.length === 0 ? (
        <div className="py-10 text-center text-sm text-[#5F6F86]">No {filter === 'all' ? '' : STATUS_META[filter].label.toLowerCase() + ' '}club submissions.</div>
      ) : (
        <ul>
          {shown.map((s) => (
            <Row key={s.id} s={s} onChanged={(next, msg) => { setItems((l) => l.map((x) => (x.id === next.id ? next : x))); success(msg); }} />
          ))}
        </ul>
      )}
      <Toast toasts={toasts} onRemove={remove} />
    </div>
  );
}
