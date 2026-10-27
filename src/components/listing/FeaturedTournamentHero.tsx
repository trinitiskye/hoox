'use client';

/* ------------------------------------------------------------------ */
/* Featured Tournament hero — used above the page title on Search and  */
/* the Tournament Calendar. Shows a tournament marked featured;        */
/* otherwise the next upcoming one. Demo data when there are none.     */
/* ------------------------------------------------------------------ */

import { useMemo } from 'react';
import Link from 'next/link';
import { Star, CalendarDays, Trophy, MapPin, ArrowRight, ExternalLink } from 'lucide-react';
import { fmtRange } from '@/components/listing/ListingUI';
import { DEMO as DEMO_TOURNAMENTS, fromTournament } from '@/components/pages/TournamentsPage';
import { Tournament } from '@/types';

export default function FeaturedTournamentHero({ tournaments, className = '' }: { tournaments: Tournament[] | null; className?: string }) {
  const t = useMemo(() => {
    if (tournaments === null) return null;
    const list = tournaments.length ? tournaments.map(fromTournament) : DEMO_TOURNAMENTS;
    const now = new Date();
    return (
      list.find((x) => x.featured) ??
      list.filter((x) => !x.completed && new Date(`${x.end}T23:59:59`) >= now).sort((a, b) => a.start.localeCompare(b.start))[0] ??
      null
    );
  }, [tournaments]);

  if (tournaments === null) return <div className={`h-[292px] animate-pulse rounded-lg bg-[#DCE6EE] ${className}`} aria-hidden />;
  if (!t) return null;

  const place = [t.venue, [t.city, t.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ');

  return (
    <section aria-labelledby="featured-tournament" className={`relative overflow-hidden rounded-lg bg-[#0A2A47] shadow-[0_6px_20px_rgba(5,30,60,0.18)] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={t.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-35 md:left-auto md:right-0 md:w-[56%] md:opacity-100 md:[-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_35%)] md:[mask-image:linear-gradient(90deg,transparent_0%,#000_35%)]"
      />
      <div className="relative z-10 flex flex-col gap-6 px-6 py-7 sm:px-10 md:min-h-[292px] md:flex-row md:items-end md:justify-between">
        <div className="max-w-[640px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E4F63] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.02em] text-[#3FD6D0]">
            <Star className="h-3.5 w-3.5" fill="currentColor" strokeWidth={1.5} /> Featured Tournament
          </span>
          <h2 id="featured-tournament" className="mt-4 font-montserrat text-[26px] font-bold leading-tight text-white sm:text-[32px]">{t.name}</h2>
          {t.sponsor &&
            (t.sponsorUrl ? (
              <a href={t.sponsorUrl} target="_blank" rel="noopener noreferrer sponsored" className="mt-1 inline-flex items-center gap-1.5 text-[16px] font-medium text-[#3FD6D0] hover:underline">
                Presented by {t.sponsor}
                <ExternalLink className="h-[0.95em] w-[0.95em]" strokeWidth={2} aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : (
              <p className="mt-1 text-[16px] font-medium text-[#3FD6D0]">Presented by {t.sponsor}</p>
            ))}
          <p className="mt-4 max-w-[560px] text-[16px] leading-[26px] text-white/90">{t.about}</p>
          <p className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2 text-[16px] text-white">
            <span className="flex items-center gap-2.5"><CalendarDays className="h-5 w-5" strokeWidth={1.75} />{fmtRange(t.start, t.end)}</span>
            {t.prizePool && <span className="flex items-center gap-2.5"><Trophy className="h-5 w-5" strokeWidth={1.75} />{t.prizePool} prize pool</span>}
            {place && <span className="flex items-center gap-2.5"><MapPin className="h-5 w-5" strokeWidth={1.75} />{place}</span>}
          </p>
        </div>
        <Link
          href={t.href}
          className="flex h-[48px] w-fit flex-shrink-0 items-center gap-4 rounded-md bg-[#22B3B5] px-7 text-[17px] font-semibold text-white shadow-[0_4px_12px_rgba(34,179,181,0.35)] transition hover:bg-[#1C9C9E]"
        >
          View tournament <ArrowRight className="h-5 w-5" strokeWidth={2} />
        </Link>
      </div>
    </section>
  );
}
