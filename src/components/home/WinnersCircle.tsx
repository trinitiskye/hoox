'use client';

/* ------------------------------------------------------------------ */
/* Winners Circle — first-place cards on the home page.                */
/* Each card: tournament, anglers & fish caught, time left (live) or   */
/* final date, the winning catch photo with a 1st Place label, and the */
/* angler with species and total. Demo data comes from the same boards */
/* as the Leaderboards section. Submission photos show the fish on a   */
/* measuring board with the tournament code written on the angler's    */
/* hand; until real ones exist, an illustrated placeholder is shown.   */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Trophy, Clock, Fish, Users } from 'lucide-react';
import { BOARDS, Avatar } from '@/components/home/LeaderboardSection';
import { anglerHref } from '@/lib/anglerLinks';
import SubmissionIllustration, { type FishLook } from '@/components/home/SubmissionIllustration';

interface Winner {
  boardId: string;
  species: string;
  anglers: number;
  fishCaught: number;
  photo?: string; // the winning submission photo (fish on the board, code on the hand)
  look: FishLook; // illustration style when there's no photo yet
  code: string; // tournament code written on the angler's hand
  inches: number; // biggest fish length shown on the board
  endsInHours?: number; // live events: hours left (demo)
  finalDate?: string; // completed events
  timezone: string;
}

const WINNERS: Winner[] = [
  { boardId: 'lakefront-classic', species: 'Largemouth Bass', anglers: 156, fishCaught: 412, look: 'largemouth', code: 'HX-7Q2', inches: 21.5, endsInHours: 105.04, timezone: 'Eastern Time' },
  { boardId: 'riverside-open', species: 'Striped Bass', anglers: 128, fishCaught: 297, look: 'striped', code: 'RV-3K8', inches: 26, endsInHours: 30.6, timezone: 'Eastern Time' },
  { boardId: 'mountain-lake-shootout', species: 'Smallmouth Bass', anglers: 94, fishCaught: 238, look: 'smallmouth', code: 'ML-52W', inches: 19.75, finalDate: 'Jul 14, 2025', timezone: 'Eastern Time' },
  { boardId: 'bayou-brawl', species: 'Largemouth Bass', anglers: 172, fishCaught: 466, look: 'largemouth', code: 'BB-8H1', inches: 23.25, finalDate: 'Aug 4, 2025', timezone: 'Central Time' },
];

