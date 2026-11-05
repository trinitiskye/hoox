'use client';

/* ------------------------------------------------------------------ */
/* Admin → Event Management → Tournaments → Add / Edit a tournament    */
/* Saves through /api/tournaments (admins can manage any tournament    */
/* and choose which director it belongs to).                           */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader2, Plus, Trash2, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useSpeciesList } from '@/lib/useSpeciesList';
import { STATE_NAMES } from '@/components/listing/ListingUI';
import { VESSEL_TYPES } from '@/lib/vessels';
import { createTournament, updateTournament, deleteTournament, type TournamentInput } from '@/lib/tournamentApi';
import { formatFromRow, POT_RULES, POT_RULE_LABEL, type PotRule, type TournamentFormat } from '@/lib/tournamentFormat';
import { getTournamentById, type DbTournament } from '@/lib/supabase';
import { INPUT, LABEL, CARD, BTN, BTN_GHOST } from '@/components/admin/sponsors/shared';

const TIMEZONES = [
  ['America/Los_Angeles', 'Pacific'], ['America/Denver', 'Mountain'], ['America/Phoenix', 'Arizona'], ['America/Chicago', 'Central'],
  ['America/New_York', 'Eastern'], ['America/Anchorage', 'Alaska'], ['Pacific/Honolulu', 'Hawaii'],
] as const;

interface PotDraft { key: string; name: string; kind: 'pot' | 'award'; rule: PotRule; species: string; fee: string; payout: 'fixed' | 'share'; amount: string; description: string; splits: string }
interface Draft {
  name: string; createdBy: string; description: string; image: string; status: 'upcoming' | 'active' | 'completed';
  startDate: string; startTime: string; endDate: string; endTime: string; timezone: string;
  location: string; city: string; state: string;
  fishTypes: string[]; vesselTypes: string[];
  entryType: 'individual' | 'team'; teamMin: string; teamMax: string; feeBasis: 'per_entry' | 'per_angler';
  entryFee: string; maxParticipants: string;
  scoring: 'weight' | 'length' | 'both'; primaryMeasure: 'weight' | 'length'; fishLimit: string;
  places: { key: string; amount: string; description: string }[];
  pots: PotDraft[];
}

const k = () => Math.random().toString(36).slice(2);
const blank = (): Draft => ({
  name: '', createdBy: '', description: '', image: '', status: 'upcoming',
  startDate: '', startTime: '06:00', endDate: '', endTime: '15:00', timezone: 'America/Los_Angeles',
  location: '', city: '', state: '', fishTypes: [], vesselTypes: [],
  entryType: 'individual', teamMin: '2', teamMax: '2', feeBasis: 'per_entry', entryFee: '', maxParticipants: '',
  scoring: 'weight', primaryMeasure: 'weight', fishLimit: '',
  places: [{ key: k(), amount: '', description: '' }], pots: [],
});
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

function fromRow(t: DbTournament): Draft {
  const f: TournamentFormat = formatFromRow(t);
  return {
    name: t.name, createdBy: t.created_by, description: t.description || '', image: t.image || '', status: (t.status as Draft['status']) || 'upcoming',
    startDate: t.start_date, startTime: (t.start_time || '').slice(0, 5), endDate: t.end_date, endTime: (t.end_time || '').slice(0, 5), timezone: t.timezone || 'America/Los_Angeles',
    location: t.location || '', city: t.city || '', state: t.state || '',
    fishTypes: t.fish_types?.length ? t.fish_types : t.species ? [t.species] : [], vesselTypes: t.vessel_types || [],
    entryType: f.entryType, teamMin: String(f.teamMin), teamMax: String(f.teamMax), feeBasis: f.feeBasis,
    entryFee: str(t.entry_fee ?? t.registration_fee), maxParticipants: str(t.max_participants),
    scoring: f.scoring, primaryMeasure: f.primaryMeasure, fishLimit: str(f.fishLimit),
    places: f.placePrizes.length ? f.placePrizes.map((p) => ({ key: k(), amount: str(p.amount), description: p.description })) : [{ key: k(), amount: '', description: '' }],
    pots: f.sidePots.map((p) => ({ key: p.id, name: p.name, kind: p.kind, rule: p.rule, species: p.species || '', fee: str(p.fee || ''), payout: p.payout, amount: str(p.amount), description: p.description, splits: p.splits.join(', ') })),
  };
}

