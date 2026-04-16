'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tournament, User, Submission, Registration, Series, SearchParams } from '@/types';
import {
  fetchTournaments, saveTournament, editTournament, removeTournament,
  fetchUsers, saveUser, editUser, removeUser,
  fetchRegistrations, saveRegistration, removeRegistration,
  fetchSubmissions, saveSubmission, editSubmission, removeSubmission,
  fetchSeries, saveSeries, removeSeries,
} from '@/lib/storage';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroCarousel from '@/components/layout/HeroCarousel';
import TournamentCard from '@/components/tournament/TournamentCard';
import TournamentWinners from '@/components/tournament/TournamentWinners';
import SearchDatabase from '@/components/search/SearchDatabase';
import { Trophy } from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [landingView, setLandingView] = useState('home');
  const [searchParams, setSearchParams] = useState<SearchParams>({ type: 'all', query: '' });

  // Load all data from Supabase on mount
  useEffect(() => {
    async function loadAll() {
      try {
        setIsLoading(true);
        const [t, u, s, r, sr] = await Promise.all([
          fetchTournaments(),
          fetchUsers(),
          fetchSubmissions(),
          fetchRegistrations(),
          fetchSeries(),
        ]);
        setTournaments(t);
        setUsers(u);
        setSubmissions(s);
        setRegistrations(r);
        setSeries(sr);

        // Restore session user from sessionStorage (client-only, safe)
        if (typeof window !== 'undefined') {
          const stored = sessionStorage.getItem('currentUser');
          if (stored) setCurrentUser(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Load error:', err);
        setError('Failed to connect to database. Check your environment variables.');
      } finally {
        setIsLoading(false);
      }
    }
    loadAll();
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') sessionStorage.removeItem('currentUser');
    setLandingView('home');
  }, []);

  const handleSearch = useCallback((params: SearchParams) => {
    setSearchParams(params);
    setLandingView('search-results');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading FishTournament Pro...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-700 mb-2">Database Connection Error</h2>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Search results view
  if (landingView === 'search-results') {
    const query = searchParams.query.toLowerCase();
    const type = searchParams.type;
    let results: any[] = [];

    if (type === 'all' || type === 'tournaments') {
      results = [...results, ...tournaments
        .filter(t => t.name.toLowerCase().includes(query) || t.location?.toLowerCase().includes(query))
        .map(t => ({ ...t, resultType: 'tournament' }))];
    }
    if (type === 'all' || type === 'directors') {
      results = [...results, ...users
        .filter(u => u.role === 'director' && (u.name.toLowerCase().includes(query) || u.organization?.toLowerCase().includes(query)))
        .map(u => ({ ...u, resultType: 'director' }))];
    }
    if (type === 'all' || type === 'anglers') {
      results = [...results, ...users
        .filter(u => u.role === 'angler' && u.name.toLowerCase().includes(query))
        .map(u => ({ ...u, resultType: 'angler' }))];
    }
    if (type === 'all' || type === 'series') {
      results = [...results, ...series
        .filter(s => s.name.toLowerCase().includes(query))
        .map(s => ({ ...s, resultType: 'series' }))];
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex flex-col">
        <Header currentUser={currentUser} onNavigate={setLandingView} onLogout={handleLogout} />
        <div className="flex-grow py-8 px-4 md:px-8 max-w-7xl mx-auto w-full">
          <div className="mb-6">
            <button onClick={() => setLandingView('home')} className="text-blue-600 hover:text-blue-800 font-semibold">
              ← Back to Home
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Search Results</h1>
          <p className="text-gray-600 mb-6">
            Searching for: <span className="font-semibold">{searchParams.query}</span> in{' '}
            <span className="font-semibold capitalize">{searchParams.type === 'all' ? 'All Categories' : searchParams.type}</span>
          </p>

          {results.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 text-lg">No results found</p>
              <p className="text-gray-500 mt-2">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">Found {results.length} result{results.length !== 1 ? 's' : ''}</p>
              <div className="space-y-4">
                {results.map((result, i) => (
                  <div key={`${result.resultType}-${result.id}-${i}`} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    {result.resultType === 'tournament' && (
                      <div>
                        <span className="text-xs font-semibold text-blue-600 uppercase">Tournament</span>
                        <h3 className="text-xl font-bold text-gray-900 mt-2">{result.name}</h3>
                        {result.location && <p className="text-gray-600 mt-1">{result.location}</p>}
                        {result.startDate && <p className="text-gray-500 text-sm mt-1">{result.startDate}</p>}
                      </div>
                    )}
                    {result.resultType === 'director' && (
                      <div>
                        <span className="text-xs font-semibold text-purple-600 uppercase">Tournament Director</span>
                        <h3 className="text-xl font-bold text-gray-900 mt-2">{result.name}</h3>
                        {result.organization && <p className="text-gray-600 mt-1">{result.organization}</p>}
                      </div>
                    )}
                    {result.resultType === 'angler' && (
                      <div>
                        <span className="text-xs font-semibold text-green-600 uppercase">Angler</span>
                        <h3 className="text-xl font-bold text-gray-900 mt-2">{result.name}</h3>
                      </div>
                    )}
                    {result.resultType === 'series' && (
                      <div>
                        <span className="text-xs font-semibold text-orange-600 uppercase">Series</span>
                        <h3 className="text-xl font-bold text-gray-900 mt-2">{result.name}</h3>
                        {result.description && <p className="text-gray-600 mt-1">{result.description}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <Footer onNavigate={setLandingView} />
      </div>
    );
  }

  // Home view
  const now = new Date();
  const upcomingTournaments = tournaments
    .filter(t => new Date(t.startDate) > now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 9);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex flex-col">
      <Header currentUser={currentUser} onNavigate={setLandingView} onLogout={handleLogout} />
      <HeroCarousel />

      <div className="flex-grow py-4 md:py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 mb-12">
            {/* Left - Tournaments */}
            <div className="w-full lg:w-[70%]">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Upcoming Tournaments</h2>
              {upcomingTournaments.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No upcoming tournaments. Check back soon!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {upcomingTournaments.map(t => (
                    <TournamentCard key={t.id} tournament={t} />
                  ))}
                </div>
              )}

              <div className="mt-8 md:mt-12">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Tournament Winners</h2>
                <TournamentWinners tournaments={tournaments} submissions={submissions} users={users} />
              </div>
            </div>

            {/* Right - Search */}
            <div className="w-full lg:w-[30%]">
              <SearchDatabase onSearch={handleSearch} />
            </div>
          </div>
        </div>
      </div>

      <Footer onNavigate={setLandingView} />
    </div>
  );
}
