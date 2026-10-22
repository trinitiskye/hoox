'use client';

import { useMemo, useState } from 'react';
import {
  Search, List, Clock, Trophy, MapPin, CalendarDays, ChevronDown, LayoutGrid, ArrowRight,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Demo leaderboard data (matches the Leaderboard mock).               */
/* Replace with Supabase standings when the leaderboard API is ready.  */
/* ------------------------------------------------------------------ */

type Status = 'live' | 'upcoming' | 'completed';

interface Row {
  angler: string;
  boat: string;
  fish: number;
  weight?: number; // lbs; undefined = not weighed yet
}

interface Board {
  id: string;
  name: string;
  location: string;
  dates: string;
  start: string; // ISO date, used for sorting
  status: Status;
  banner: string;
  rows: Row[];
}

const r = (angler: string, boat: string, weight?: number): Row => ({ angler, boat, fish: 5, weight });

const BOARDS: Board[] = [
  {
    id: 'lakefront-classic', name: 'Lakefront Classic', location: 'Lake Hartwell, GA', dates: 'May 17 – 19, 2025',
    start: '2025-05-17', status: 'live', banner: '/home/leaderboard/lakefront-classic.jpg',
    rows: [
      r('Mike Reynolds', 'B12', 18.24), r('Jason Miller', 'C27', 17.96), r('Tyler Greene', 'A08', 17.62),
      r('Chris Dalton', 'B19', 17.41), r('Robert Hayes', 'C11', 17.28), r('Daniel Brooks', 'A23', 16.97),
      r('Matt Turner', 'B34', 16.73), r('Ethan Powell', 'C05', 16.58), r('Ryan Clark', 'A17', 16.21),
      r('Justin Ward', 'B28', 15.96),
    ],
  },
  {
    id: 'riverside-open', name: 'Riverside Open', location: 'Santee Cooper Lakes, SC', dates: 'Jun 7 – 9, 2025',
    start: '2025-06-07', status: 'live', banner: '/home/leaderboard/riverside-open.jpg',
    rows: [
      r('Marcus Lee', 'D14', 19.87), r('Caleb Foster', 'E03', 19.21), r('Nate Simmons', 'D27', 18.96),
      r('Cole Bennett', 'E11', 18.43), r('Aaron James', 'D08', 17.98), r('Luke Sanders', 'E22', 17.54),
      r('Kyle Morgan', 'D31', 17.32), r('Dylan Carter', 'E16', 16.85), r('Blake Thompson', 'D05', 16.71),
      r('Travis Hall', 'E29', 16.4),
    ],
  },
  {
    id: 'coastal-challenge', name: 'Coastal Challenge', location: 'Charleston Harbor, SC', dates: 'Jun 21 – 23, 2025',
    start: '2025-06-21', status: 'upcoming', banner: '/home/leaderboard/coastal-challenge.jpg',
    rows: [
      r('Scott Jennings', 'F07'), r('Brandon Ellis', 'F22'), r('Chad Wilson', 'F11'), r('Dustin Ray', 'F19'),
      r('Trevor Mills', 'F04'), r('Cameron Price', 'F28'), r('Jared Coleman', 'F15'), r('Noah Kim', 'F32'),
      r('Gavin Scott', 'F09'), r('Logan West', 'F26'),
    ],
  },
  {
    id: 'mountain-lake-shootout', name: 'Mountain Lake Shootout', location: 'Lake Keowee, SC', dates: 'Jul 12 – 14, 2025',
    start: '2025-07-12', status: 'completed', banner: '/home/leaderboard/mountain-lake-shootout.jpg',
    rows: [
      r('Hunter Blake', 'G12', 20.66), r('Parker Shaw', 'G27', 19.94), r('Colton Reed', 'G03', 19.21),
      r('Wyatt Collins', 'G19', 18.83), r('Eli Lawson', 'G08', 18.47), r('Zachary Stone', 'G31', 18.15),
      r('Mason King', 'G14', 17.92), r('Preston Adams', 'G22', 17.65), r('Tyson Brooks', 'G05', 17.38),
      r('Austin Fields', 'G29', 17.11),
    ],
  },
  {
    id: 'bayou-brawl', name: 'Bayou Brawl', location: 'Toledo Bend, LA', dates: 'Aug 2 – 4, 2025',
    start: '2025-08-02', status: 'completed', banner: '/home/leaderboard/bayou-brawl.jpg',
    rows: [
      r('Derek James', 'H21', 20.12), r('Landon Cox', 'H09', 19.68), r('Micah Turner', 'H33', 19.14),
      r('Brady Fuller', 'H04', 18.92), r('Clayton White', 'H26', 18.47), r('Tanner Boyd', 'H17', 18.21),
      r('Ashton Cole', 'H12', 17.96), r('Cody Wells', 'H30', 17.64), r('Rhett Wallace', 'H07', 17.28),
      r('Silas Hunt', 'H24', 16.98),
    ],
  },
  {
    id: 'championship-invitational', name: 'Championship Invitational', location: 'Lake Fork, TX', dates: 'Sep 13 – 15, 2025',
    start: '2025-09-13', status: 'upcoming', banner: '/home/leaderboard/championship-invitational.jpg',
    rows: [
      r('James Matthews', 'I11'), r('Kyle Patterson', 'I25'), r('Alex Graham', 'I03'), r('Brendan Scott', 'I19'),
      r('Marcus Hill', 'I07'), r('Ryan Turner', 'I32'), r('Chase Morgan', 'I16'), r('Nathan Bell', 'I28'),
      r('Evan Ross', 'I05'), r('Hunter Miles', 'I21'),
    ],
  },
];

// Avatars come from one sprite: one row per board (in BOARDS order), 10 per row, 36px cells.
const AVATAR_SPRITE = '/home/leaderboard/avatars.jpg';
const SPRITE_INDEX: Record<string, number> = Object.fromEntries(BOARDS.map((b, i) => [b.id, i]));

type Filter = 'all' | 'live' | 'upcoming' | 'past';
type Sort = 'newest' | 'oldest' | 'name';

const SORT_LABELS: Record<Sort, string> = {
  oldest: 'Event Date (Oldest)',
  newest: 'Event Date (Newest)',
  name: 'Tournament Name',
};

/* ------------------------------ pieces ------------------------------ */

function StatusBadge({ status }: { status: Status }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2E8C86]/95 px-3 py-[5px] text-[12px] font-semibold text-white shadow-sm">
        <span className="h-[7px] w-[7px] rounded-full bg-white" /> LIVE
      </span>
    );
  }
  if (status === 'upcoming') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3471CA] px-3 py-[5px] text-[12px] font-semibold text-white shadow-sm">
        <Clock className="h-[13px] w-[13px]" strokeWidth={2.25} /> UPCOMING
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7A8794]/80 px-3 py-[5px] text-[12px] font-semibold text-white shadow-sm backdrop-blur-sm">
      <Trophy className="h-[13px] w-[13px]" fill="currentColor" strokeWidth={1.5} /> COMPLETED
    </span>
  );
}