function toInput(d: Draft, isAdmin: boolean): TournamentInput & { createdBy?: string } {
  const num = (v: string) => (v.trim() === '' ? null : Number(v));
  return {
    ...(isAdmin && d.createdBy ? { createdBy: d.createdBy } : {}),
    name: d.name, description: d.description, image: d.image, status: d.status,
    startDate: d.startDate, startTime: d.startTime, endDate: d.endDate || d.startDate, endTime: d.endTime, timezone: d.timezone,
    location: d.location, city: d.city, state: d.state,
    fishTypes: d.fishTypes, species: d.fishTypes[0] || '', vesselTypes: d.vesselTypes as TournamentInput['vesselTypes'],
    entryType: d.entryType, teamMin: Number(d.teamMin) || 1, teamMax: Number(d.teamMax) || 1, feeBasis: d.feeBasis,
    entryFee: num(d.entryFee), maxParticipants: num(d.maxParticipants),
    scoring: d.scoring, primaryMeasure: d.scoring === 'both' ? d.primaryMeasure : d.scoring, fishLimit: num(d.fishLimit),
    placePrizes: d.places.filter((p) => p.amount.trim() || p.description.trim()).map((p, i) => ({ place: i + 1, amount: num(p.amount), description: p.description })),
    sidePots: d.pots.map((p) => ({
      id: p.key, name: p.name, kind: p.kind, rule: p.rule, species: p.species || null, fee: p.kind === 'pot' ? Number(p.fee) || 0 : 0,
      payout: p.kind === 'pot' ? p.payout : 'fixed', amount: num(p.amount), description: p.description,
      splits: p.splits.split(/[,\s/]+/).map(Number).filter((n) => n > 0),
    })),
  };
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className={CARD}>
      <h3 className="font-montserrat text-[17px] font-bold text-[#0D1B4C]">{title}</h3>
      {sub && <p className="mt-0.5 text-[13px] text-[#6B7D93]">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-lg border border-[#D3DEE8] bg-white p-1">
      {options.map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={`rounded-md px-3.5 py-1.5 text-sm font-semibold transition ${value === v ? 'bg-[#0E7C7B] text-white' : 'text-[#5F6F86] hover:text-[#2E3F5C]'}`}>{l}</button>
      ))}
    </div>
  );
}

