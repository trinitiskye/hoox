'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import FeaturedTournamentHero from '@/components/listing/FeaturedTournamentHero';
import LeaderboardSection from '@/components/home/LeaderboardSection';
import { fetchTournaments } from '@/lib/storage';
import { toPath } from '@/lib/routes';
import { Tournament } from '@/types';

// /leaderboards — Featured Tournament hero, then live/upcoming/past leaderboards
export default function Page() {
  const router = useRouter();
  const navigate = (view: string) => router.push(toPath(view));
  const [tournaments, setTournaments] = useState<Tournament[] | null>(null);
  useEffect(() => {
    fetchTournaments().then(setTournaments).catch(() => setTournaments([]));
  }, []);

  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <div className="font-roboto mx-auto max-w-[1440px] px-4 pb-12 pt-8 sm:px-6 lg:px-[42px] lg:pt-[34px]">
        <FeaturedTournamentHero tournaments={tournaments} className="mb-8" />
        <h1 className="mb-6 font-montserrat text-[34px] font-bold leading-tight text-[#0D1B4C] sm:text-[46px]">Leaderboards</h1>
        <LeaderboardSection onNavigate={navigate} standalone />
      </div>
    </PublicLayout>
  );
}
