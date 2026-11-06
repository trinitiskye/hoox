'use client';

/* ------------------------------------------------------------------ */
/* Admin → Event Management → Tournaments → Add / Edit a tournament    */
/* Covers everything the tournament page shows (overview, rules,       */
/* schedule, species, prizes, location, registration, host, sponsor)   */
/* plus entry format, judging, side pots, series and featuring.        */
/* Saves through /api/tournaments; admins can manage any tournament.   */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader2, Plus, Trash2, Check, AlertCircle, ExternalLink, Star, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useSpeciesList } from '@/lib/useSpeciesList';
import { STATE_NAMES } from '@/components/listing/ListingUI';
import { VESSEL_TYPES } from '@/lib/vessels';
import { WATER_TYPES, WATER_LABEL, SKILL_LEVELS, DEFAULT_DETAILS, detailsFromRow, type TournamentDetails } from '@/lib/tournamentDetails';
import { createTournament, updateTournament, deleteTournament, createSeries, updateSeries, type TournamentInput } from '@/lib/tournamentApi';
import { formatFromRow, POT_RULES, POT_RULE_LABEL, ordinal, type PotRule } from '@/lib/tournamentFormat';
import { getTournamentById, getSeries, type DbTournament, type DbSeries } from '@/lib/supabase';
import { INPUT, LABEL, CARD, BTN, BTN_GHOST } from '@/components/admin/sponsors/shared';
import type { FeaturePricing } from '@/lib/clubFeature';

const TIMEZONES = [
  ['America/Los_Angeles', 'Pacific'], ['America/Denver', 'Mountain'], ['America/Phoenix', 'Arizona'], ['America/Chicago', 'Central'],
  ['America/New_York', 'Eastern'], ['America/Anchorage', 'Alaska'], ['Pacific/Honolulu', 'Hawaii'],
] as const;
const SECTIONS = [
  ['basics', 'Basics'], ['where', 'When & where'], ['schedule', 'Schedule'], ['fishing', 'Fishing'], ['entry', 'Entry & registration'],
  ['judging', 'Judging'], ['rules', 'Rules'], ['prizes', 'Prizes'], ['pots', 'Side pots'], ['host', 'Host & sponsor'], ['series', 'Series'], ['promote', 'Feature'],
] as const;

interface PotDraft { key: string; name: string; kind: 'pot' | 'award'; rule: PotRule; species: string; fee: string; payout: 'fixed' | 'share'; amount: string; description: string; splits: string }
interface PlaceDraft { key: string; toPlace: string; amount: string; description: string }
interface Draft {
  name: string; createdBy: string; description: string; image: string; status: 'upcoming' | 'active' | 'completed';
  startDate: string; startTime: string; endDate: string; endTime: string; timezone: string;
  location: string; city: string; state: string; waterType: string;
  fishTypes: string[]; vesselTypes: string[];
  entryType: 'individual' | 'team'; teamMin: string; teamMax: string; feeBasis: 'per_entry' | 'per_angler';
  entryFee: string; maxParticipants: string;
  scoring: 'weight' | 'length' | 'both'; primaryMeasure: 'weight' | 'length'; fishLimit: string;
  places: PlaceDraft[];
  pots: PotDraft[];
  details: TournamentDetails;
  rulesText: string;
  closesDate: string; closesTime: string;
}

const k = () => Math.random().toString(36).slice(2);
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const blankPlace = (): PlaceDraft => ({ key: k(), toPlace: '', amount: '', description: '' });
const blank = (): Draft => ({
  name: '', createdBy: '', description: '', image: '', status: 'upcoming',
  startDate: '', startTime: '06:00', endDate: '', endTime: '15:00', timezone: 'America/Los_Angeles',
  location: '', city: '', state: '', waterType: 'freshwater', fishTypes: [], vesselTypes: [],
  entryType: 'individual', teamMin: '2', teamMax: '2', feeBasis: 'per_entry', entryFee: '', maxParticipants: '',
  scoring: 'weight', primaryMeasure: 'weight', fishLimit: '',
  places: [blankPlace()], pots: [], details: { ...DEFAULT_DETAILS, host: { ...DEFAULT_DETAILS.host }, sponsor: { ...DEFAULT_DETAILS.sponsor } },
  rulesText: '', closesDate: '', closesTime: '23:59',
});

function fromRow(t: DbTournament): Draft {
  const f = formatFromRow(t);
  const d = detailsFromRow(t.details);
  return {
    name: t.name, createdBy: t.created_by, description: t.description || '', image: t.image || '', status: (t.status as Draft['status']) || 'upcoming',
    startDate: t.start_date, startTime: (t.start_time || '').slice(0, 5), endDate: t.end_date, endTime: (t.end_time || '').slice(0, 5), timezone: t.timezone || 'America/Los_Angeles',
    location: t.location || '', city: t.city || '', state: t.state || '', waterType: t.water_type || '',
    fishTypes: t.fish_types?.length ? t.fish_types : t.species ? [t.species] : [], vesselTypes: t.vessel_types || [],
    entryType: f.entryType, teamMin: String(f.teamMin), teamMax: String(f.teamMax), feeBasis: f.feeBasis,
    entryFee: str(t.entry_fee ?? t.registration_fee), maxParticipants: str(t.max_participants),
    scoring: f.scoring, primaryMeasure: f.primaryMeasure, fishLimit: str(f.fishLimit),
    places: f.placePrizes.length ? f.placePrizes.map((p) => ({ key: k(), toPlace: str(p.toPlace), amount: str(p.amount), description: p.description })) : [blankPlace()],
    pots: f.sidePots.map((p) => ({ key: p.id, name: p.name, kind: p.kind, rule: p.rule, species: p.species || '', fee: str(p.fee || ''), payout: p.payout, amount: str(p.amount), description: p.description, splits: p.splits.join(', ') })),
    details: d, rulesText: d.rules.join('\n'),
    closesDate: d.registrationCloses.slice(0, 10), closesTime: d.registrationCloses.slice(11, 16) || '23:59',
  };
}

