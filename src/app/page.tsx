'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  // Keep a ref to the nav stack so popstate handler always sees current value
  const navStackRef = useRef<string[]>(['home']);

  const navigate = useCallback((v: string) => {
    setView(v);
    navStackRef.current = [...navStackRef.current, v];
    localStorage.setItem('hoox_view', v);
    // Push a new history entry so popstate fires when back is pressed
    if (typeof window !== 'undefined') {
      window.history.pushState({ hoox: true, view: v }, '');
    }
  }, []);

  // On mount: push a barrier entry so back button fires popstate instead of leaving the site
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.history.pushState({ hoox: true, view: 'home' }, '');

    const handlePopState = () => {
      // Immediately push another barrier so back can never leave hoox.app
      window.history.pushState({ hoox: true }, '');

      const stack = navStackRef.current;
      if (stack.length > 1) {
        // Go back one step in our own nav stack
        const newStack = stack.slice(0, -1);
        navStackRef.current = newStack;
        const prevView = newStack[newStack.length - 1];
        setView(prevView);
        localStorage.setItem('hoox_view', prevView);
      }
      // If stack has only one entry, we're already at root — stay here
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
            if (savedView && savedView !== 'home') {
              setView(savedView);
              navStackRef.current = ['home', savedView];
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
    // Reset nav stack so back button never returns to login/register screens
    navStackRef.current = ['home'];
    if (typeof window !== 'undefined') {
      // Clear any pre-auth history entries by replacing current state
      window.history.replaceState({ hoox: true, view: 'home' }, '');
    }
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    clearSession();
    navStackRef.current = ['home'];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hoox_view');
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
