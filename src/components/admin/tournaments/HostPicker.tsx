'use client';

/* "Hosted by" on the tournament form: the director's profile, a HOOX club,  */
/* a new club added on the spot, or a host typed in by hand.                */

import { useEffect, useState } from 'react';
import { Loader2, Plus, Check, AlertCircle } from 'lucide-react';
import { STATE_NAMES } from '@/components/listing/ListingUI';
import { CLUB_STYLES, CLUB_ABOUT_MAX } from '@/lib/clubSubmission';
import type { TournamentDetails } from '@/lib/tournamentDetails';
import type { HostClub } from '@/app/api/tournaments/host-clubs/route';
import { INPUT, LABEL, BTN, BTN_GHOST } from '@/components/admin/sponsors/shared';
import ImageUpload from './ImageUpload';

type Host = TournamentDetails['host'];
type Mode = 'profile' | 'club' | 'new' | 'custom';
const EMPTY: Host = { name: '', email: '', phone: '', website: '', clubId: '', logo: '' };

const modeOf = (h: Host): Mode => (h.clubId ? 'club' : h.name || h.email || h.phone || h.website ? 'custom' : 'profile');

export default function HostPicker({ host, onChange, isAdmin, forUser, defaultCity, defaultState, water }: {
  host: Host; onChange: (h: Host) => void; isAdmin: boolean; forUser: string;
  defaultCity: string; defaultState: string; water: string;
}) {
  const [clubs, setClubs] = useState<HostClub[] | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [mode, setMode] = useState<Mode>(modeOf(host));
  const blankNew = () => ({ name: '', city: defaultCity, state: defaultState, styles: water === 'saltwater' ? ['Saltwater'] : ['Freshwater'], about: '', website: '', email: '', phone: '', logo: '', authorized: false });
  const [nc, setNc] = useState(blankNew);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/tournaments/host-clubs', { cache: 'no-store' }).then((r) => r.json())
      .then((j) => { setClubs(j.clubs || []); if (j.error) setLoadErr(j.error); })
      .catch(() => { setClubs([]); setLoadErr('Couldn’t load clubs.'); });
  }, []);
  // A tournament loaded after mount
  useEffect(() => { setMode((m) => (m === 'new' ? m : modeOf(host))); }, [host.clubId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickClub = (c: HostClub) => onChange({ name: c.name, website: c.website, logo: c.logo, clubId: c.id, email: c.email || (host.clubId === c.id ? host.email : ''), phone: c.phone || (host.clubId === c.id ? host.phone : '') });

  const select = (v: string) => {
    setNote(null);
    if (v === '__profile') { setMode('profile'); onChange(EMPTY); }
    else if (v === '__custom') { setMode('custom'); onChange({ ...host, clubId: '', logo: '' }); }
    else if (v === '__new') { setMode('new'); setNc(blankNew()); }
    else { const c = clubs?.find((x) => x.id === v); if (c) { setMode('club'); pickClub(c); } }
  };

  async function addClub() {
    setNote(null);
    if (!nc.name.trim() || !nc.city.trim() || !nc.state) { setNote({ ok: false, text: 'Club name, city and state are required.' }); return; }
    if (!nc.styles.length) { setNote({ ok: false, text: 'Choose at least one fishing style.' }); return; }
    if (!nc.about.trim()) { setNote({ ok: false, text: 'Add a sentence or two about the club.' }); return; }
    if (!isAdmin && !nc.authorized) { setNote({ ok: false, text: 'Please confirm you’re authorized to list this club.' }); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/tournaments/host-clubs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubName: nc.name, city: nc.city, state: nc.state, styles: nc.styles, about: nc.about, website: nc.website, contactEmail: nc.email, contactPhone: nc.phone, logoUrl: nc.logo, agreedAuthorized: nc.authorized, forUser }),
      });
      const j = await r.json();
      if (!r.ok || !j.club) { setNote({ ok: false, text: j.error || 'Couldn’t add the club.' }); return; }
      const c = j.club as HostClub;
      setClubs((xs) => [c, ...(xs || [])]);
      setMode('club'); pickClub(c);
      setNote({ ok: true, text: c.status === 'approved' ? `${c.name} added to the Clubs directory and set as the host.` : `${c.name} is set as the host. It appears in the Clubs directory once HOOX approves it.` });
    } catch { setNote({ ok: false, text: 'Couldn’t add the club. Check your connection.' }); }
    finally { setSaving(false); }
  }

  const value = mode === 'profile' ? '__profile' : mode === 'custom' ? '__custom' : mode === 'new' ? '__new' : host.clubId;
  const mine = (clubs || []).filter((c) => c.mine);
  const others = (clubs || []).filter((c) => !c.mine);
  const label = (c: HostClub) => `${c.name}${c.city ? ` · ${c.city}, ${c.state}` : ''}${c.status !== 'approved' ? ' (in review)' : ''}`;
  const chosen = clubs?.find((c) => c.id === host.clubId);
  const upHost = (patch: Partial<Host>) => onChange({ ...host, ...patch });

  return (
    <div>
      <label className="block max-w-[560px]"><span className={LABEL}>Hosted by</span>
        <select className={INPUT} value={value} onChange={(e) => select(e.target.value)} aria-label="Hosted by">
          <option value="__profile">Tournament director’s public profile</option>
          {clubs === null && <option disabled>Loading clubs…</option>}
          {host.clubId && !chosen && <option value={host.clubId}>{host.name}</option>}
          {mine.length > 0 && <optgroup label="Your clubs">{mine.map((c) => <option key={c.id} value={c.id}>{label(c)}</option>)}</optgroup>}
          {others.length > 0 && <optgroup label="Clubs on HOOX">{others.map((c) => <option key={c.id} value={c.id}>{label(c)}</option>)}</optgroup>}
          <option value="__new">+ Add a new club…</option>
          <option value="__custom">Other host (type it in)</option>
        </select>
      </label>
      {loadErr && <p className="mt-1.5 text-xs text-red-600">{loadErr}</p>}
      {mode === 'profile' && <p className="mt-1.5 text-xs text-[#6B7D93]">Shows the director’s organization, email, phone and website from their profile.</p>}

      {mode === 'new' && (
        <div className="mt-4 rounded-lg border border-[#E3EAF1] bg-[#FAFCFD] p-4">
          <p className="mb-3 text-sm font-semibold text-[#0D1B4C]">New club</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <label className="md:col-span-2"><span className={LABEL}>Club name *</span><input className={INPUT} value={nc.name} onChange={(e) => setNc({ ...nc, name: e.target.value })} placeholder="e.g. NorCal Bass Club" /></label>
            <label><span className={LABEL}>City *</span><input className={INPUT} value={nc.city} onChange={(e) => setNc({ ...nc, city: e.target.value })} /></label>
            <label><span className={LABEL}>State *</span>
              <select className={INPUT} value={nc.state} onChange={(e) => setNc({ ...nc, state: e.target.value })}>
                <option value="">Choose…</option>
                {Object.entries(STATE_NAMES).sort((a, b) => a[1].localeCompare(b[1])).map(([c, n]) => <option key={c} value={c}>{n}</option>)}
              </select>
            </label>
            <div className="md:col-span-4"><span className={LABEL}>Fishing styles *</span>
              <div className="flex flex-wrap gap-1.5">
                {CLUB_STYLES.map((s) => {
                  const on = nc.styles.includes(s);
                  return <button key={s} type="button" aria-pressed={on} onClick={() => setNc({ ...nc, styles: on ? nc.styles.filter((x) => x !== s) : [...nc.styles, s] })}
                    className={`rounded-full border px-3 py-1 text-[13px] font-medium transition ${on ? 'border-[#0E7C7B] bg-[#0E7C7B] text-white' : 'border-[#D3DEE8] bg-white text-[#2E3F5C] hover:bg-[#F5F8FB]'}`}>{s}</button>;
                })}
              </div>
            </div>
            <label className="md:col-span-4"><span className={LABEL}>About the club *</span>
              <textarea rows={2} maxLength={CLUB_ABOUT_MAX} className={`${INPUT} h-auto py-2`} value={nc.about} onChange={(e) => setNc({ ...nc, about: e.target.value })} placeholder="A sentence or two for the Clubs directory" />
            </label>
            <label className="md:col-span-2"><span className={LABEL}>Website</span><input className={INPUT} value={nc.website} onChange={(e) => setNc({ ...nc, website: e.target.value })} placeholder="norcalbass.org" /></label>
            <label><span className={LABEL}>Contact email</span><input type="email" className={INPUT} value={nc.email} onChange={(e) => setNc({ ...nc, email: e.target.value })} /></label>
            <label><span className={LABEL}>Contact phone</span><input type="tel" className={INPUT} value={nc.phone} onChange={(e) => setNc({ ...nc, phone: e.target.value })} /></label>
            <div className="md:col-span-2"><ImageUpload kind="club-logo" value={nc.logo} onChange={(url) => setNc({ ...nc, logo: url })} uploadOnly /></div>
          </div>
          {!isAdmin && (
            <label className="mt-3 flex items-start gap-2 text-sm text-[#2E3F5C]">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#0E7C7B]" checked={nc.authorized} onChange={(e) => setNc({ ...nc, authorized: e.target.checked })} />
              I’m authorized to list this club on HOOX.
            </label>
          )}
          <p className="mt-2 text-xs text-[#6B7D93]">{isAdmin ? 'The club is added to the Clubs directory right away.' : 'HOOX reviews new clubs before they appear in the Clubs directory. It can host this tournament right away.'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={addClub} disabled={saving} className={BTN}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Add club</button>
            <button type="button" onClick={() => { setMode(modeOf(host)); setNote(null); }} className={BTN_GHOST}>Cancel</button>
          </div>
        </div>
      )}

      {(mode === 'club' || mode === 'custom') && (
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {mode === 'custom'
            ? <input aria-label="Host name" className={INPUT} value={host.name} onChange={(e) => upHost({ name: e.target.value })} placeholder="Club or organization name" />
            : (
              <div className="flex h-[40px] items-center gap-2 rounded-lg border border-[#E3EAF1] bg-[#F5F8FB] px-3 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {host.logo && <img src={host.logo} alt="" className="h-6 w-6 rounded object-contain" />}
                <span className="truncate font-semibold text-[#0D1B4C]">{host.name}</span>
                {chosen && chosen.status !== 'approved' && <span className="ml-auto flex-shrink-0 text-xs text-[#C4560E]">In review</span>}
              </div>
            )}
          <input aria-label="Host website" className={INPUT} value={host.website} onChange={(e) => upHost({ website: e.target.value })} placeholder="Website" />
          <input aria-label="Host email" type="email" className={INPUT} value={host.email} onChange={(e) => upHost({ email: e.target.value })} placeholder="Contact email" />
          <input aria-label="Host phone" type="tel" className={INPUT} value={host.phone} onChange={(e) => upHost({ phone: e.target.value })} placeholder="Contact phone" />
          {mode === 'club' && <p className="text-xs text-[#6B7D93] md:col-span-2">Filled in from the club’s listing. Change the contact details here for this tournament only.</p>}
        </div>
      )}

      {note && <p className={`mt-2 flex items-start gap-1.5 text-sm ${note.ok ? 'text-green-700' : 'text-red-600'}`}>{note.ok ? <Check className="mt-0.5 h-4 w-4 flex-shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />}{note.text}</p>}
    </div>
  );
}
