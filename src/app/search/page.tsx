'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search as SearchIcon, User as UserIcon } from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import TournamentCard from '@/components/tournament/TournamentCard';
import { fetchTournaments, fetchUsers } from '@/lib/storage';
import { toPath } from '@/lib/routes';
import { Tournament, User } from '@/types';

const SEARCH_TYPES = ['tournaments', 'series', 'clubs', 'directors', 'anglers'] as const;
type SearchType = (typeof SEARCH_TYPES)[number];

export default function SearchPage() {
  return (
    <Suspense fallback={
      <PublicLayout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </PublicLayout>
    }>
      <SearchResults />
    </Suspense>
  );
}

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawType = (searchParams.get('type') || 'tournaments').toLowerCase();
  const type: SearchType = (SEARCH_TYPES as readonly string[]).includes(rawType) ? (rawType as SearchType) : 'tournaments';
  const query = searchParams.get('q') || '';

  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const navigate = (view: string) => router.push(toPath(view));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchTournaments(), fetchUsers()]).then(([t, u]) => {
      if (cancelled) return;
      setTournaments(t);
      setUsers(u);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const q = query.trim().toLowerCase();
  const matches = (...fields: (string | undefined)[]) =>
    !q || fields.some(f => (f || '').toLowerCase().includes(q));

  const tournamentResults = type === 'tournaments'
    ? tournaments.filter(t => matches(t.name, t.location, t.city, t.state, t.species))
    : [];

  const directorResults = type === 'directors'
    ? users.filter(u => u.role === 'director' && matches(u.name, u.organization, u.city, u.state))
    : [];

  const anglerResults = type === 'anglers'
    ? users.filter(u => u.role === 'angler' && matches(u.name, u.city, u.state))
    : [];

  const isUnsupportedType = type === 'series' || type === 'clubs';
  const resultCount = tournamentResults.length + directorResults.length + anglerResults.length;

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        <div className="flex items-center gap-2 mb-2">
          <SearchIcon className="w-5 h-5 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900">
            {query ? `Search results for "${query}"` : 'Search'}
          </h1>
        </div>
        <p className="text-gray-500 mb-8 capitalize">Searching {type}</p>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : isUnsupportedType ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-700 mb-4">
              Search isn&apos;t available for {type} yet. Browse the full list instead.
            </p>
            <button
              onClick={() => navigate(type)}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition capitalize"
            >
              Browse {type}
            </button>
          </div>
        ) : resultCount === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-500">
            No {type} matched &quot;{query}&quot;.
          </div>
        ) : (
          <div className="space-y-10">
            {tournamentResults.length > 0 && (
              <section>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tournamentResults.map(t => (
                    <TournamentCard key={t.id} tournament={t} />
                  ))}
                </div>
              </section>
            )}

            {(directorResults.length > 0 || anglerResults.length > 0) && (
              <section>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...directorResults, ...anglerResults].map(u => (
                    <div key={u.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {u.organization || [u.city, u.state].filter(Boolean).join(', ') || (u.role === 'director' ? 'Tournament Director' : 'Angler')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