function toInput(d: Draft, isAdmin: boolean): TournamentInput & { createdBy?: string; waterType?: string; details?: TournamentDetails } {
  const num = (v: string) => (v.trim() === '' ? null : Number(v));
  return {
    ...(isAdmin && d.createdBy ? { createdBy: d.createdBy } : {}),
    name: d.name, description: d.description, image: d.image, status: d.status,
    startDate: d.startDate, startTime: d.startTime, endDate: d.endDate || d.startDate, endTime: d.endTime, timezone: d.timezone,
    location: d.location, city: d.city, state: d.state, waterType: d.waterType,
    fishTypes: d.fishTypes, species: d.fishTypes[0] || '', vesselTypes: d.vesselTypes as TournamentInput['vesselTypes'],
    entryType: d.entryType, teamMin: Number(d.teamMin) || 1, teamMax: Number(d.teamMax) || 1, feeBasis: d.feeBasis,
    entryFee: num(d.entryFee), maxParticipants: num(d.maxParticipants),
    scoring: d.scoring, primaryMeasure: d.scoring === 'both' ? d.primaryMeasure : d.scoring, fishLimit: num(d.fishLimit),
    placePrizes: d.places.filter((p) => p.amount.trim() || p.description.trim()).map((p) => ({ place: 0, toPlace: num(p.toPlace), amount: num(p.amount), description: p.description })),
    sidePots: d.pots.map((p) => ({
      id: p.key, name: p.name, kind: p.kind, rule: p.rule, species: p.species || null, fee: p.kind === 'pot' ? Number(p.fee) || 0 : 0,
      payout: p.kind === 'pot' ? p.payout : 'fixed', amount: num(p.amount), description: p.description,
      splits: p.splits.split(/[,\s/]+/).map(Number).filter((n) => n > 0),
    })),
    details: {
      ...d.details,
      rules: d.rulesText.split('\n').map((r) => r.replace(/^\s*(\d+[.)]|[-•*])\s*/, '').trim()).filter(Boolean),
      registrationCloses: d.closesDate ? `${d.closesDate}T${d.closesTime || '23:59'}` : '',
      speciesNotes: Object.fromEntries(Object.entries(d.details.speciesNotes).filter(([s, n]) => d.fishTypes.includes(s) && n.trim())),
    },
  };
}

/** Plain-date list from start to end (max 14) */
function daysBetween(a: string, b: string) {
  const out: string[] = [];
  if (!a) return out;
  const s = new Date(`${a}T12:00:00Z`), e = new Date(`${(b || a)}T12:00:00Z`);
  for (const d = new Date(s); d <= e && out.length < 14; d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10));
  return out;
}
const to12 = (t: string) => { if (!t) return ''; const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };

