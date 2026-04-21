'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tournament, User, Submission, Registration, Series, SearchParams } from '@/types';
import { fetchTournaments, fetchUsers, fetchRegistrations, fetchSubmissions, fetchSeries } from '@/lib/storage';
import { getSession, setSession, clearSession } from '@/lib/auth';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/layout/Breadcrumb';
import HomePage from '@/components/pages/HomePage';
import SignUpPage from '@/components/pages/SignUpPage';
import LoginPage from '@/components/pages/LoginPage';
import AdminLoginPage from '@/components/pages/AdminLoginPage';
import ForgotPasswordPage from '@/components/pages/ForgotPasswordPage';
import RegisterAnglerPage from '@/components/pages/RegisterAnglerPage';
import RegisterDirectorPage from '@/components/pages/RegisterDirectorPage';
import RegisterJudgePage from '@/components/pages/RegisterJudgePage';
import AdminDashboard from '@/components/pages/AdminDashboard';
import SeriesPage from '@/components/pages/SeriesPage';
import TournamentsPage from '@/components/pages/TournamentsPage';
import ClubsPage from '@/components/pages/ClubsPage';
import EventsPage from '@/components/pages/EventsPage';
import FeaturesPage from '@/components/pages/FeaturesPage';
import PartnerPage from '@/components/pages/PartnerPage';

