'use client';

/* ------------------------------------------------------------------ */
/* /tournaments/<id>/leaderboard — full standings: every registered    */
/* angler with rank, hometown, fish, big fish, total and gap to the    */
/* leader. Search, filters, "find my rank" for signed-in anglers.      */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, X, Users, Fish, Trophy, Scale, Loader2, MapPin, CalendarDays, Crosshair } from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import { RankBadge, Avatar } from '@/components/home/LeaderboardSection';
import { anglerHref } from '@/lib/anglerLinks';
import { useAuth } from '@/lib/AuthContext';
import { toPath } from '@/lib/routes';
import {
  getTournamentById, getRegistrationsByTournament, getSubmissionsByTournament,
  dbTournamentToApp, dbRegistrationToApp, dbSubmissionToApp,
} from '@/lib/supabase';
import { DEMO_EVENT, DEMO_EVENT_ID, eventFromTournament, type EventDetail } from '@/lib/eventDetail';
import { demoStandings, realStandings, type Standing, type StandingsData } from '@/lib/standings';

const INK = 'text-[#0D1B4C]';
const PAGE = 50;
type Filter = 'all' | 'weighed' | 'waiting';

const fmtDates = (a: string, b: string) => {
  const d = (s: string) => new Date(`${s}T12:00:00`);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return a === b ? d(a).toLocaleDateString('en-US', { ...opts, year: 'numeric' })
    : `${d(a).toLocaleDateString('en-US', opts)} – ${d(b).toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
};

function Initials({ name, size = 32 }: { name: string; size?: number }) {
  const init = name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span aria-hidden style={{ width: size, height: size }}
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-[#E3EEF4] text-[12px] font-bold text-[#2B5A77] ring-1 ring-[#D6E3EC]">{init}</span>
  );
}

export default function StandingsLoader({ id }: { id: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null | 'missing'>(id === DEMO_EVENT_ID ? DEMO_EVENT : null);
  const [data, setData] = useState<StandingsData | null>(id === DEMO_EVENT_ID ? demoStandings() : null);

  useEffect(() => {
    if (id === DEMO_EVENT_ID) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: rows } = await getTournamentById(encodeURIComponent(id));
        const row = rows?.[0];
        if (!row) { if (!cancelled) setEvent('missing'); return; }
        const t = dbTournamentToApp(row);
        const [regs, subs] = await Promise.all([
          getRegistrationsByTournament(t.id).catch(() => ({ data: null })),
          getSubmissionsByTournament(t.id).catch(() => ({ data: null })),
        ]);
        if (cancelled) return;
        const reg = (regs.data || []).map(dbRegistrationToApp);
        const sub = (subs.data || []).map(dbSubmissionToApp);
        const now = new Date();
        const live = now >= new Date(`${t.startDate}T00:00:00`) && now <= new Date(`${t.endDate}T23:59:59`);
        setEvent(eventFromTournament(t, null, reg.length));
        setData(realStandings(reg, sub, live));
      } catch {
        if (!cancelled) setEvent('missing');
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (event && event !== 'missing') document.title = `${event.name} Standings | HOOX`;
  }, [event]);

  return (
    <PublicLayout bgClassName="bg-hoox-mist">
      {event === null || (event !== 'missing' && !data) ? (
        <div className="font-roboto flex min-h-[60vh] items-center justify-center text-[#7586A0]"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading standings…</div>
      ) : event === 'missing' ? (
        <div className="font-roboto mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
          <Trophy className="mb-3 h-10 w-10 text-[#B7D9EB]" />
          <h1 className="text-[22px] font-bold text-[#0D1B4C]">Tournament not found</h1>
          <button type="button" onClick={() => router.push(toPath('tournaments'))} className="mt-4 font-semibold text-[#0E7C7B] hover:underline">Browse tournaments</button>
        </div>
      ) : (
        <Standings e={event} data={data!} />
      )}
    </PublicLayout>
  );
}

function Standings({ e, data }: { e: EventDetail; data: StandingsData }) {
  const { currentUser } = useAuth();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [shown, setShown] = useState(PAGE);
  const [flash, setFlash] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const u = data.unit;
  const fmt = (n?: number) => (n === undefined ? '–' : `${n.toFixed(2)} ${u}`);

  const rows = data.rows;
  const weighed = rows.filter((r) => r.rank !== null);
  const leader = weighed[0];
  const totalFish = rows.reduce((n, r) => n + r.fish, 0);
  const big = weighed.reduce<Standing | null>((m, r) => ((r.bigFish ?? 0) > (m?.bigFish ?? 0) ? r : m), null);
  const mine = currentUser ? rows.find((r) => r.angler.toLowerCase() === currentUser.name?.toLowerCase()) : undefined;

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((r) =>
      (filter === 'all' || (filter === 'weighed' ? r.rank !== null : r.rank === null)) &&
      (!t || r.angler.toLowerCase().includes(t) || (r.hometown || '').toLowerCase().includes(t)));
  }, [rows, q, filter]);
  const searching = q.trim() !== '';
  const visible = searching ? filtered : filtered.slice(0, shown);

  const jumpTo = (name: string) => {
    setQ(''); setFilter('all');
    const idx = rows.findIndex((r) => r.angler === name);
    setShown((s) => Math.max(s, Math.ceil((idx + 1) / PAGE) * PAGE));
    setFlash(name);
    requestAnimationFrame(() => requestAnimationFrame(() =>
      document.getElementById(`row-${slug(name)}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })));
    setTimeout(() => setFlash(null), 2600);
  };

  const avatar = (r: Standing, size: number) =>
    data.boardId && r.avatarIndex !== undefined ? <Avatar boardId={data.boardId} index={r.avatarIndex} size={size} /> : <Initials name={r.angler} size={size} />;

  return (
    <div className="font-roboto mx-auto max-w-[1440px] px-4 pb-14 pt-6 sm:px-6 lg:px-[42px]">
      <Link href={`/tournaments/${encodeURIComponent(e.id)}`} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0E7C7B] hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to {e.name}
      </Link>

      {/* Header */}
      <header className="mt-4 rounded-lg bg-gradient-to-br from-[#0A2A47] via-[#0B3552] to-[#0E5A6E] px-6 py-7 text-white shadow-[0_6px_20px_rgba(5,30,60,0.18)] sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          {data.live ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5484D] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.03em]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white motion-reduce:animate-none" /> Live
            </span>
          ) : (
            <span className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.03em]">{weighed.length ? 'Final standings' : 'Standings'}</span>
          )}
          <span className="text-[13px] text-white/75">{data.live ? 'Updates as catches are approved' : ''}</span>
        </div>
        <h1 className="mt-3 font-montserrat text-[30px] font-bold leading-tight sm:text-[38px]">{e.name} Standings</h1>
        <p className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[15px] text-white/85">
          <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{fmtDates(e.startDate, e.endDate)}</span>
          <span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{e.locationName}</span>
        </p>
      </header>

      {/* Stats */}
      <ul className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Users, label: 'Anglers registered', value: rows.length.toLocaleString() },
          { icon: Scale, label: 'Weighed in', value: weighed.length.toLocaleString() },
          { icon: Fish, label: 'Fish caught', value: totalFish.toLocaleString() },
          { icon: Trophy, label: 'Big fish', value: big ? fmt(big.bigFish) : '–', sub: big?.angler },
        ].map((s) => (
          <li key={s.label} className="flex items-center gap-3 rounded-lg border border-[#E8EEF4] bg-white p-4 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-[#E6F4F5] text-[#0E7C7B]"><s.icon className="h-5 w-5" /></span>
            <span className="min-w-0">
              <span className={`block font-montserrat text-[20px] font-bold leading-tight ${INK}`}>{s.value}</span>
              <span className="block truncate text-[13px] text-[#6B7D93]">{s.label}{s.sub ? ` · ${s.sub}` : ''}</span>
            </span>
          </li>
        ))}
      </ul>

      {/* Your rank */}
      {mine && (
        <div className="mt-5 flex flex-wrap items-center gap-4 rounded-lg border border-[#9FD3D3] bg-[#F1F9F9] px-5 py-4">
          {avatar(mine, 40)}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[#0E7C7B]">Your standing</p>
            <p className={`text-[17px] font-bold ${INK}`}>
              {mine.rank ? <>#{mine.rank} of {weighed.length} · {fmt(mine.total)}</> : 'No weigh-in yet'}
              {mine.rank && leader && mine.rank > 1 && <span className="ml-2 text-[14px] font-medium text-[#5F7896]">{(leader.total! - mine.total!).toFixed(2)} {u} behind the leader</span>}
            </p>
          </div>
          <button type="button" onClick={() => jumpTo(mine.angler)} className="flex items-center gap-1.5 rounded-md border border-[#1FA3A6] bg-white px-4 py-2 text-[14px] font-semibold text-[#0E7C7B] hover:bg-[#EEF9F8]">
            <Crosshair className="h-4 w-4" /> Show me in the list
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-[380px]">
          <span className="sr-only">Find an angler</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5F7896]" />
          <input type="search" value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Find an angler or hometown"
            className="h-[48px] w-full rounded-md border border-[#D9E3EC] bg-white pl-12 pr-10 text-[15px] text-[#1F2D3D] shadow-sm placeholder:text-[#7D8BA0] focus:border-hoox-ui focus:outline-none focus:ring-2 focus:ring-hoox-ui/40 [&::-webkit-search-cancel-button]:hidden" />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#5F7896] hover:text-[#0D1B4C]"><X className="h-4 w-4" /></button>}
        </label>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter anglers">
          {([['all', `All (${rows.length})`], ['weighed', `Weighed in (${weighed.length})`], ['waiting', `No weigh-in yet (${rows.length - weighed.length})`]] as [Filter, string][]).map(([f, label]) => (
            <button key={f} type="button" onClick={() => { setFilter(f); setShown(PAGE); }} aria-pressed={filter === f}
              className={`rounded-full px-3.5 py-1.5 text-[13.5px] font-medium transition ${filter === f ? 'bg-[#0E7C7B] text-white' : 'bg-white text-[#3E5067] ring-1 ring-[#D9E3EC] hover:bg-[#F2F7FA]'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div ref={tableRef} className="mt-4 overflow-hidden rounded-lg border border-[#E8EEF4] bg-white shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
        {rows.length === 0 ? (
          <p className="px-6 py-14 text-center text-[15px] text-[#536B84]">No anglers have registered yet. Standings will appear here once the tournament starts.</p>
        ) : visible.length === 0 ? (
          <p className="px-6 py-14 text-center text-[15px] text-[#536B84]">No anglers match “{q}”.</p>
        ) : (
          <div role="table" aria-label={`${e.name} full standings`}>
            <div role="row" className="sticky top-0 z-10 hidden grid-cols-[64px_minmax(0,1fr)_70px_120px_130px_120px] border-b border-[#EDF1F5] bg-[#F7FAFC] px-5 py-3 text-[11.5px] font-semibold uppercase tracking-[0.03em] text-[#7A8BA3] md:grid">
              <span role="columnheader">Rank</span>
              <span role="columnheader">Angler</span>
              <span role="columnheader" className="text-center">Fish</span>
              <span role="columnheader" className="text-right">Big Fish</span>
              <span role="columnheader" className="text-right">{data.metricLabel}</span>
              <span role="columnheader" className="text-right">Behind</span>
            </div>
            {visible.map((r) => {
              const isMine = mine?.angler === r.angler;
              const gap = r.rank && leader && r.rank > 1 ? `-${(leader.total! - r.total!).toFixed(2)}` : r.rank === 1 ? 'Leader' : '–';
              return (
                <div role="row" key={r.angler} id={`row-${slug(r.angler)}`}
                  className={`grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-[#EEF2F6] px-4 py-3 transition-colors last:border-0 md:grid-cols-[64px_minmax(0,1fr)_70px_120px_130px_120px] md:gap-x-0 md:px-5 md:py-2.5
                    ${flash === r.angler ? 'bg-[#FFF6D6]' : isMine ? 'bg-[#F1F9F9]' : r.rank && r.rank <= 3 ? 'bg-[#FBFCFE]' : ''}`}>
                  <span role="cell" className="flex justify-start">
                    {r.rank ? <RankBadge rank={r.rank} compact /> : <span className="text-[13px] text-[#9AA9BA]">–</span>}
                  </span>
                  <span role="cell" className="flex min-w-0 items-center gap-3">
                    {avatar(r, 32)}
                    <span className="min-w-0">
                      <a href={anglerHref(r.angler)} className={`block truncate text-[15px] font-medium ${INK} hover:text-[#0F6E86] hover:underline`}>
                        {r.angler}{isMine && <span className="ml-1.5 rounded bg-[#0E7C7B] px-1.5 py-0.5 text-[10.5px] font-bold uppercase text-white">You</span>}
                      </a>
                      <span className="block truncate text-[12.5px] text-[#7A8BA3]">
                        {r.hometown}
                        {/* Phone layout: stats under the name */}
                        <span className="md:hidden">{r.hometown ? ' · ' : ''}{r.fish} fish{r.bigFish ? ` · big ${r.bigFish.toFixed(2)}` : ''}</span>
                      </span>
                    </span>
                  </span>
                  <span role="cell" className="hidden text-center text-[14px] text-[#2A3B55] md:block">{r.fish || '–'}</span>
                  <span role="cell" className="hidden text-right text-[14px] text-[#2A3B55] md:block">{fmt(r.bigFish)}</span>
                  <span role="cell" className={`text-right text-[14.5px] font-semibold ${INK}`}>{r.rank ? fmt(r.total) : <span className="text-[12.5px] font-normal text-[#9AA9BA]">Not weighed in</span>}</span>
                  <span role="cell" className={`hidden text-right text-[13.5px] md:block ${r.rank === 1 ? 'font-semibold text-[#0E7C7B]' : 'text-[#5F7896]'}`}>{gap}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!searching && filtered.length > shown && (
        <div className="mt-5 flex flex-col items-center gap-2">
          <button type="button" onClick={() => setShown((s) => s + PAGE)} className="h-[46px] rounded-md border border-[#1FA3A6] bg-white px-6 text-[15px] font-semibold text-[#0E7C7B] hover:bg-[#EEF9F8]">
            Show {Math.min(PAGE, filtered.length - shown)} more
          </button>
          <span className="text-[13px] text-[#6B7D93]">Showing {shown} of {filtered.length} anglers</span>
        </div>
      )}
      {data.unit === 'in' && weighed.length > 0 && (
        <p className="mt-4 text-center text-[12.5px] text-[#7A8BA3]">Totals are the sum of each angler’s approved catches. Ties are broken by biggest fish.</p>
      )}
    </div>
  );
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