function timeLeft(ms: number) {
  if (ms <= 0) return 'Final weigh-in';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${d ? `${d}d ` : ''}${h}h ${m}m ${String(sec).padStart(2, '0')}s left`;
}

function WinnerCard({ w, now, start }: { w: Winner; now: number | null; start: number }) {
  const b = BOARDS.find((x) => x.id === w.boardId);
  const [imgOk, setImgOk] = useState(true);
  if (!b) return null;
  const top = [...b.rows].filter((r) => r.weight !== undefined).sort((x, y) => (y.weight ?? 0) - (x.weight ?? 0))[0];
  if (!top) return null;
  const topIndex = b.rows.indexOf(top);
  const live = b.status === 'live';
  const href = '/tournaments/lakefront-classic#leaderboard'; // demo boards open the demo event page

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-[#E8EEF4] bg-white p-[7px] shadow-[0_2px_10px_rgba(10,30,60,0.06)]">
      {/* Winning catch */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-gradient-to-br from-[#0A2A47] to-[#0E5A6E]">
        {w.photo && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={w.photo}
            alt={`${top.angler}'s winning ${w.species.toLowerCase()} submission`}
            loading="lazy"
            onError={() => setImgOk(false)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <SubmissionIllustration look={w.look} code={w.code} inches={w.inches} className="absolute inset-0 h-full w-full" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,18,36,0.45)_0%,rgba(4,18,36,0)_28%,rgba(4,18,36,0)_50%,rgba(4,18,36,0.85)_100%)]" />

        <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDBB66] px-3 py-[5px] font-montserrat text-[13px] font-bold uppercase tracking-[0.04em] text-[#3B2A08] shadow-sm">
            <Trophy className="h-4 w-4" fill="currentColor" strokeWidth={1.5} /> 1st Place
          </span>
          {live ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2E8C86]/95 px-3 py-[5px] text-[12px] font-semibold text-white shadow-sm">
              <span className="relative flex h-[7px] w-[7px]" aria-hidden>
                <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 motion-safe:animate-ping" />
                <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-white" />
              </span>
              LIVE
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-[#7A8794]/85 px-3 py-[5px] text-[12px] font-semibold text-white shadow-sm backdrop-blur-sm">FINAL</span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-3.5">
          <span className="flex-shrink-0 rounded-full ring-[3px] ring-white">
            <Avatar boardId={b.id} index={topIndex} size={52} />
          </span>
          <div className="min-w-0 text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]">
            <a href={anglerHref(top.angler)} className="block truncate font-montserrat text-[20px] font-bold leading-tight hover:underline">{top.angler}</a>
            <p className="truncate text-[14px] font-medium text-white/95">{w.species} · Total {top.weight?.toFixed(2)} lb</p>
          </div>
        </div>
      </div>

      {/* Tournament */}
      <div className="px-[10px] pb-[4px] pt-[14px] text-center">
        <h3 className="line-clamp-2 font-montserrat text-[19px] font-bold uppercase leading-tight tracking-[0.01em] text-[#0D1B4C]">{b.name}</h3>
        <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 text-[15px] font-medium text-[#3E5675]">
          <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-[#0D1B4C]" fill="currentColor" strokeWidth={1.5} />{w.anglers} Anglers</span>
          <span aria-hidden className="text-[#9AA8B8]">•</span>
          <span className="inline-flex items-center gap-1.5"><Fish className="h-4 w-4 text-[#0D1B4C]" strokeWidth={2} />{w.fishCaught} Fish Caught</span>
        </p>
      </div>

      <div className="px-[5px] pb-[5px] pt-[10px]">
        <Link
          href={href}
          className="flex w-full flex-col items-center justify-center rounded-md border border-[#1FA3A6] px-3 py-[7px] text-center text-[#0E7C7B] transition hover:bg-[#EEF9F8]"
        >
          <span className="flex items-center gap-2 text-[14px] font-semibold">
            {live ? 'View live leaderboard' : 'View final results'} <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </span>
          {/* Countdown (live) or final date, with time zone */}
          <span className={`mt-0.5 flex items-center gap-1.5 text-[12.5px] ${live ? 'font-medium text-[#0E7C7B]' : 'text-[#5F7896]'}`}>
            {live && <Clock className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2.25} />}
            <span suppressHydrationWarning>
              {live
                ? now === null ? 'In progress' : timeLeft(start + (w.endsInHours ?? 0) * 3600_000 - now)
                : `Final · ${w.finalDate}`}
              {' · '}{w.timezone}
            </span>
          </span>
        </Link>
      </div>
    </article>
  );
}

export default function WinnersCircle({ onNavigate }: { onNavigate: (view: string) => void }) {
  // Live countdowns tick every second (client only, avoids hydration mismatch)
  const [now, setNow] = useState<number | null>(null);
  const [start] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section aria-labelledby="winners-heading" className="rounded-lg bg-white px-3 sm:px-[12px] pt-[12px] pb-[12px] shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-[13px]">
        <h2 id="winners-heading" className="text-[28px] font-bold leading-tight text-hoox-ink">Winners Circle</h2>
        <button
          onClick={() => onNavigate('search?type=tournaments&status=Completed&search=1')}
          className="flex items-center gap-2 text-[17px] font-medium text-[#016F8C] hover:text-hoox-brand transition"
        >
          View all results <ArrowRight className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-[13px] sm:grid-cols-2 xl:grid-cols-4">
        {WINNERS.map((w) => <WinnerCard key={w.boardId} w={w} now={now} start={start} />)}
      </div>
    </section>
  );
}
