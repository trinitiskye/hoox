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
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const navigate = (view: string) => router.push(toPath(view));

  useEffect(() => { fetchTournaments().then(setTournaments); }, []);

  return (
    <PublicLayout>
      <TournamentsPage tournaments={tournaments} onNavigate={navigate} />
    </PublicLayout>
  );
}
