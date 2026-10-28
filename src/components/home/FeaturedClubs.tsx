'use client';

/* ------------------------------------------------------------------ */
/* Featured Clubs — a row of featured fishing clubs on the home page.  */
/* Uses the same club cards and details window as the Clubs page.      */
/* ------------------------------------------------------------------ */

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { CLUBS, ClubCard, ClubDialog, type Club } from '@/components/pages/ClubsPage';

const MAX_FEATURED = 4;

export default function FeaturedClubs({ onNavigate }: { onNavigate: (view: string) => void }) {
  const [open, setOpen] = useState<Club | null>(null);
  const featured = CLUBS.filter((c) => c.featured).slice(0, MAX_FEATURED);
  if (featured.length === 0) return null;

  return (
    <section aria-labelledby="featured-clubs-heading" className="rounded-lg bg-white px-3 sm:px-[12px] pt-[12px] pb-[12px] shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-[13px]">
        <h2 id="featured-clubs-heading" className="text-[28px] font-bold leading-tight text-hoox-ink">Featured Clubs</h2>
        <button
          onClick={() => onNavigate('clubs')}
          className="flex items-center gap-2 text-[17px] font-medium text-[#016F8C] hover:text-hoox-brand transition"
        >
          View all clubs <ArrowRight className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>
      <ul className="grid grid-cols-1 gap-[13px] sm:grid-cols-2 xl:grid-cols-4">
        {featured.map((c) => (
          <ClubCard key={c.id} c={c} onOpen={() => setOpen(c)} showFeatured />
        ))}
      </ul>
      {open && <ClubDialog club={open} onClose={() => setOpen(null)} onNavigate={onNavigate} />}
    </section>
  );
}