function Section({ id, title, sub, children }: { id: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section id={`sec-${id}`} className={`${CARD} scroll-mt-[150px]`} aria-labelledby={`h-${id}`}>
      <h3 id={`h-${id}`} className="font-montserrat text-[17px] font-bold text-[#0D1B4C]">{title}</h3>
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
const Money = ({ value, onChange, label, placeholder }: { value: string; onChange: (v: string) => void; label: string; placeholder?: string }) => (
  <span className="relative block"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8A9AB0]">$</span>
    <input aria-label={label} type="number" min={0} step="0.01" className={`${INPUT} pl-6`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></span>
);

/* -------------------------------- series --------------------------------- */
type SeriesChoice = { mode: 'none' } | { mode: 'existing'; id: string } | { mode: 'new'; name: string; description: string };

/* ------------------------------- featuring -------------------------------- */
interface FeatureChoice { on: boolean; badge: string; hero: string; startDate: string; notes: string; approve: boolean }
interface FeatureRow { id: string; placement: string; plan_name: string | null; price_quoted: number | null; status: string; featured_from: string | null; featured_until: string | null }

export default function TournamentEditor({ id }: { id?: string }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const species = useSpeciesList();
  const [d, setD] = useState<Draft | null>(id ? null : blank());
  const [directors, setDirectors] = useState<{ id: string; name: string; organization?: string }[]>([]);
  const [allSeries, setAllSeries] = useState<DbSeries[] | null>(null);
  const [seriesChoice, setSeriesChoice] = useState<SeriesChoice>({ mode: 'none' });
  const [pricing, setPricing] = useState<{ badge: FeaturePricing; hero: FeaturePricing } | null>(null);
  const [feature, setFeature] = useState<FeatureChoice>({ on: false, badge: '', hero: '', startDate: '', notes: '', approve: false });
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  // Load the tournament, directors, series and featured pricing
  useEffect(() => {
    if (!id) return;
    getTournamentById(id).then(({ data, error }) => {
      if (error || !data?.[0]) setLoadErr('Tournament not found.');
      else setD(fromRow(data[0]));
    });
    fetch(`/api/tournaments/${encodeURIComponent(id)}/feature`, { cache: 'no-store' }).then((r) => r.json()).then((j) => setFeatures(j.requests || [])).catch(() => {});
  }, [id]);
  useEffect(() => {
    if (!isAdmin) return;
    fetch('/api/admin/users', { cache: 'no-store' }).then((r) => r.json()).then((j) => {
      setDirectors((j.users || []).filter((u: { role: string }) => u.role === 'director').map((u: { id: string; name: string; organization?: string }) => ({ id: u.id, name: u.name, organization: u.organization })));
    }).catch(() => {});
  }, [isAdmin]);
  useEffect(() => { getSeries().then(({ data }) => setAllSeries(data || [])); }, []);
  useEffect(() => { fetch('/api/feature-pricing?type=tournament').then((r) => r.json()).then((j) => setPricing(j.pricing || null)).catch(() => {}); }, []);
  useEffect(() => {
    if (id && allSeries) { const cur = allSeries.find((s) => (s.tournament_ids || []).includes(id)); setSeriesChoice(cur ? { mode: 'existing', id: cur.id } : { mode: 'none' }); }
  }, [id, allSeries]);
  useEffect(() => {
    if (id && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('created')) setMsg({ ok: true, text: 'Tournament created. Keep editing, or view it on the site.' });
  }, [id]);

  const set = (patch: Partial<Draft>) => { setD((x) => (x ? { ...x, ...patch } : x)); setMsg(null); };
  const setDet = (patch: Partial<TournamentDetails>) => setD((x) => (x ? { ...x, details: { ...x.details, ...patch } } : x));
  const speciesOptions = useMemo(() => [...new Set([...(species ?? []), ...(d?.fishTypes ?? [])])].sort(), [species, d?.fishTypes]);
  const measures = d ? (d.scoring === 'both' ? ['weight', 'length'] : [d.scoring]) : [];
  const ruleOk = (r: PotRule) => !((r === 'heaviest_fish' || r === 'species_heaviest') && !measures.includes('weight')) && !((r === 'longest_fish' || r === 'species_longest') && !measures.includes('length'));
  const owner = isAdmin ? (d?.createdBy || '') : currentUser?.id || '';
  const seriesOptions = (allSeries || []).filter((s) => isAdmin || s.created_by === currentUser?.id);
  /** Each prize row starts right after the previous row's last place (1st, 2nd, 3rd, 4th–5th, 6th…) */
  const placeStart = (i: number) => {
    let next = 1;
    for (const p of (d?.places ?? []).slice(0, i)) { const to = Number(p.toPlace); next = (to >= next ? to : next) + 1; }
    return next;
  };

  /** After the tournament is saved: series + featuring. Returns notes for the status line. */
  async function afterSave(tid: string): Promise<string[]> {
    const notes: string[] = [];
    if (!d) return notes;
    // Series: leave any other series, then join / create
    const current = (allSeries || []).filter((s) => (s.tournament_ids || []).includes(tid));
    for (const s of current) {
      if (seriesChoice.mode === 'existing' && seriesChoice.id === s.id) continue;
      await updateSeries(s.id, { tournamentIds: (s.tournament_ids || []).filter((x) => x !== tid) });
    }
    if (seriesChoice.mode === 'existing' && !current.some((s) => s.id === seriesChoice.id)) {
      const s = (allSeries || []).find((x) => x.id === seriesChoice.id);
      const r = await updateSeries(seriesChoice.id, { tournamentIds: [...(s?.tournament_ids || []), tid] });
      notes.push(r.error ? `Series: ${r.error}` : `Added to ${s?.name}.`);
    }
    if (seriesChoice.mode === 'new' && seriesChoice.name.trim()) {
      const r = await createSeries({ name: seriesChoice.name.trim(), description: seriesChoice.description, tournamentIds: [tid], vesselTypes: d.vesselTypes, ...(isAdmin && owner ? { createdBy: owner } : {}) } as Parameters<typeof createSeries>[0]);
      notes.push(r.error ? `Series: ${r.error}` : `Series “${seriesChoice.name.trim()}” created with this tournament.`);
      if (!r.error && r.data) setSeriesChoice({ mode: 'existing', id: r.data.id });
    }
    getSeries().then(({ data }) => setAllSeries(data || []));
    // Featuring
    if (feature.on) {
      for (const [placement, plan] of [['badge', feature.badge], ['hero', feature.hero]] as const) {
        if (!plan) continue;
        const res = await fetch(`/api/tournaments/${encodeURIComponent(tid)}/feature`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ placement, plan, startDate: feature.startDate || undefined, notes: feature.notes, approve: isAdmin && feature.approve }) });
        const j = await res.json().catch(() => ({}));
        const label = placement === 'hero' ? 'page hero' : 'featured listing';
        notes.push(j.error ? `Feature: ${j.error}` : isAdmin && feature.approve ? `${label[0].toUpperCase() + label.slice(1)} is live.` : `${label[0].toUpperCase() + label.slice(1)} request sent: HOOX will review it and email an invoice.`);
      }
      setFeature({ on: false, badge: '', hero: '', startDate: '', notes: '', approve: false });
      fetch(`/api/tournaments/${encodeURIComponent(tid)}/feature`, { cache: 'no-store' }).then((r) => r.json()).then((j) => setFeatures(j.requests || [])).catch(() => {});
    }
    return notes;
  }

  const save = async () => {
    if (!d) return;
    if (!d.name.trim()) { setMsg({ ok: false, text: 'Enter the tournament name.' }); return; }
    if (!d.startDate) { setMsg({ ok: false, text: 'Choose a start date.' }); return; }
    if (isAdmin && !id && !d.createdBy) { setMsg({ ok: false, text: 'Choose the tournament director.' }); return; }
    if (seriesChoice.mode === 'new' && !seriesChoice.name.trim()) { setMsg({ ok: false, text: 'Name the new series, or choose “Not part of a series”.' }); return; }
    if (feature.on && !feature.badge && !feature.hero) { setMsg({ ok: false, text: 'Choose a plan for the featured listing or page hero, or turn featuring off.' }); return; }
    setBusy('save'); setMsg(null);
    const res = id ? await updateTournament(id, toInput(d, isAdmin)) : await createTournament(toInput(d, isAdmin));
    if (res.error || !res.data) { setBusy(null); setMsg({ ok: false, text: res.error || 'Couldn’t save.' }); return; }
    const notes = await afterSave(res.data.id);
    setBusy(null);
    if (!id) { router.push(`/admin/tournaments/${encodeURIComponent(res.data.id)}/edit?created=1`); return; }
    const bad = notes.find((n) => /^(Series|Feature):/.test(n));
    setMsg({ ok: !bad, text: ['Tournament saved.', ...notes].join(' ') });
  };
  const remove = async () => {
    if (!id || !d || !window.confirm(`Delete “${d.name}”? Its registrations, teams and catches are deleted too. This can’t be undone.`)) return;
    setBusy('delete');
    const res = await deleteTournament(id);
    setBusy(null);
    if (res.error) { setMsg({ ok: false, text: res.error }); return; }
    router.push('/admin/tournaments');
  };
  const fillSchedule = () => {
    if (!d?.startDate) { setMsg({ ok: false, text: 'Choose the start date first.' }); return; }
    const days = daysBetween(d.startDate, d.endDate);
    setDet({
      schedule: days.map((day, i) => ({
        date: day, title: days.length === 1 ? 'Tournament Day' : i === days.length - 1 ? 'Final Day & Awards' : `Tournament Day ${i + 1}`,
        time: [to12(d.startTime), to12(d.endTime)].filter(Boolean).join(' – '), place: d.location,
      })),
    });
  };

  const title = id ? (d?.name || 'Edit tournament') : 'Add a Tournament';
  const planOptions = (p: 'badge' | 'hero') => (pricing?.[p]?.plans || []).filter((x) => x.enabled);

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

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C]">{title}</h2>
          <p className="mt-0.5 text-sm text-[#5F6F86]">Everything anglers see on the tournament page, plus how they enter, how catches are judged and what they can win.</p>
        </div>
        {id && <a href={`/tournaments/${encodeURIComponent(id)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-semibold text-[#0E7C7B] hover:underline">View on site <ExternalLink className="h-4 w-4" /></a>}
      </div>

      {/* Jump to a section */}
      <nav aria-label="Form sections" className="sticky top-0 z-20 -mx-1 mb-5 overflow-x-auto rounded-lg border border-[#E3EAF1] bg-white/95 px-2 py-2 backdrop-blur">
        <ul className="flex min-w-max gap-1">
          {SECTIONS.map(([sid, label]) => (
            <li key={sid}><a href={`#sec-${sid}`} className="block whitespace-nowrap rounded-md px-2.5 py-1 text-[13px] font-medium text-[#4A5B76] hover:bg-[#F2F7FA] hover:text-[#0D1B4C]">{label}</a></li>
          ))}
        </ul>
      </nav>

      {loadErr ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadErr}</p> : !d ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#5F6F86]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-5" noValidate>
          {/* ----------------------------- Basics ----------------------------- */}
          <Section id="basics" title="Basics" sub="Shown in the page banner and the Overview tab">
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
              <label><span className={LABEL}>Banner label</span><input className={INPUT} value={d.details.badge} onChange={(e) => setDet({ badge: e.target.value })} placeholder="Official Tournament" /></label>
              <label><span className={LABEL}>Skill level</span>
                <select className={INPUT} value={d.details.skillLevel} onChange={(e) => setDet({ skillLevel: e.target.value })}>{SKILL_LEVELS.map((x) => <option key={x}>{x}</option>)}</select>
              </label>
              <label className="md:col-span-2"><span className={LABEL}>Banner summary</span><textarea rows={2} maxLength={300} className={`${INPUT} h-auto py-2`} value={d.details.summary} onChange={(e) => setDet({ summary: e.target.value })} placeholder="One or two sentences in the banner, e.g. “A premier two-day bass tournament on Folsom Lake, open to all skill levels.”" /></label>
              <label className="md:col-span-2"><span className={LABEL}>Event overview</span><textarea rows={5} className={`${INPUT} h-auto py-2`} value={d.description} onChange={(e) => set({ description: e.target.value })} placeholder="The full description in the Overview tab." /></label>
              <label className="md:col-span-2"><span className={LABEL}>Banner image URL</span><input className={INPUT} value={d.image} onChange={(e) => set({ image: e.target.value })} placeholder="https://… (wide photo, at least 1600 px)" /></label>
            </div>
          </Section>

          {/* -------------------------- When & where -------------------------- */}
          <Section id="where" title="When & where" sub="Dates, time zone and the Location tab">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <label><span className={LABEL}>Start date *</span><input type="date" className={INPUT} value={d.startDate} onChange={(e) => set({ startDate: e.target.value, endDate: d.endDate && d.endDate >= e.target.value ? d.endDate : e.target.value })} /></label>
              <label><span className={LABEL}>Start time</span><input type="time" className={INPUT} value={d.startTime} onChange={(e) => set({ startTime: e.target.value })} /></label>
              <label><span className={LABEL}>End date</span><input type="date" className={INPUT} value={d.endDate} min={d.startDate} onChange={(e) => set({ endDate: e.target.value })} /></label>
              <label><span className={LABEL}>End time</span><input type="time" className={INPUT} value={d.endTime} onChange={(e) => set({ endTime: e.target.value })} /></label>
              <label className="col-span-2 md:col-span-1"><span className={LABEL}>Time zone</span>
                <select className={INPUT} value={d.timezone} onChange={(e) => set({ timezone: e.target.value })}>{TIMEZONES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              </label>
              <label className="col-span-2 md:col-span-3"><span className={LABEL}>Lake / venue</span><input className={INPUT} value={d.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Folsom Lake, Granite Bay launch" /></label>
              <label className="col-span-2 md:col-span-4"><span className={LABEL}>Street address</span><input className={INPUT} value={d.details.address} onChange={(e) => setDet({ address: e.target.value })} placeholder="Launch or check-in address, for the map and directions" /></label>
              <label className="col-span-2"><span className={LABEL}>City</span><input className={INPUT} value={d.city} onChange={(e) => set({ city: e.target.value })} /></label>
              <label><span className={LABEL}>State</span>
                <select className={INPUT} value={d.state} onChange={(e) => set({ state: e.target.value })}>
                  <option value="">Choose…</option>
                  {Object.entries(STATE_NAMES).sort((a, b) => a[1].localeCompare(b[1])).map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                </select>
              </label>
              <label><span className={LABEL}>ZIP</span><input className={INPUT} value={d.details.zip} onChange={(e) => setDet({ zip: e.target.value })} inputMode="numeric" /></label>
            </div>
          </Section>

          {/* ----------------------------- Schedule ----------------------------- */}
          <Section id="schedule" title="Schedule" sub="The Schedule tab. Leave empty to show one line per tournament day automatically.">
            {d.details.schedule.length === 0 && <p className="mb-3 text-sm text-[#8A9AB0]">No custom schedule. Anglers see each tournament day with the start and end times.</p>}
            <ul className="space-y-2">
              {d.details.schedule.map((s, i) => {
                const up = (patch: Partial<typeof s>) => setDet({ schedule: d.details.schedule.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
                return (
                  <li key={i} className="grid grid-cols-2 gap-2 md:grid-cols-[150px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_36px]">
                    <input aria-label="Date" type="date" className={INPUT} value={s.date} onChange={(e) => up({ date: e.target.value })} />
                    <input aria-label="Title" className={INPUT} value={s.title} onChange={(e) => up({ title: e.target.value })} placeholder="e.g. Registration & Check-In" />
                    <input aria-label="Time" className={INPUT} value={s.time} onChange={(e) => up({ time: e.target.value })} placeholder="Safe light – 3:00 PM" />
                    <input aria-label="Place" className={INPUT} value={s.place} onChange={(e) => up({ place: e.target.value })} placeholder="Place (optional)" />
                    <button type="button" aria-label="Remove schedule item" onClick={() => setDet({ schedule: d.details.schedule.filter((_, j) => j !== i) })} className="rounded p-1.5 text-[#8A9AB0] hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setDet({ schedule: [...d.details.schedule, { date: d.startDate, title: '', time: '', place: '' }] })} className={BTN_GHOST}><Plus className="h-4 w-4" />Add item</button>
              {d.details.schedule.length === 0 && <button type="button" onClick={fillSchedule} className={BTN_GHOST}>Start from the tournament days</button>}
            </div>
          </Section>

          {/* ----------------------------- Fishing ----------------------------- */}
          <Section id="fishing" title="Fishing" sub="Water type, vessels and the Species tab">
            <div className="flex flex-wrap gap-8">
              <div><span className={LABEL}>Water</span>
                <Segmented label="Water type" value={d.waterType || ''} onChange={(v) => set({ waterType: v })} options={[...WATER_TYPES.map((w) => [w, WATER_LABEL[w]] as [string, string])]} />
              </div>
              <div><span className={LABEL}>Vessel type</span>
                <div className="flex h-[40px] flex-wrap items-center gap-4">
                  {VESSEL_TYPES.map((v) => (
                    <label key={v} className="flex items-center gap-2 text-sm text-[#2E3F5C]">
                      <input type="checkbox" className="h-4 w-4 accent-[#0E7C7B]" checked={d.vesselTypes.includes(v)} onChange={(e) => set({ vesselTypes: e.target.checked ? [...d.vesselTypes, v] : d.vesselTypes.filter((x) => x !== v) })} />{v}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <span className={`${LABEL} mt-5`}>Eligible species</span>
            <div className="flex flex-wrap gap-1.5">
              {speciesOptions.length === 0 && <span className="text-sm text-[#8A9AB0]">Add species in Event Management → Tournaments → Fish species.</span>}
              {speciesOptions.map((s) => {
                const on = d.fishTypes.includes(s);
                return <button key={s} type="button" aria-pressed={on} onClick={() => set({ fishTypes: on ? d.fishTypes.filter((x) => x !== s) : [...d.fishTypes, s] })}
                  className={`rounded-full border px-3 py-1 text-[13px] font-medium transition ${on ? 'border-[#0E7C7B] bg-[#0E7C7B] text-white' : 'border-[#D3DEE8] bg-white text-[#2E3F5C] hover:bg-[#F5F8FB]'}`}>{s}</button>;
              })}
            </div>
            <p className="mt-1.5 text-xs text-[#6B7D93]">The first species you pick is the primary species. Leave all off to allow any species.</p>
            {d.fishTypes.length > 0 && (
              <ul className="mt-4 space-y-2">
                {d.fishTypes.map((s, i) => (
                  <li key={s} className="grid grid-cols-[minmax(0,180px)_minmax(0,1fr)] items-center gap-3">
                    <span className="truncate text-sm font-medium text-[#0D1B4C]">{s}</span>
                    <input aria-label={`Note for ${s}`} className={INPUT} value={d.details.speciesNotes[s] || ''} onChange={(e) => setDet({ speciesNotes: { ...d.details.speciesNotes, [s]: e.target.value } })} placeholder={i === 0 ? 'Primary Species' : 'Note (optional), e.g. “Optional” or “12 in. minimum”'} />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* ------------------------ Entry & registration ------------------------ */}
          <Section id="entry" title="Entry & registration" sub="How anglers enter, what it costs and when registration closes">
            <Segmented label="Entry type" value={d.entryType} onChange={(v) => set({ entryType: v })} options={[['individual', 'Individual anglers'], ['team', 'Teams']]} />
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {d.entryType === 'team' && <>
                <label><span className={LABEL}>Min anglers per team</span><input type="number" min={1} max={20} className={INPUT} value={d.teamMin} onChange={(e) => set({ teamMin: e.target.value })} /></label>
                <label><span className={LABEL}>Max anglers per team</span><input type="number" min={1} max={20} className={INPUT} value={d.teamMax} onChange={(e) => set({ teamMax: e.target.value })} /></label>
              </>}
              <label><span className={LABEL}>Entry fee {d.entryType === 'team' ? (d.feeBasis === 'per_angler' ? '(per angler)' : '(per team)') : ''}</span>
                <Money label="Entry fee" value={d.entryFee} onChange={(v) => set({ entryFee: v })} placeholder="0" />
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
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              <label className="col-span-2"><span className={LABEL}>Fee note</span><input className={INPUT} value={d.details.feeNote} onChange={(e) => setDet({ feeNote: e.target.value })} placeholder="e.g. Includes 2 anglers per boat" /></label>
              <label><span className={LABEL}>Registration closes</span><input type="date" className={INPUT} value={d.closesDate} max={d.endDate || undefined} onChange={(e) => set({ closesDate: e.target.value })} /></label>
              <label><span className={LABEL}>at</span><input type="time" className={INPUT} value={d.closesTime} onChange={(e) => set({ closesTime: e.target.value })} disabled={!d.closesDate} /></label>
            </div>
            <p className="mt-1.5 text-xs text-[#6B7D93]">Leave the closing date blank to keep registration open until the tournament ends.</p>
          </Section>

          {/* ----------------------------- Judging ----------------------------- */}
          <Section id="judging" title="Judging" sub="How catches are measured and ranked">
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

          {/* ------------------------------ Rules ------------------------------ */}
          <Section id="rules" title="Rules" sub="The Rules tab. One rule per line. The entry format and judging above are listed for anglers automatically.">
            <textarea rows={7} className={`${INPUT} h-auto py-2 leading-[22px]`} value={d.rulesText} onChange={(e) => set({ rulesText: e.target.value })}
              placeholder={'Artificial lures only. Live bait is not permitted.\nAll fish must be kept alive; dead-fish penalty of 0.25 lb.\nLife jackets must be worn whenever the outboard is running.'} />
          </Section>

          {/* ------------------------------ Prizes ------------------------------ */}
          <Section id="prizes" title="Prizes" sub="The Prizes tab: awarded by finishing place on the main leaderboard">
            <ol className="space-y-2">
              {d.places.map((p, i) => {
                const start = placeStart(i);
                const up = (patch: Partial<PlaceDraft>) => set({ places: d.places.map((x) => (x.key === p.key ? { ...x, ...patch } : x)) });
                return (
                  <li key={p.key} className="grid grid-cols-[64px_100px_120px_minmax(0,1fr)_36px] items-center gap-2">
                    <span className="text-sm font-semibold text-[#0D1B4C]">{ordinal(start)}</span>
                    <input aria-label={`Through place (row ${i + 1})`} type="number" min={start} className={INPUT} value={p.toPlace} onChange={(e) => up({ toPlace: e.target.value })} placeholder="thru…" title="For a range like 6th–10th, enter the last place" />
                    <Money label={`Prize amount (row ${i + 1})`} value={p.amount} onChange={(v) => up({ amount: v })} />
                    <input aria-label={`Prize description (row ${i + 1})`} className={INPUT} value={p.description} onChange={(e) => up({ description: e.target.value })} placeholder="Optional: trophy, gear…" />
                    <button type="button" aria-label="Remove prize row" onClick={() => set({ places: d.places.filter((x) => x.key !== p.key) })} className="rounded p-1.5 text-[#8A9AB0] hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </li>
                );
              })}
            </ol>
            <p className="mt-1.5 text-xs text-[#6B7D93]">For a range, fill in “thru”: e.g. 6th thru 10th, $5,000 each.</p>
            <button type="button" onClick={() => set({ places: [...d.places, blankPlace()] })} className="mt-3 text-[13px] font-semibold text-[#0E7C7B] hover:underline">+ Add a place</button>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label><span className={LABEL}>Total prize pool (shown on the page)</span><input className={INPUT} value={d.details.prizePool} onChange={(e) => setDet({ prizePool: e.target.value })} placeholder="Leave blank to add up the place prizes" /></label>
              <label><span className={LABEL}>Payout note</span><input className={INPUT} value={d.details.payoutNote} onChange={(e) => setDet({ payoutNote: e.target.value })} placeholder="e.g. Payouts based on a 100-boat field" /></label>
            </div>
          </Section>

          {/* ---------------------------- Side pots ---------------------------- */}
          <Section id="pots" title="Side pots & bonus awards" sub="Side pots are optional buy-ins with their own prize pool (e.g. Big Fish). Bonus awards are free and everyone is eligible.">
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
                      {p.kind === 'pot' && <label><span className={LABEL}>Buy-in</span><Money label="Buy-in" value={p.fee} onChange={(v) => up({ fee: v })} /></label>}
                      {p.kind === 'pot' && (
                        <div><span className={LABEL}>Pays out</span>
                          <Segmented label="Payout" value={p.payout} onChange={(v) => up({ payout: v })} options={[['share', 'Share of pot'], ['fixed', 'Fixed prize']]} />
                        </div>
                      )}
                      {p.kind === 'pot' && p.payout === 'share' ? (
                        <label className="md:col-span-2"><span className={LABEL}>Split by place (%)</span><input className={INPUT} value={p.splits} onChange={(e) => up({ splits: e.target.value })} placeholder="100  or  70, 30" /></label>
                      ) : (
                        <>
                          <label><span className={LABEL}>Prize amount</span><Money label="Prize amount" value={p.amount} onChange={(v) => up({ amount: v })} /></label>
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

          {/* -------------------------- Host & sponsor -------------------------- */}
          <Section id="host" title="Host & presenting sponsor" sub="The “Hosted by” and “Presenting sponsor” cards. Leave the host blank to use the director’s public profile.">
            <span className={LABEL}>Hosted by</span>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input aria-label="Host name" className={INPUT} value={d.details.host.name} onChange={(e) => setDet({ host: { ...d.details.host, name: e.target.value } })} placeholder="Club or organization name" />
              <input aria-label="Host website" className={INPUT} value={d.details.host.website} onChange={(e) => setDet({ host: { ...d.details.host, website: e.target.value } })} placeholder="Website" />
              <input aria-label="Host email" type="email" className={INPUT} value={d.details.host.email} onChange={(e) => setDet({ host: { ...d.details.host, email: e.target.value } })} placeholder="Contact email" />
              <input aria-label="Host phone" type="tel" className={INPUT} value={d.details.host.phone} onChange={(e) => setDet({ host: { ...d.details.host, phone: e.target.value } })} placeholder="Contact phone" />
            </div>
            <span className={`${LABEL} mt-5`}>Presenting sponsor <span className="font-normal text-[#8A9AB0]">(optional; also shows “Presented by” on tournament cards)</span></span>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input aria-label="Sponsor name" className={INPUT} value={d.details.sponsor.name} onChange={(e) => setDet({ sponsor: { ...d.details.sponsor, name: e.target.value } })} placeholder="Sponsor name" />
              <input aria-label="Sponsor website" className={INPUT} value={d.details.sponsor.url} onChange={(e) => setDet({ sponsor: { ...d.details.sponsor, url: e.target.value } })} placeholder="https://sponsor-website.com" />
              <input aria-label="Sponsor tagline" className={`${INPUT} md:col-span-2`} value={d.details.sponsor.tagline} onChange={(e) => setDet({ sponsor: { ...d.details.sponsor, tagline: e.target.value } })} placeholder="Tagline, e.g. “Built for anglers. Trusted by the water.”" />
              <input aria-label="Sponsor logo URL" className={INPUT} value={d.details.sponsor.logo} onChange={(e) => setDet({ sponsor: { ...d.details.sponsor, logo: e.target.value } })} placeholder="Logo URL (white or light logo, transparent PNG)" />
              <input aria-label="Sponsor image URL" className={INPUT} value={d.details.sponsor.image} onChange={(e) => setDet({ sponsor: { ...d.details.sponsor, image: e.target.value } })} placeholder="Product / background image URL" />
            </div>
          </Section>

          {/* ------------------------------ Series ------------------------------ */}
          <Section id="series" title="Series" sub="Add this tournament to a series, or start a new series with this tournament as its first event">
            <Segmented label="Series" value={seriesChoice.mode} onChange={(v) => setSeriesChoice(v === 'none' ? { mode: 'none' } : v === 'existing' ? { mode: 'existing', id: seriesOptions[0]?.id || '' } : { mode: 'new', name: '', description: '' })}
              options={[['none', 'Not part of a series'], ['existing', 'Add to a series'], ['new', 'Create a new series']]} />
            {seriesChoice.mode === 'existing' && (
              <label className="mt-4 block max-w-[480px]"><span className={LABEL}>Series</span>
                <select className={INPUT} value={seriesChoice.id} onChange={(e) => setSeriesChoice({ mode: 'existing', id: e.target.value })}>
                  {seriesOptions.length === 0 && <option value="">No series yet: create one instead</option>}
                  {seriesOptions.map((s) => <option key={s.id} value={s.id}>{s.name} ({(s.tournament_ids || []).length} event{(s.tournament_ids || []).length === 1 ? '' : 's'})</option>)}
                </select>
              </label>
            )}
            {seriesChoice.mode === 'new' && (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <label><span className={LABEL}>Series name *</span><input className={INPUT} value={seriesChoice.name} onChange={(e) => setSeriesChoice({ ...seriesChoice, name: e.target.value })} placeholder={d.name ? `e.g. ${d.name.replace(/\b(open|classic|challenge)\b/i, '').trim()} Series` : 'e.g. NorCal Kayak Bass Series'} /></label>
                <label><span className={LABEL}>Series description</span><input className={INPUT} value={seriesChoice.description} onChange={(e) => setSeriesChoice({ ...seriesChoice, description: e.target.value })} placeholder="Optional" /></label>
                <p className="text-xs text-[#6B7D93] md:col-span-2">The series is created when you save, with this tournament as its first event{isAdmin ? ' and the same director' : ''}. Add more tournaments to it the same way.</p>
              </div>
            )}
          </Section>

          {/* --------------------------- Feature it --------------------------- */}
          <Section id="promote" title="Feature this tournament" sub="Featured listing: Featured badge and top of the Tournaments grid, list and map. Page hero: the big banner at the top of the Tournaments page.">
            {features.length > 0 && (
              <ul className="mb-4 divide-y divide-[#EEF3F8] rounded-lg border border-[#E3EAF1] text-sm">
                {features.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <span className="flex items-center gap-2 font-medium text-[#0D1B4C]"><Star className="h-4 w-4 text-[#C4560E]" />{r.placement === 'hero' ? 'Featured page hero' : 'Featured listing'} · {r.plan_name}</span>
                    <span className="text-[#5F6F86]">{r.status === 'approved' && r.featured_until ? `Live until ${new Date(`${r.featured_until}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : r.status === 'in_review' ? 'Invoice sent' : r.status === 'new' ? 'Request sent: awaiting HOOX review' : r.status}</span>
                  </li>
                ))}
              </ul>
            )}
            <label className="flex items-center gap-2 text-sm font-semibold text-[#0D1B4C]">
              <input type="checkbox" className="h-4 w-4 accent-[#0E7C7B]" checked={feature.on} onChange={(e) => setFeature({ ...feature, on: e.target.checked })} />
              <Sparkles className="h-4 w-4 text-[#C4560E]" />{features.length ? 'Add another featured placement' : 'Feature this tournament'}
            </label>
            {feature.on && (
              <div className="mt-4 space-y-4">
                {!pricing ? <p className="text-sm text-[#8A9AB0]">Loading plans…</p> : (['badge', 'hero'] as const).map((pl) => (
                  <fieldset key={pl}>
                    <legend className={LABEL}>{pl === 'hero' ? 'Featured page hero' : 'Featured listing'}</legend>
                    <div className="flex flex-wrap gap-2">
                      <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${!feature[pl] ? 'border-[#0E7C7B] bg-[#F2FAFA]' : 'border-[#D3DEE8]'}`}>
                        <input type="radio" name={`plan-${pl}`} className="accent-[#0E7C7B]" checked={!feature[pl]} onChange={() => setFeature({ ...feature, [pl]: '' })} />No thanks
                      </label>
                      {planOptions(pl).map((p) => (
                        <label key={p.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${feature[pl] === p.id ? 'border-[#0E7C7B] bg-[#F2FAFA]' : 'border-[#D3DEE8]'}`}>
                          <input type="radio" name={`plan-${pl}`} className="accent-[#0E7C7B]" checked={feature[pl] === p.id} onChange={() => setFeature({ ...feature, [pl]: p.id })} />
                          <span><span className="font-semibold text-[#0D1B4C]">{p.name}</span> · ${p.price.toLocaleString()} / {p.term}{p.badge ? <span className="ml-1.5 text-xs font-semibold text-[#0E7C7B]">{p.badge}</span> : null}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[200px_minmax(0,1fr)]">
                  <label><span className={LABEL}>Start featuring on</span><input type="date" className={INPUT} value={feature.startDate} onChange={(e) => setFeature({ ...feature, startDate: e.target.value })} /></label>
                  <label><span className={LABEL}>Notes for HOOX</span><input className={INPUT} value={feature.notes} onChange={(e) => setFeature({ ...feature, notes: e.target.value })} placeholder="Optional" /></label>
                </div>
                {isAdmin ? (
                  <label className="flex items-center gap-2 text-sm text-[#2E3F5C]"><input type="checkbox" className="h-4 w-4 accent-[#0E7C7B]" checked={feature.approve} onChange={(e) => setFeature({ ...feature, approve: e.target.checked })} />Approve now and put it live (otherwise it waits in Marketing Promotions → Tournaments)</label>
                ) : (
                  <p className="text-xs text-[#6B7D93]">Nothing is charged now. When you save, HOOX reviews the request and emails you an invoice.</p>
                )}
              </div>
            )}
          </Section>

          <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E3EAF1] bg-white/95 px-4 py-3 shadow-[0_-4px_14px_rgba(10,30,60,0.06)] backdrop-blur">
            <div className="min-h-[20px] min-w-0 flex-1 text-sm" role="status">
              {msg && <span className={`flex items-start gap-1.5 ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.ok ? <Check className="mt-0.5 h-4 w-4 flex-shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />}{msg.text}</span>}
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