export default function TournamentEditor({ id }: { id?: string }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const species = useSpeciesList();
  const [d, setD] = useState<Draft | null>(id ? null : blank());
  const [directors, setDirectors] = useState<{ id: string; name: string; organization?: string }[]>([]);
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getTournamentById(id).then(({ data, error }) => {
      if (error || !data?.[0]) setLoadErr('Tournament not found.');
      else setD(fromRow(data[0]));
    });
  }, [id]);
  useEffect(() => {
    if (!isAdmin) return;
    fetch('/api/admin/users', { cache: 'no-store' }).then((r) => r.json()).then((j) => {
      setDirectors((j.users || []).filter((u: { role: string }) => u.role === 'director').map((u: { id: string; name: string; organization?: string }) => ({ id: u.id, name: u.name, organization: u.organization })));
    }).catch(() => {});
  }, [isAdmin]);

  const set = (patch: Partial<Draft>) => { setD((x) => (x ? { ...x, ...patch } : x)); setMsg(null); };
  const speciesOptions = useMemo(() => [...new Set([...(species ?? []), ...(d?.fishTypes ?? [])])].sort(), [species, d?.fishTypes]);
  const measures = d ? (d.scoring === 'both' ? ['weight', 'length'] : [d.scoring]) : [];
  const ruleOk = (r: PotRule) => !((r === 'heaviest_fish' || r === 'species_heaviest') && !measures.includes('weight')) && !((r === 'longest_fish' || r === 'species_longest') && !measures.includes('length'));

  const save = async () => {
    if (!d) return;
    if (!d.name.trim()) { setMsg({ ok: false, text: 'Enter the tournament name.' }); return; }
    if (!d.startDate) { setMsg({ ok: false, text: 'Choose a start date.' }); return; }
    if (isAdmin && !id && !d.createdBy) { setMsg({ ok: false, text: 'Choose the tournament director.' }); return; }
    setBusy('save'); setMsg(null);
    const res = id ? await updateTournament(id, toInput(d, isAdmin)) : await createTournament(toInput(d, isAdmin));
    setBusy(null);
    if (res.error || !res.data) { setMsg({ ok: false, text: res.error || 'Couldn’t save.' }); return; }
    if (!id) { router.push(`/admin/tournaments/${encodeURIComponent(res.data.id)}/edit?created=1`); return; }
    setMsg({ ok: true, text: 'Tournament saved.' });
  };
  const remove = async () => {
    if (!id || !d || !window.confirm(`Delete “${d.name}”? Its registrations, teams and catches are deleted too. This can’t be undone.`)) return;
    setBusy('delete');
    const res = await deleteTournament(id);
    setBusy(null);
    if (res.error) { setMsg({ ok: false, text: res.error }); return; }
    router.push('/admin/tournaments');
  };
  useEffect(() => {
    if (id && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('created')) setMsg({ ok: true, text: 'Tournament created. Keep editing, or view it on the site.' });
  }, [id]);

  const title = id ? (d?.name || 'Edit tournament') : 'Add a Tournament';

  return (
    <div className="font-roboto mx-auto w-full max-w-[1100px] px-4 py-8 md:px-5">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-sm">
        <Link href="/admin" className="text-[#0E7C7B] hover:underline">Admin</Link>
        <ChevronRight className="h-3.5 w-3.5 text-[#B9C6D4]" aria-hidden />
        <span className="text-[#5F6F86]">Event Management</span>
        <ChevronRight className="h-3.5 w-3.5 text-[#B9C6D4]" aria-hidden />
        <Link href="/admin/tournaments" className="text-[#0E7C7B] hover:underline">Tournaments</Link>
        <ChevronRight className="h-3.5 w-3.5 text-[#B9C6D4]" aria-hidden />
        <span className="font-medium text-[#0D1B4C]" aria-current="page">{id ? 'Edit' : 'Add a Tournament'}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C]">{title}</h2>
          <p className="mt-0.5 text-sm text-[#5F6F86]">{id ? 'Update the details, entry format, judging and prizes.' : 'Set up the event, how anglers enter, how catches are judged, and what they can win.'}</p>
        </div>
        {id && <a href={`/tournaments/${encodeURIComponent(id)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-semibold text-[#0E7C7B] hover:underline">View on site <ExternalLink className="h-4 w-4" /></a>}
      </div>

      {loadErr ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadErr}</p> : !d ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#5F6F86]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-5" noValidate>
          <Section title="Basics">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="md:col-span-2"><span className={LABEL}>Tournament name *</span><input className={INPUT} value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Folsom Lake Bass Classic" /></label>
              {isAdmin && (
                <label><span className={LABEL}>Tournament director *</span>
                  <select className={INPUT} value={d.createdBy} onChange={(e) => set({ createdBy: e.target.value })}>
                    <option value="">Choose a director…</option>
                    {currentUser && <option value={currentUser.id}>HOOX (admin)</option>}
                    {directors.map((x) => <option key={x.id} value={x.id}>{x.name}{x.organization ? ` · ${x.organization}` : ''}</option>)}
                  </select>
                </label>
              )}
              <label><span className={LABEL}>Status</span>
                <select className={INPUT} value={d.status} onChange={(e) => set({ status: e.target.value as Draft['status'] })}>
                  <option value="upcoming">Upcoming</option><option value="active">In progress</option><option value="completed">Completed</option>
                </select>
              </label>
              <label className="md:col-span-2"><span className={LABEL}>Description</span><textarea rows={4} className={`${INPUT} h-auto py-2`} value={d.description} onChange={(e) => set({ description: e.target.value })} placeholder="What anglers should know: format, launch site, check-in, rules highlights…" /></label>
              <label className="md:col-span-2"><span className={LABEL}>Image URL</span><input className={INPUT} value={d.image} onChange={(e) => set({ image: e.target.value })} placeholder="https://…" /></label>
            </div>
          </Section>

          <Section title="When & where">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <label><span className={LABEL}>Start date *</span><input type="date" className={INPUT} value={d.startDate} onChange={(e) => set({ startDate: e.target.value, endDate: d.endDate && d.endDate >= e.target.value ? d.endDate : e.target.value })} /></label>
              <label><span className={LABEL}>Start time</span><input type="time" className={INPUT} value={d.startTime} onChange={(e) => set({ startTime: e.target.value })} /></label>
              <label><span className={LABEL}>End date</span><input type="date" className={INPUT} value={d.endDate} min={d.startDate} onChange={(e) => set({ endDate: e.target.value })} /></label>
              <label><span className={LABEL}>End time</span><input type="time" className={INPUT} value={d.endTime} onChange={(e) => set({ endTime: e.target.value })} /></label>
              <label className="col-span-2 md:col-span-1"><span className={LABEL}>Time zone</span>
                <select className={INPUT} value={d.timezone} onChange={(e) => set({ timezone: e.target.value })}>{TIMEZONES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              </label>
              <label className="col-span-2 md:col-span-3"><span className={LABEL}>Lake / venue</span><input className={INPUT} value={d.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Folsom Lake, Granite Bay launch" /></label>
              <label className="col-span-2"><span className={LABEL}>City</span><input className={INPUT} value={d.city} onChange={(e) => set({ city: e.target.value })} /></label>
              <label className="col-span-2"><span className={LABEL}>State</span>
                <select className={INPUT} value={d.state} onChange={(e) => set({ state: e.target.value })}>
                  <option value="">Choose…</option>
                  {Object.entries(STATE_NAMES).sort((a, b) => a[1].localeCompare(b[1])).map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                </select>
              </label>
            </div>
          </Section>

          <Section title="Fishing" sub="Eligible species and the vessels anglers fish from">
            <span className={LABEL}>Eligible species</span>
            <div className="flex flex-wrap gap-1.5">
              {speciesOptions.length === 0 && <span className="text-sm text-[#8A9AB0]">Add species in Event Management → Tournaments → Fish species.</span>}
              {speciesOptions.map((s) => {
                const on = d.fishTypes.includes(s);
                return <button key={s} type="button" aria-pressed={on} onClick={() => set({ fishTypes: on ? d.fishTypes.filter((x) => x !== s) : [...d.fishTypes, s] })}
                  className={`rounded-full border px-3 py-1 text-[13px] font-medium transition ${on ? 'border-[#0E7C7B] bg-[#0E7C7B] text-white' : 'border-[#D3DEE8] bg-white text-[#2E3F5C] hover:bg-[#F5F8FB]'}`}>{s}</button>;
              })}
            </div>
            <p className="mt-1.5 text-xs text-[#6B7D93]">The first species you pick is shown as the primary species. Leave all off to allow any species.</p>
            <span className={`${LABEL} mt-4`}>Vessel type</span>
            <div className="flex flex-wrap gap-4">
              {VESSEL_TYPES.map((v) => (
                <label key={v} className="flex items-center gap-2 text-sm text-[#2E3F5C]">
                  <input type="checkbox" className="h-4 w-4 accent-[#0E7C7B]" checked={d.vesselTypes.includes(v)} onChange={(e) => set({ vesselTypes: e.target.checked ? [...d.vesselTypes, v] : d.vesselTypes.filter((x) => x !== v) })} />{v}
                </label>
              ))}
            </div>
          </Section>

          <Section title="Entry" sub="Individual anglers or teams, and what it costs">
            <Segmented label="Entry type" value={d.entryType} onChange={(v) => set({ entryType: v })} options={[['individual', 'Individual anglers'], ['team', 'Teams']]} />
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {d.entryType === 'team' && <>
                <label><span className={LABEL}>Min anglers per team</span><input type="number" min={1} max={20} className={INPUT} value={d.teamMin} onChange={(e) => set({ teamMin: e.target.value })} /></label>
                <label><span className={LABEL}>Max anglers per team</span><input type="number" min={1} max={20} className={INPUT} value={d.teamMax} onChange={(e) => set({ teamMax: e.target.value })} /></label>
              </>}
              <label><span className={LABEL}>Entry fee {d.entryType === 'team' ? (d.feeBasis === 'per_angler' ? '(per angler)' : '(per team)') : ''}</span>
                <span className="relative block"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8A9AB0]">$</span>
                  <input type="number" min={0} step="0.01" className={`${INPUT} pl-6`} value={d.entryFee} onChange={(e) => set({ entryFee: e.target.value })} placeholder="0" /></span>
              </label>
              <label><span className={LABEL}>Max {d.entryType === 'team' ? 'teams' : 'anglers'}</span><input type="number" min={1} className={INPUT} value={d.maxParticipants} onChange={(e) => set({ maxParticipants: e.target.value })} placeholder="No limit" /></label>
            </div>
            {d.entryType === 'team' && (
              <div className="mt-4">
                <span className={LABEL}>Team fee is charged</span>
                <Segmented label="Team fee basis" value={d.feeBasis} onChange={(v) => set({ feeBasis: v })} options={[['per_entry', 'Per team'], ['per_angler', 'Per angler']]} />
                <p className="mt-2 text-xs text-[#6B7D93]">The captain registers and names the team, then invites teammates by email to accept.</p>
              </div>
            )}
          </Section>

          <Section title="Judging" sub="How catches are measured and ranked">
            <Segmented label="Judged by" value={d.scoring} onChange={(v) => set({ scoring: v })} options={[['weight', 'Weight'], ['length', 'Length'], ['both', 'Weight & length']]} />
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {d.scoring === 'both' && (
                <div><span className={LABEL}>Rank the leaderboard by</span>
                  <Segmented label="Main measure" value={d.primaryMeasure} onChange={(v) => set({ primaryMeasure: v })} options={[['weight', 'Total weight'], ['length', 'Total length']]} />
                  <p className="mt-1.5 text-xs text-[#6B7D93]">The other measure breaks ties.</p>
                </div>
              )}
              <label><span className={LABEL}>Fish limit</span><input type="number" min={1} className={INPUT} value={d.fishLimit} onChange={(e) => set({ fishLimit: e.target.value })} placeholder="No limit: every approved fish counts" />
                <span className="mt-1 block text-xs text-[#6B7D93]">e.g. 5 = each {d.entryType === 'team' ? 'team' : 'angler'}’s best 5 fish count</span></label>
            </div>
          </Section>

          <Section title="Place prizes" sub="Awarded by finishing place on the main leaderboard">
            <ol className="space-y-2">
              {d.places.map((p, i) => (
                <li key={p.key} className="grid grid-cols-[48px_120px_minmax(0,1fr)_36px] items-center gap-2">
                  <span className="text-sm font-semibold text-[#0D1B4C]">{i + 1}{['st', 'nd', 'rd'][i] || 'th'}</span>
                  <span className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8A9AB0]">$</span>
                    <input aria-label={`Place ${i + 1} amount`} type="number" min={0} className={`${INPUT} pl-6`} value={p.amount} onChange={(e) => set({ places: d.places.map((x) => (x.key === p.key ? { ...x, amount: e.target.value } : x)) })} /></span>
                  <input aria-label={`Place ${i + 1} description`} className={INPUT} value={p.description} onChange={(e) => set({ places: d.places.map((x) => (x.key === p.key ? { ...x, description: e.target.value } : x)) })} placeholder="Optional: trophy, gear…" />
                  <button type="button" aria-label="Remove place" onClick={() => set({ places: d.places.filter((x) => x.key !== p.key) })} className="rounded p-1.5 text-[#8A9AB0] hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ol>
            <button type="button" onClick={() => set({ places: [...d.places, { key: k(), amount: '', description: '' }] })} className="mt-3 text-[13px] font-semibold text-[#0E7C7B] hover:underline">+ Add a place</button>
          </Section>

          <Section title="Side pots & bonus awards" sub="Side pots are optional buy-ins with their own prize pool (e.g. Big Fish). Bonus awards are free and everyone is eligible.">
            {d.pots.length === 0 && <p className="text-sm text-[#8A9AB0]">None yet.</p>}
            <ul className="space-y-3">
              {d.pots.map((p) => {
                const up = (patch: Partial<PotDraft>) => set({ pots: d.pots.map((x) => (x.key === p.key ? { ...x, ...patch } : x)) });
                return (
                  <li key={p.key} className="rounded-lg border border-[#E3EAF1] bg-[#FAFCFD] p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <label className="md:col-span-2"><span className={LABEL}>Name</span><input className={INPUT} value={p.name} onChange={(e) => up({ name: e.target.value })} placeholder="e.g. Big Fish" /></label>
                      <div className="md:col-span-2"><span className={LABEL}>Type</span>
                        <Segmented label="Type" value={p.kind} onChange={(v) => up({ kind: v })} options={[['pot', 'Side pot (buy-in)'], ['award', 'Bonus award (free)']]} />
                      </div>
                      <label className="md:col-span-2"><span className={LABEL}>Winner is</span>
                        <select className={INPUT} value={p.rule} onChange={(e) => up({ rule: e.target.value as PotRule })}>
                          {POT_RULES.map((r) => <option key={r} value={r} disabled={!ruleOk(r)}>{POT_RULE_LABEL[r]}{ruleOk(r) ? '' : ' (not judged)'}</option>)}
                        </select>
                      </label>
                      {(p.rule === 'species_heaviest' || p.rule === 'species_longest') && (
                        <label className="md:col-span-2"><span className={LABEL}>Species</span>
                          <select className={INPUT} value={p.species} onChange={(e) => up({ species: e.target.value })}>
                            <option value="">Choose…</option>
                            {(d.fishTypes.length ? d.fishTypes : speciesOptions).map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </label>
                      )}
                      {p.kind === 'pot' && (
                        <label><span className={LABEL}>Buy-in</span>
                          <span className="relative block"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8A9AB0]">$</span>
                            <input type="number" min={0} className={`${INPUT} pl-6`} value={p.fee} onChange={(e) => up({ fee: e.target.value })} /></span>
                        </label>
                      )}
                      {p.kind === 'pot' && (
                        <div><span className={LABEL}>Pays out</span>
                          <Segmented label="Payout" value={p.payout} onChange={(v) => up({ payout: v })} options={[['share', 'Share of pot'], ['fixed', 'Fixed prize']]} />
                        </div>
                      )}
                      {p.kind === 'pot' && p.payout === 'share' ? (
                        <label className="md:col-span-2"><span className={LABEL}>Split by place (%)</span><input className={INPUT} value={p.splits} onChange={(e) => up({ splits: e.target.value })} placeholder="100  or  70, 30" /></label>
                      ) : (
                        <>
                          <label><span className={LABEL}>Prize amount</span>
                            <span className="relative block"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8A9AB0]">$</span>
                              <input type="number" min={0} className={`${INPUT} pl-6`} value={p.amount} onChange={(e) => up({ amount: e.target.value })} /></span>
                          </label>
                          <label className={p.kind === 'pot' ? '' : 'md:col-span-3'}><span className={LABEL}>Prize description</span><input className={INPUT} value={p.description} onChange={(e) => up({ description: e.target.value })} placeholder="e.g. Trophy + gift card" /></label>
                        </>
                      )}
                    </div>
                    <div className="mt-3 text-right">
                      <button type="button" onClick={() => set({ pots: d.pots.filter((x) => x.key !== p.key) })} className="inline-flex items-center gap-1 text-[13px] font-semibold text-red-600 hover:underline"><Trash2 className="h-3.5 w-3.5" />Remove</button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => set({ pots: [...d.pots, { key: k(), name: 'Big Fish', kind: 'pot', rule: measures.includes('weight') ? 'heaviest_fish' : 'longest_fish', species: '', fee: '20', payout: 'share', amount: '', description: '', splits: '100' }] })} className={BTN_GHOST}><Plus className="h-4 w-4" />Add side pot</button>
              <button type="button" onClick={() => set({ pots: [...d.pots, { key: k(), name: '', kind: 'award', rule: 'director_pick', species: '', fee: '', payout: 'fixed', amount: '', description: '', splits: '' }] })} className={BTN_GHOST}><Plus className="h-4 w-4" />Add bonus award</button>
            </div>
          </Section>

          <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E3EAF1] bg-white/95 px-4 py-3 shadow-[0_-4px_14px_rgba(10,30,60,0.06)] backdrop-blur">
            <div className="min-h-[20px] text-sm" role="status">
              {msg && <span className={`flex items-center gap-1.5 ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}{msg.text}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {id && <button type="button" onClick={remove} disabled={!!busy} className={`${BTN_GHOST} text-red-600 hover:bg-red-50`}>{busy === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Delete</button>}
              <Link href="/admin/tournaments" className={BTN_GHOST}>Cancel</Link>
              <button type="submit" disabled={!!busy} className={BTN}>{busy === 'save' && <Loader2 className="h-4 w-4 animate-spin" />}{id ? 'Save changes' : 'Create tournament'}</button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
