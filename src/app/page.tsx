'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tournament, User, Submission, Registration, Series, SearchParams } from '@/types';
import {
  fetchTournaments, fetchUsers, fetchRegistrations,
  fetchSubmissions, fetchSeries,
} from '@/lib/storage';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HomePage from '@/components/pages/HomePage';
import SignUpPage from '@/components/pages/SignUpPage';
import SeriesPage from '@/components/pages/SeriesPage';
import TournamentsPage from '@/components/pages/TournamentsPage';
import ClubsPage from '@/components/pages/ClubsPage';
import EventsPage from '@/components/pages/EventsPage';
import FeaturesPage from '@/components/pages/FeaturesPage';
import PartnerPage from '@/components/pages/PartnerPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState('home');
  const [searchParams, setSearchParams] = useState<SearchParams>({ type: 'all', query: '' });

  useEffect(() => {
    async function loadAll() {
      try {
        setIsLoading(true);
        const [t, u, s, r, sr] = await Promise.all([
          fetchTournaments(), fetchUsers(), fetchSubmissions(),
          fetchRegistrations(), fetchSeries(),
        ]);
        setTournaments(t);
        setUsers(u);
        setSubmissions(s);
        setRegistrations(r);
        setSeries(sr);
        if (typeof window !== 'undefined') {
          const stored = sessionStorage.getItem('currentUser');
          if (stored) setCurrentUser(JSON.parse(stored));
        }
      } catch (err) {
        setError('Failed to connect to database.');
      } finally {
        setIsLoading(false);
      }
    }
    loadAll();
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') sessionStorage.removeItem('currentUser');
    setView('home');
  }, []);

  const handleSearch = useCallback((params: SearchParams) => {
    setSearchParams(params);
    setView('search-results');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading HOOX...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-700 mb-2">Database Connection Error</h2>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (view) {
      case 'register':
        return <SignUpPage onNavigate={setView} />;
      case 'series':
        return <SeriesPage onNavigate={setView} />;
      case 'tournaments':
        return <TournamentsPage tournaments={tournaments} onNavigate={setView} />;
      case 'clubs':
        return <ClubsPage onNavigate={setView} />;
      case 'events':
        return <EventsPage onNavigate={setView} />;
      case 'features':
        return <FeaturesPage onNavigate={setView} />;
      case 'sponsor':
        return <PartnerPage onNavigate={setView} />;
      case 'search-results': {
        const query = searchParams.query.toLowerCase();
        const type = searchParams.type;
        let results: any[] = [];
        if (type === 'all' || type === 'tournaments') {
          results = [...results, ...tournaments.filter(t =>
            t.name.toLowerCase().includes(query) || t.location?.toLowerCase().includes(query)
          ).map(t => ({ ...t, resultType: 'tournament' }))];
        }
        if (type === 'all' || type === 'directors') {
          results = [...results, ...users.filter(u =>
            u.role === 'director' && (u.name.toLowerCase().includes(query) || u.organization?.toLowerCase().includes(query))
          ).map(u => ({ ...u, resultType: 'director' }))];
        }
        if (type === 'all' || type === 'anglers') {
          results = [...results, ...users.filter(u =>
            u.role === 'angler' && u.name.toLowerCase().includes(query)
          ).map(u => ({ ...u, resultType: 'angler' }))];
        }
        if (type === 'all' || type === 'series') {
          results = [...results, ...series.filter(s =>
            s.name.toLowerCase().includes(query)
          ).map(s => ({ ...s, resultType: 'series' }))];
        }
        return (
          <div className="flex-grow py-8 px-4 md:px-8 max-w-7xl mx-auto w-full">
            <button onClick={() => setView('home')} className="text-blue-600 hover:text-blue-800 font-semibold mb-6 block">← Back to Home</button>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Search Results</h1>
            <p className="text-gray-600 mb-6">
              Searching for: <span className="font-semibold">{searchParams.query}</span> in{' '}
              <span className="font-semibold capitalize">{searchParams.type === 'all' ? 'All Categories' : searchParams.type}</span>
            </p>
            {results.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-600 text-lg">No results found</p>
                <p className="text-gray-500 mt-2">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">Found {results.length} result{results.length !== 1 ? 's' : ''}</p>
                {results.map((result, i) => (
                  <div key={`${result.resultType}-${result.id}-${i}`} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    {result.resultType === 'tournament' && (
                      <div>
                        <span className="text-xs font-semibold text-blue-600 uppercase">Tournament</span>
                        <h3 className="text-xl font-bold text-gray-900 mt-2">{result.name}</h3>
                        {result.location && <p className="text-gray-600 mt-1">{result.location}</p>}
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
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      default:
        return (
          <HomePage
            tournaments={tournaments}
            submissions={submissions}
            users={users}
            onNavigate={setView}
            onSearch={handleSearch}
          />
        );
    }
  };

  const showFooter = !['register', 'login'].includes(view);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header currentUser={currentUser} onNavigate={setView} onLogout={handleLogout} />
      <main className="flex-grow">
        {renderPage()}
      </main>
      {showFooter && <Footer onNavigate={setView} />}
    </div>
  );
}