// Breadcrumb definitions for each view
const BREADCRUMBS: Record<string, { label: string; view?: string }[]> = {
  login:              [{ label: 'Login' }],
  'admin-login':      [{ label: 'System Admin Login' }],
  'forgot-password':  [{ label: 'Login', view: 'login' }, { label: 'Forgot Password' }],
  register:           [{ label: 'Sign Up' }],
  'register-angler':  [{ label: 'Sign Up', view: 'register' }, { label: 'Angler Account' }],
  'register-director':[{ label: 'Sign Up', view: 'register' }, { label: 'Director Account' }],
  'register-judge':   [{ label: 'Sign Up', view: 'register' }, { label: 'Judge Registration' }],
  'judges':           [{ label: 'Sign Up', view: 'register' }, { label: 'Judge Registration' }],
  series:             [{ label: 'Series' }],
  tournaments:        [{ label: 'Tournaments' }],
  clubs:              [{ label: 'Clubs' }],
  events:             [{ label: 'Events' }],
  features:           [{ label: 'App Features' }],
  sponsor:            [{ label: 'Become a Partner' }],
  'search-results':   [{ label: 'Search Results' }],
};

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
  // AUTH_VIEWS: these should never be navigated back to when logged in
  const AUTH_VIEWS = ['login', 'admin-login', 'register', 'register-angler',
    'register-director', 'register-judge', 'forgot-password', 'sponsor'];

  const navigate = useCallback((v: string) => {
    setView(v);
    localStorage.setItem('hoox_view', v);
    // Store first post-login view as session root (used to prevent back to auth screens)
    const session = getSession();
    if (session && !localStorage.getItem('hoox_session_root')) {
      localStorage.setItem('hoox_session_root', v);
    }
    if (typeof window !== 'undefined') {
      window.history.pushState({ hooxView: v }, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Tag the initial page load entry with current view
    window.history.replaceState({ hooxView: 'home' }, '', window.location.pathname);

    const handlePopState = (e: PopStateEvent) => {
      const targetView = e.state?.hooxView ?? 'home';
      const session = getSession();

      // If logged in and back would go to an auth screen, skip it
      if (session && AUTH_VIEWS.includes(targetView)) {
        // Push a new entry for the session root so back works from here too
        const root = localStorage.getItem('hoox_session_root') ?? 'home';
        window.history.replaceState({ hooxView: root }, '', window.location.pathname);
        setView(root);
        localStorage.setItem('hoox_view', root);
        return;
      }

      setView(targetView);
      localStorage.setItem('hoox_view', targetView);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [searchParams, setSearchParams] = useState<SearchParams>({ type: 'all', query: '' });

  useEffect(() => {
    async function loadAll() {
      try {
        setIsLoading(true);
        const [t, u, s, r, sr] = await Promise.all([
          fetchTournaments(), fetchUsers(), fetchSubmissions(),
          fetchRegistrations(), fetchSeries(),
        ]);
        setTournaments(t); setUsers(u); setSubmissions(s);
        setRegistrations(r); setSeries(sr);
        const session = getSession();
        if (session) {
          setCurrentUser(session);
          if (typeof window !== 'undefined') {
            const savedView = localStorage.getItem('hoox_view');
            if (savedView) {
              setView(savedView);
              window.history.replaceState({ hooxView: savedView }, '', window.location.pathname);
            }
          }
        }
      } catch (err) {
        setError('Failed to connect to database.');
      } finally {
        setIsLoading(false);
      }
    }
    loadAll();
  }, []);

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
    setSession(user);
    // Will be set when navigate() is called right after login
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    clearSession();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hoox_view');
      localStorage.removeItem('hoox_session_root');
      window.history.replaceState({ hooxView: 'home' }, '', window.location.pathname);
    }
    setView('home');
  }, []);

  const handleSearch = useCallback((params: SearchParams) => {
    setSearchParams(params);
    navigate('search-results');
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
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

  // Admin dashboard has its own full layout
  if (view === 'admin-dashboard') {
    if (currentUser?.role === 'admin') {
      return <AdminDashboard currentUser={currentUser} onNavigate={navigate} onLogout={handleLogout} />;
    }
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header currentUser={currentUser} onNavigate={navigate} onLogout={handleLogout} />
        <Breadcrumb items={[{ label: 'System Admin Login' }]} onNavigate={navigate} />
        <AdminLoginPage onNavigate={navigate} onLogin={handleLogin} />
        <Footer onNavigate={navigate} />
      </div>
    );
  }

  const renderPage = () => {
    switch (view) {
      case 'login':              return <LoginPage onNavigate={navigate} onLogin={handleLogin} />;
      case 'admin-login':        return <AdminLoginPage onNavigate={navigate} onLogin={handleLogin} />;
      case 'forgot-password':    return <ForgotPasswordPage onNavigate={navigate} />;
      case 'register':           return <SignUpPage onNavigate={navigate} />;
      case 'register-angler':    return <RegisterAnglerPage onNavigate={navigate} onLogin={handleLogin} />;
      case 'register-director':  return <RegisterDirectorPage onNavigate={navigate} onLogin={handleLogin} />;
      case 'register-judge':     return <RegisterJudgePage onNavigate={navigate} onLogin={handleLogin} />;
      case 'judges':             return <RegisterJudgePage onNavigate={navigate} onLogin={handleLogin} />;
      case 'series':             return <SeriesPage onNavigate={navigate} />;
      case 'tournaments':        return <TournamentsPage tournaments={tournaments} onNavigate={navigate} />;
      case 'clubs':              return <ClubsPage onNavigate={navigate} />;
      case 'events':             return <EventsPage onNavigate={navigate} />;
      case 'features':           return <FeaturesPage onNavigate={navigate} />;
      case 'sponsor':            return <PartnerPage onNavigate={navigate} />;
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
            <p className="text-gray-600 mb-6">
              Showing results for: <span className="font-semibold">{searchParams.query}</span> in{' '}
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
                      <div><span className="text-xs font-semibold text-blue-600 uppercase">Tournament</span>
                        <h3 className="text-xl font-bold text-gray-900 mt-2">{result.name}</h3>
                        {result.location && <p className="text-gray-600 mt-1">{result.location}</p>}
                      </div>
                    )}
                    {result.resultType === 'director' && (
                      <div><span className="text-xs font-semibold text-purple-600 uppercase">Tournament Director</span>
                        <h3 className="text-xl font-bold text-gray-900 mt-2">{result.name}</h3>
                        {result.organization && <p className="text-gray-600 mt-1">{result.organization}</p>}
                      </div>
                    )}
                    {result.resultType === 'angler' && (
                      <div><span className="text-xs font-semibold text-green-600 uppercase">Angler</span>
                        <h3 className="text-xl font-bold text-gray-900 mt-2">{result.name}</h3>
                      </div>
                    )}
                    {result.resultType === 'series' && (
                      <div><span className="text-xs font-semibold text-orange-600 uppercase">Series</span>
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
            onNavigate={navigate}
            onSearch={handleSearch}
          />
        );
    }
  };

  const breadcrumbItems = BREADCRUMBS[view];
  const showBreadcrumb = !!breadcrumbItems;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header currentUser={currentUser} onNavigate={navigate} onLogout={handleLogout} />
      {showBreadcrumb && (
        <Breadcrumb items={breadcrumbItems} onNavigate={navigate} />
      )}
      <main className="flex-grow flex flex-col">
        {renderPage()}
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
}
