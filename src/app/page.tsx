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

// Auth views use replaceState — pressing back skips them
const AUTH_VIEWS = new Set([
  'login', 'admin-login', 'register', 'register-angler',
  'register-director', 'register-judge', 'forgot-password', 'sponsor',
]);

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
  const [searchParams, setSearchParams] = useState<SearchParams>({ type: 'all', query: '' });

  // navigate: auth views replace history entry (no back button entry)
  //           app views push a new entry (back button works)
  const navigate = useCallback((v: string) => {
    setView(v);
    localStorage.setItem('hoox_view', v);
    if (typeof window === 'undefined') return;
    if (AUTH_VIEWS.has(v)) {
      window.history.replaceState({ view: v }, '');
    } else {
      window.history.pushState({ view: v }, '');
    }
  }, []);

  // popstate: browser back/forward — simply restore the view stored in history state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.history.replaceState({ view: 'home' }, '');
    const onPopState = (e: PopStateEvent) => {
      const v = e.state?.view ?? 'home';
      setView(v);
      localStorage.setItem('hoox_view', v);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Load data and restore session on mount
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
          const savedView = localStorage.getItem('hoox_view');
          if (savedView) {
            setView(savedView);
            if (typeof window !== 'undefined') {
              window.history.replaceState({ view: savedView }, '');
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
    // Replace current history entry — auth pages won't be in the back stack
    if (typeof window !== 'undefined') {
      window.history.replaceState({ view: 'home' }, '');
    }
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    clearSession();
    localStorage.removeItem('hoox_view');
    setView('home');
    if (typeof window !== 'undefined') {
      window.history.replaceState({ view: 'home' }, '');
    }
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
      case 'sponsor':            return <PartnerPage onNavigate={navigate} />;
      case 'series':             return <SeriesPage onNavigate={navigate} />;
      case 'tournaments':        return <TournamentsPage onNavigate={navigate} />;
      case 'clubs':              return <ClubsPage onNavigate={navigate} />;
      case 'events':             return <EventsPage onNavigate={navigate} />;
      case 'features':           return <FeaturesPage onNavigate={navigate} />;
      case 'search-results':     return <HomePage currentUser={currentUser} onNavigate={navigate} searchParams={searchParams} onSearch={handleSearch} />;
      default:                   return <HomePage currentUser={currentUser} onNavigate={navigate} searchParams={searchParams} onSearch={handleSearch} />;
    }
  };

  const breadcrumbItems = BREADCRUMBS[view];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header currentUser={currentUser} onNavigate={navigate} onLogout={handleLogout} />
      {breadcrumbItems && <Breadcrumb items={breadcrumbItems} onNavigate={navigate} />}
      {renderPage()}
      <Footer onNavigate={navigate} />
    </div>
  );
}
