'use client';

/* Judges on the tournament form: pick existing HOOX judges or invite a new  */
/* one by email. Changes are saved with the tournament (see syncJudges).     */

import { useEffect, useState } from 'react';
import { Plus, Trash2, Copy, Check, Scale, Mail } from 'lucide-react';
import { INPUT, LABEL, BTN_GHOST } from '@/components/admin/sponsors/shared';

export interface JudgeRow {
  key: string;
  id?: string;            // tournament_judges row (saved)
  userId?: string | null;
  name: string;
  email: string;
  status: 'assigned' | 'invited';
  inviteLink?: string | null;
}
interface JudgeAccount { id: string; name: string; email: string; place: string }

const k = () => Math.random().toString(36).slice(2);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Load a saved tournament's judges */
export async function loadJudges(tid: string): Promise<JudgeRow[]> {
  const j = await fetch(`/api/tournaments/${encodeURIComponent(tid)}/judges`, { cache: 'no-store' }).then((r) => r.json()).catch(() => ({}));
  return (j.judges || []).map((x: JudgeRow) => ({ ...x, key: x.id || k() }));
}

/** Save judge changes after the tournament is saved. Returns notes for the status line. */
export async function syncJudges(tid: string, rows: JudgeRow[], removed: string[]): Promise<{ notes: string[]; rows: JudgeRow[] }> {
  const notes: string[] = [];
  const base = `/api/tournaments/${encodeURIComponent(tid)}/judges`;
  for (const id of removed) await fetch(`${base}?judge=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
  let invited = 0, emailed = 0;
  for (const r of rows.filter((x) => !x.id)) {
    const res = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r.userId ? { userId: r.userId } : { email: r.email, name: r.name }) });
    const j = await res.json().catch(() => ({}));
    if (j.error) notes.push(`Judge ${r.name || r.email}: ${j.error}`);
    else { if (j.invited) invited++; if (j.emailed) emailed++; }
  }
  if (emailed) notes.push(`${emailed === 1 ? 'Judge emailed' : `${emailed} judges emailed`}.`);
  else if (invited) notes.push(`${invited === 1 ? 'Judge invite' : `${invited} judge invites`} saved, but email isn’t set up yet: copy the invite link under Judging to send it.`);
  return { notes, rows: await loadJudges(tid) };
}

export default function JudgesPanel({ rows, onChange, onRemoveSaved, isAdmin }: {
  rows: JudgeRow[]; onChange: (rows: JudgeRow[]) => void; onRemoveSaved: (id: string) => void; isAdmin: boolean;
}) {
  const [accounts, setAccounts] = useState<JudgeAccount[] | null>(null);
  const [pick, setPick] = useState('');
  const [inv, setInv] = useState({ name: '', email: '' });
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetch('/api/tournaments/judges', { cache: 'no-store' }).then((r) => r.json()).then((j) => setAccounts(j.judges || [])).catch(() => setAccounts([]));
  }, []);

  const taken = new Set(rows.map((r) => r.userId).filter(Boolean));
  const takenEmail = new Set(rows.map((r) => r.email.toLowerCase()));
  const available = (accounts || []).filter((a) => !taken.has(a.id));

  const choose = (v: string) => {
    setErr('');
    if (v === '__invite' || v === '') { setPick(v); return; }
    const a = accounts?.find((x) => x.id === v);
    if (a) onChange([...rows, { key: k(), userId: a.id, name: a.name, email: a.email, status: 'assigned' }]);
    setPick('');
  };

  const invite = () => {
    setErr('');
    const email = inv.email.trim().toLowerCase();
    if (!inv.name.trim()) { setErr('Enter the judge’s name.'); return; }
    if (!EMAIL_RE.test(email)) { setErr('Enter a valid email.'); return; }
    if (takenEmail.has(email)) { setErr('That judge is already on this tournament.'); return; }
    // Already a HOOX judge? Use their account instead of an invite
    const match = isAdmin ? accounts?.find((a) => a.email.toLowerCase() === email) : undefined;
    onChange([...rows, match ? { key: k(), userId: match.id, name: match.name, email: match.email, status: 'assigned' } : { key: k(), name: inv.name.trim(), email, status: 'invited' }]);
    setInv({ name: '', email: '' }); setPick('');
  };

  const remove = (r: JudgeRow) => { if (r.id) onRemoveSaved(r.id); onChange(rows.filter((x) => x.key !== r.key)); };
  const copy = async (r: JudgeRow) => {
    if (!r.inviteLink) return;
    try { await navigator.clipboard.writeText(r.inviteLink); setCopied(r.key); setTimeout(() => setCopied(''), 2000); } catch { window.prompt('Copy the invite link:', r.inviteLink); }
  };

  return (
    <div>
      <span className={LABEL}>Judges</span>
      <p className="-mt-0.5 mb-3 text-xs text-[#6B7D93]">Judges review and approve catch submissions for this tournament.</p>
      {rows.length > 0 && (
        <ul className="mb-3 divide-y divide-[#EEF3F8] rounded-lg border border-[#E3EAF1]">
          {rows.map((r) => (
            <li key={r.key} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#EEF7F7] text-[#0E7C7B]">{r.status === 'invited' ? <Mail className="h-4 w-4" /> : <Scale className="h-4 w-4" />}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-[#0D1B4C]">{r.name}</span>
                <span className="block truncate text-xs text-[#6B7D93]">{r.email}</span>
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.status === 'invited' ? 'bg-[#FFF4E5] text-[#B4570B]' : 'bg-[#E8F6EE] text-[#1E7A46]'}`}>
                {!r.id ? 'Added when you save' : r.status === 'invited' ? 'Invite pending' : 'Assigned'}
              </span>
              {r.inviteLink && (
                <button type="button" onClick={() => copy(r)} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0E7C7B] hover:underline">
                  {copied === r.key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied === r.key ? 'Copied' : 'Copy invite link'}
                </button>
              )}
              <button type="button" aria-label={`Remove judge ${r.name}`} onClick={() => remove(r)} className="rounded p-1.5 text-[#8A9AB0] hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
      <label className="block max-w-[480px]">
        <span className="sr-only">Add a judge</span>
        <select aria-label="Add a judge" className={INPUT} value={pick} onChange={(e) => choose(e.target.value)}>
          <option value="">{accounts === null ? 'Loading judges…' : rows.length ? 'Add another judge…' : 'Add a judge…'}</option>
          {available.length > 0 && <optgroup label="Judges on HOOX">{available.map((a) => <option key={a.id} value={a.id}>{a.name}{a.place ? ` · ${a.place}` : ''}</option>)}</optgroup>}
          <option value="__invite">+ Invite a new judge by email…</option>
        </select>
      </label>
      {pick === '__invite' && (
        <div className="mt-3 rounded-lg border border-[#E3EAF1] bg-[#FAFCFD] p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
            <label><span className={LABEL}>Judge’s name *</span><input className={INPUT} value={inv.name} onChange={(e) => setInv({ ...inv, name: e.target.value })} /></label>
            <label><span className={LABEL}>Email *</span><input type="email" className={INPUT} value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} placeholder="judge@example.com" /></label>
            <div className="flex gap-2">
              <button type="button" onClick={invite} className={BTN_GHOST}><Plus className="h-4 w-4" />Add</button>
              <button type="button" onClick={() => { setPick(''); setErr(''); }} className={BTN_GHOST}>Cancel</button>
            </div>
          </div>
          <p className="mt-2 text-xs text-[#6B7D93]">We’ll email them an invite to create a HOOX judge account with this address. Once they sign up, they’re assigned to this tournament automatically.</p>
        </div>
      )}
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </div>
  );
}
