'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import TournamentsPage from '@/components/pages/TournamentsPage';
import { toPath } from '@/lib/routes';
import { fetchTournaments } from '@/lib/storage';
import { Tournament } from '@/types';

export default function Page() {
  const router = useRouter();
  // null while loading so the page doesn't flash demo content
  const [tournaments, setTournaments] = useState<Tournament[] | null>(null);
  const navigate = (view: string) => router.push(toPath(view));

  useEffect(() => {
    fetchTournaments().then(setTournaments).catch(() => setTournaments([]));
  }, []);

  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <TournamentsPage tournaments={tournaments} onNavigate={navigate} />
    </PublicLayout>
  );
}
