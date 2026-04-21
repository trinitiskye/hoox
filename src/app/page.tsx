'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import HomePage from '@/components/pages/HomePage';
import { toPath } from '@/lib/routes';
import { fetchTournaments, fetchUsers, fetchSubmissions } from '@/lib/storage';
import { Tournament, User, Submission, SearchParams } from '@/types';

export default function Home() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const navigate = (view: string) => router.push(toPath(view));

  useEffect(() => {
    Promise.all([fetchTournaments(), fetchUsers(), fetchSubmissions()])
      .then(([t, u, s]) => { setTournaments(t); setUsers(u); setSubmissions(s); });
  }, []);

  const handleSearch = (params: SearchParams) => {
    router.push(`/search?type=${params.type}&q=${encodeURIComponent(params.query)}`);
  };

  return (
    <PublicLayout>
      <HomePage
        tournaments={tournaments}
        users={users}
        submissions={submissions}
        onNavigate={navigate}
        onSearch={handleSearch}
      />
    </PublicLayout>
  );
}