function RankBadge({ rank, compact = false }: { rank: number; compact?: boolean }) {
  const medal =
    rank === 1 ? 'bg-[#EDBB66] text-[#3B2A08]' :
    rank === 2 ? 'bg-[#A9BCD0] text-[#1F334E]' :
    rank === 3 ? 'bg-[#D9733A] text-[#2A160A]' : '';
  const box = compact ? 'h-[22px] w-[22px] text-[12px]' : 'h-[18px] w-[18px] text-[10.5px]';
  if (!medal) return <span className={`block text-center font-bold text-[#1F334E] ${compact ? 'w-[22px] text-[13px]' : 'w-[18px] text-[12px]'}`}>{rank}</span>;
  return (
    <span className={`flex items-center justify-center rounded-full font-bold ${box} ${medal}`}>{rank}</span>
  );
}

function Avatar({ boardId, index, size = 20 }: { boardId: string; index: number; size?: number }) {
  const row = SPRITE_INDEX[boardId] ?? 0;
  // Sprite is 360x216 (10x6 cells of 36px); scale cells to `size`.
  return (
    <span
      aria-hidden
      className="block flex-shrink-0 rounded-full bg-[#DDE6EE] ring-1 ring-[#E3EAF1]"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${AVATAR_SPRITE})`,
        backgroundSize: `${size * 10}px ${size * 6}px`,
        backgroundPosition: `-${index * size}px -${row * size}px`,
      }}
    />
  );
}

function BoardBanner({ b, compact = false }: { b: Board; compact?: boolean }) {
  return (
    <header className={`relative overflow-hidden ${compact ? 'min-h-[88px]' : 'min-h-[72px]'}`}>
      <img src={b.banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,18,36,0.72)_0%,rgba(4,18,36,0.45)_55%,rgba(4,18,36,0.15)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/35 to-transparent" />
      <div className={`relative px-4 pb-[10px] ${compact ? 'pt-[18px]' : 'pt-[10px]'}`}>
        <div className={`absolute right-4 ${compact ? 'top-[19px]' : 'top-[12px]'}`}><StatusBadge status={b.status} /></div>
        <div className="min-w-0">
          <h3 className={`pr-[112px] font-bold sm:truncate leading-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)] ${compact ? 'text-[25px]' : 'text-[23px]'}`}>{b.name}</h3>
          <p className={`flex flex-wrap items-center gap-x-5 gap-y-0.5 font-medium text-white/95 ${compact ? 'mt-[6px] text-[14px]' : 'mt-[3px] text-[12.5px]'}`}>
            <span className="flex items-center gap-1.5"><MapPin className={compact ? 'h-[15px] w-[15px]' : 'h-[13px] w-[13px]'} strokeWidth={2} />{b.location}</span>
            <span className="flex items-center gap-1.5"><CalendarDays className={compact ? 'h-[15px] w-[15px]' : 'h-[13px] w-[13px]'} strokeWidth={2} />{b.dates}</span>
          </p>
        </div>
      </div>
    </header>
  );
}

const GRID = 'grid grid-cols-[28px_minmax(0,1fr)_40px_28px_74px] sm:grid-cols-[34px_minmax(0,1fr)_48px_34px_90px] items-center';

function BoardCard({ b, highlight, onStats }: { b: Board; highlight: string; onStats: () => void }) {
  const q = highlight.trim().toLowerCase();
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-[#E3ECF4] bg-white shadow-[0_1px_6px_rgba(10,30,60,0.05)]">
      <BoardBanner b={b} />

      {/* Standings */}
      <div className="px-3 pt-2" role="table" aria-label={`${b.name} top 10`}>
        <div role="row" className={`${GRID} pb-[5px] text-[10.5px] font-medium uppercase tracking-[0.02em] text-[#75869A]`}>
          <span role="columnheader" className="pl-[1px]">Rank</span>
          <span role="columnheader" className="pl-[22px]">Angler</span>
          <span role="columnheader">Boat #</span>
          <span role="columnheader">Fish</span>
          <span role="columnheader" className="whitespace-nowrap text-right pr-1">Total Weight</span>
        </div>
        {b.rows.slice(0, 10).map((row, i) => {
          const match = q && row.angler.toLowerCase().includes(q);
          return (
            <div
              role="row"
              key={row.angler}
              className={`${GRID} h-[23px] text-[13px] ${match ? 'rounded bg-[#FFF6DD]' : ''}`}
            >
              <span role="cell" className="pl-[1px]"><RankBadge rank={i + 1} /></span>
              <span role="cell" className="flex min-w-0 items-center gap-2">
                <Avatar boardId={b.id} index={i} />
                <span className="truncate text-[#1F334E]">{row.angler}</span>
              </span>
              <span role="cell" className="text-[12px] text-[#2A3B55]">{row.boat}</span>
              <span role="cell" className="text-[12px] text-[#2A3B55]">{row.fish}</span>
              <span role="cell" className="text-right pr-1 text-[12px] text-[#2A3B55]">
                {row.weight !== undefined ? `${row.weight.toFixed(2)} lb` : '-'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-auto px-3 pb-3 pt-[9px]">
        <button
          onClick={onStats}
          className="flex h-[33px] w-full items-center justify-center gap-3 rounded-md border border-[#8FCFD2] bg-[#EEF9FB] text-[13.5px] font-medium text-[#2C6374] transition hover:bg-[#E0F4F6]"
        >
          <List className="h-[17px] w-[17px]" strokeWidth={2} /> View All Stats <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </article>
  );
}

const CGRID = 'grid grid-cols-[30px_36px_minmax(0,1fr)_38px_80px] sm:grid-cols-[40px_44px_minmax(0,1fr)_64px_100px] items-center';

function CompactBoardCard({ b, highlight, onStats }: { b: Board; highlight: string; onStats: () => void }) {
  const q = highlight.trim().toLowerCase();
  const top = b.rows.slice(0, 5).map((row, i) => ({ row, rank: i + 1 }));
  // Surface searched anglers ranked below the top 5
  const extra = q
    ? b.rows.slice(5).map((row, i) => ({ row, rank: i + 6 })).filter(({ row }) => row.angler.toLowerCase().includes(q))
    : [];
  const shown = [...top, ...extra];
  const more = b.rows.length - shown.length;
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-[#E3ECF4] bg-white shadow-[0_1px_6px_rgba(10,30,60,0.05)]">
      <BoardBanner b={b} compact />

      <div className="px-4 pt-[9px]" role="table" aria-label={`${b.name} top 5`}>
        <div role="row" className={`${CGRID} border-b border-[#EDF1F5] pb-[7px] text-[11px] font-semibold uppercase tracking-[0.02em] text-[#7A8BA3]`}>
          <span role="columnheader" className="text-[#2F4A6E]">Rank</span>
          <span role="columnheader" className="col-span-2 pl-[14px] sm:pl-[22px]">Angler</span>
          <span role="columnheader" className="text-center">Fish</span>
          <span role="columnheader" className="whitespace-nowrap text-center">Total Weight</span>
        </div>
        {shown.map(({ row, rank }) => {
          const match = q && row.angler.toLowerCase().includes(q);
          return (
            <div
              role="row"
              key={row.angler}
              className={`${CGRID} h-[31px] border-b border-[#EEF2F6] text-[14px] ${match ? 'bg-[#FFF6DD]' : ''}`}
            >
              <span role="cell" className="pl-[1px]"><RankBadge rank={rank} compact /></span>
              <span role="cell"><Avatar boardId={b.id} index={rank - 1} size={26} /></span>
              <span role="cell" className="truncate text-[#1F334E]">{row.angler}</span>
              <span role="cell" className="text-center text-[#2A3B55]">{row.fish}</span>
              <span role="cell" className="text-center text-[#2A3B55]">
                {row.weight !== undefined ? `${row.weight.toFixed(2)} lb` : '-'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 px-4 pb-[14px] pt-[13px]">
        <span className="text-[14px] text-[#4A78D6]">{more > 0 ? `+${more} more anglers` : ''}</span>
        <button
          onClick={onStats}
          className="flex items-center gap-2.5 text-[14.5px] font-semibold text-[#0F6E86] transition hover:text-hoox-brand"
        >
          View Full Leaderboard <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.25} />
        </button>
      </div>
    </article>
  );
}

/* ------------------------------ section ----------------------------- */

export default function LeaderboardSection({ onNavigate }: { onNavigate: (view: string) => void }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('oldest');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const boards = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = BOARDS.filter((b) => {
      if (filter === 'live' && b.status !== 'live') return false;
      if (filter === 'upcoming' && b.status !== 'upcoming') return false;
      if (filter === 'past' && b.status !== 'completed') return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q) ||
        b.rows.some((row) => row.angler.toLowerCase().includes(q))
      );
    });
    return [...list].sort((a, b) =>
      sort === 'name' ? a.name.localeCompare(b.name) :
      sort === 'oldest' ? a.start.localeCompare(b.start) :
      b.start.localeCompare(a.start),
    );
  }, [query, filter, sort]);

  const pills: { key: Filter; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All', icon: <List className="h-[18px] w-[18px]" strokeWidth={2} /> },
    { key: 'live', label: 'Live', icon: <span className="h-[10px] w-[10px] rounded-full bg-[#2FB08A]" /> },
    { key: 'upcoming', label: 'Upcoming', icon: <Clock className="h-[16px] w-[16px]" strokeWidth={2} /> },
    { key: 'past', label: 'Past', icon: <Trophy className="h-[16px] w-[16px]" fill="currentColor" strokeWidth={1.5} /> },
  ];

  return (
    <section aria-labelledby="leaderboard-heading" className="rounded-lg bg-white px-3 sm:px-[12px] pt-[12px] pb-[12px] shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
      {/* Heading — same type as Upcoming Tournaments */}
      <div className="flex flex-wrap items-end justify-between gap-2 px-2 pb-[13px]">
        <div>
          <h2 id="leaderboard-heading" className="text-[28px] font-bold leading-tight text-hoox-ink">Leaderboard</h2>
          <p className="text-[16px] font-light text-[#869FE6]">Live standings and results from tournaments across the HOOX community.</p>
        </div>
        <button
          onClick={() => onNavigate('tournaments')}
          className="mb-4 flex items-center gap-2 text-[17px] font-medium text-[#016F8C] hover:text-hoox-brand transition"
        >
          View all results <ArrowRight className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-1 pb-[13px]">
        <label className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[240px] sm:max-w-[460px]">
          <span className="sr-only">Search tournaments, locations, or anglers</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[19px] w-[19px] -translate-y-1/2 text-[#1F334E]" strokeWidth={2} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tournaments, locations, or anglers..."
            className="h-[36px] w-full rounded-md border border-[#DDE5EC] bg-white pl-11 pr-3 text-[14px] text-hoox-text placeholder:text-[#7D8BA0] focus:border-hoox-ui focus:outline-none focus:ring-2 focus:ring-hoox-ui/40"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Status">
          <span className="mr-2 text-[14px] text-[#6F8290]">Status</span>
          {pills.map((p) => {
            const active = filter === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setFilter(p.key)}
                aria-pressed={active}
                className={`flex h-[34px] items-center gap-2 rounded-full px-[22px] text-[14px] font-semibold transition ${
                  active ? 'bg-[#388081] text-white shadow-sm' : 'bg-[#E9F1F7] text-[#1F334E] hover:bg-[#DCE8F1]'
                }`}
              >
                {p.icon}
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="flex w-full items-center gap-4 sm:ml-auto sm:w-auto">
          <label className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none">
            <span className="whitespace-nowrap text-[14px] text-[#6F8290]">Sort by</span>
            <span className="relative min-w-0 flex-1 sm:flex-none">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-[36px] w-full sm:w-[214px] appearance-none rounded-md border border-[#DDE5EC] bg-white pl-3 pr-9 text-[14px] text-[#1F334E] focus:border-hoox-ui focus:outline-none focus:ring-2 focus:ring-hoox-ui/40"
              >
                {(Object.keys(SORT_LABELS) as Sort[]).map((k) => (
                  <option key={k} value={k}>{SORT_LABELS[k]}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1F334E]" strokeWidth={2.25} />
            </span>
          </label>

          <div className="flex flex-shrink-0 overflow-hidden rounded-md border border-[#DDE5EC]" role="group" aria-label="Layout">
            <button
              onClick={() => setView('grid')}
              aria-pressed={view === 'grid'}
              aria-label="Grid view"
              className={`flex h-[34px] w-[38px] items-center justify-center transition ${view === 'grid' ? 'bg-[#388081] text-white' : 'bg-white text-[#1F334E] hover:bg-[#F1F6F9]'}`}
            >
              <LayoutGrid className="h-[17px] w-[17px]" fill={view === 'grid' ? 'currentColor' : 'none'} strokeWidth={1.75} />
            </button>
            <button
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              aria-label="List view"
              className={`flex h-[34px] w-[38px] items-center justify-center transition ${view === 'list' ? 'bg-[#388081] text-white' : 'bg-white text-[#1F334E] hover:bg-[#F1F6F9]'}`}
            >
              <List className="h-[19px] w-[19px]" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* Boards */}
      {boards.length === 0 ? (
        <div className="rounded-md border border-dashed border-[#D6E2EC] py-12 text-center text-[15px] text-[#6F8290]">
          No tournaments match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[13px]">
          {boards.map((b) =>
            view === 'grid' ? (
              <BoardCard key={b.id} b={b} highlight={query} onStats={() => onNavigate('tournaments')} />
            ) : (
              <CompactBoardCard key={b.id} b={b} highlight={query} onStats={() => onNavigate('tournaments')} />
            ),
          )}
        </div>
      )}
    </section>
  );
}
