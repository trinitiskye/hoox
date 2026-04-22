'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Trophy, BarChart3, Image, Settings, LogOut, Globe,
  Fish, Shield, DollarSign, Calendar, FileEdit, Heart,
  ChevronDown, TrendingUp, Scale, Megaphone, FlaskConical,
  Eye, EyeOff, Pencil, Trash2, Pause, Play, ShieldOff, ShieldCheck,
  Plus, Edit2, Search, Filter, MapPin, Clock, CheckCircle, XCircle,
  Database, Lock, BarChart2, CreditCard, Tag, Package, Building2,
  Layers, BookOpen, Video, FileText, ChevronLeft, ChevronRight,
  ExternalLink, Activity, PauseCircle, X, Check, Upload,
  Award, UserCheck, Star, AlertCircle
} from 'lucide-react';
import { User, Tournament, Series, Submission } from '@/types';
import { fetchUsers, fetchTournaments, fetchSeries, fetchSubmissions } from '@/lib/storage';
import { clearSession, createAllDemoAccounts, changePassword, type DemoAccountResult } from '@/lib/auth';
import AddressSelector from '@/components/ui/AddressSelector';
import { Toast, useToast } from '@/components/ui/Toast';

interface AdminDashboardProps {
  currentUser: User;
  onNavigate: (view: string) => void;
  onNavigateReplace: (view: string) => void;
  onLogout: () => void;
  initialTab?: string;
  usersSubView?: string;
  usersSelectedId?: string;
}

const TAB_TO_PATH: Record<string, string> = {
  'Dashboard':        '/admin',
  'Users':            '/admin/users',
  'Partners':         '/admin/partners',
  'Clubs':            '/admin/clubs',
  'Series':           '/admin/series',
  'Tournaments':      '/admin/tournaments',
  'Events':           '/admin/events',
  'Catch Submissions':'/admin/catch-submissions',
  'Advertising':      '/admin/advertising',
  'Monetization':     '/admin/monetization',
  'CMS':              '/admin/cms',
  'Settings':         '/admin/settings',
};

const PATH_TO_TAB: Record<string, string> = Object.fromEntries(
  Object.entries(TAB_TO_PATH).map(([k, v]) => [v, k])
);

const NAV_TABS = [
  'Dashboard', 'Users', 'Partners', 'Clubs', 'Series',
  'Tournaments', 'Events', 'Catch Submissions',
  'Advertising', 'Monetization', 'CMS', 'Settings'
];

export default function AdminDashboard({ currentUser, onNavigate, onNavigateReplace, onLogout, initialTab, usersSubView, usersSelectedId }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState(initialTab || 'Dashboard');
  const [usersTabKey, setUsersTabKey] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [u, t, s, sub] = await Promise.all([
        fetchUsers(), fetchTournaments(), fetchSeries(), fetchSubmissions()
      ]);
      setUsers(u); setTournaments(t); setSeries(s); setSubmissions(sub);
      setLoading(false);
    }
    load();
  }, []);

  const directors = users.filter(u => u.role === 'director');
  const judges = users.filter(u => u.role === 'judge');
  const anglers = users.filter(u => u.role === 'angler');
  const partners = users.filter(u => u.role === 'sponsor');

  const handleLogout = () => { clearSession(); onLogout(); };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo + View Website */}
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('home')} className="flex items-center gap-2">
                <span className="text-xl font-black text-blue-700 tracking-tight">HOOX</span>
              </button>
              <button onClick={() => onNavigate('home')} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                <Globe className="w-3.5 h-3.5" /> View Website
              </button>
            </div>

            {/* User info + logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{currentUser.name}</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">HOOX Tournament App</span>
                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded">System Admin</span>
                  </div>
                </div>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-gray-900 text-sm transition">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>

          {/* Nav tabs */}
          <div className="flex overflow-x-auto scrollbar-hide -mb-px gap-1">
            {NAV_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === 'Users') setUsersTabKey(k => k + 1);
                  onNavigateReplace(TAB_TO_PATH[tab]);
                }}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  activeTab === tab
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-screen-xl mx-auto w-full px-4 md:px-6 py-8">
        {activeTab === 'Dashboard' && (
          <DashboardTab
            users={users} tournaments={tournaments} series={series} submissions={submissions}
            directors={directors} judges={judges} anglers={anglers} partners={partners}
            loading={loading} onTabChange={setActiveTab}
          />
        )}
        {activeTab === 'Users' && <UsersTab key={usersTabKey} users={users} onRefresh={() => { fetchUsers().then(setUsers); }} currentUser={currentUser} onNavigate={onNavigate} subViewProp={usersSubView} selectedUserId={usersSelectedId} />}
        {activeTab === 'Tournaments' && <TournamentsTab tournaments={tournaments} />}
        {activeTab === 'Catch Submissions' && <SubmissionsTab submissions={submissions} />}
        {activeTab === 'Partners' && <PartnersTab partners={partners} />}
        {activeTab === 'Clubs' && <ClubsTab />}
        {activeTab === 'Series' && <SeriesTab series={series} />}
        {activeTab === 'Events' && <EventsTab />}
        {activeTab === 'Advertising' && <AdvertisingTab />}
        {activeTab === 'Monetization' && <MonetizationTab />}
        {activeTab === 'CMS' && <CMSTab />}
        {activeTab === 'Settings' && <SettingsTab />}
        {activeTab !== 'Dashboard' && activeTab !== 'Users' && activeTab !== 'Tournaments' &&
         activeTab !== 'Catch Submissions' && activeTab !== 'Partners' && activeTab !== 'Clubs' &&
         activeTab !== 'Series' && activeTab !== 'Events' && activeTab !== 'Advertising' &&
         activeTab !== 'Monetization' && activeTab !== 'CMS' && activeTab !== 'Settings' && (
          <ComingSoonTab tab={activeTab} />
        )}
      </main>
    </div>
  );
}

// ============================================================
// DASHBOARD TAB
// ============================================================
function DashboardTab({ users, tournaments, series, submissions, directors, judges, anglers, partners, loading, onTabChange }: any) {
  const [seeding, setSeeding] = useState(false);
  const [seedResults, setSeedResults] = useState<DemoAccountResult[] | null>(null);

  const handleSeedDemoAccounts = async () => {
    setSeeding(true);
    setSeedResults(null);
    const results = await createAllDemoAccounts();
    setSeedResults(results);
    setSeeding(false);
  };
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Hoox Command Center</h1>
      <p className="text-gray-500 mb-8">Manage users, tournaments, and platform settings</p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* Demo Accounts Setup */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-1">
                  <FlaskConical className="w-4 h-4" /> Demo Account Setup
                </h3>
                <p className="text-indigo-700 text-sm mb-1">Create all test accounts with password <code className="bg-indigo-100 px-1.5 py-0.5 rounded font-mono text-xs">demo123</code></p>
                <div className="flex flex-wrap gap-2 text-xs text-indigo-600 mt-2">
                  {[
                    { label: 'Director', email: 'tournamentdirector@hoox.app' },
                    { label: 'Angler', email: 'angler@hoox.app' },
                    { label: 'Judge', email: 'judge@hoox.app' },
                    { label: 'Partner', email: 'partner@hoox.app' },
                  ].map(a => (
                    <span key={a.email} className="bg-indigo-100 px-2 py-1 rounded-full">
                      <span className="font-semibold">{a.label}:</span> {a.email}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSeedDemoAccounts}
                disabled={seeding}
                className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 whitespace-nowrap flex-shrink-0"
              >
                {seeding ? 'Creating...' : 'Create Demo Accounts'}
              </button>
            </div>

            {/* Results */}
            {seedResults && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                {seedResults.map(r => (
                  <div key={r.email} className={`rounded-lg p-2.5 text-xs ${r.status === 'error' ? 'bg-red-100 border border-red-200' : 'bg-green-100 border border-green-200'}`}>
                    <div className={`font-semibold capitalize mb-0.5 ${r.status === 'error' ? 'text-red-700' : 'text-green-700'}`}>
                      {r.status === 'error' ? '❌' : r.status === 'created' ? '✅ Created' : '✅ Updated'} {r.role}
                    </div>
                    <div className={r.status === 'error' ? 'text-red-600' : 'text-green-600'}>{r.email}</div>
                    {r.error && <div className="text-red-500 mt-0.5">{r.error}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Top Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Users', value: users.length, sub: 'All platform users', icon: Users, color: 'text-gray-600' },
              { label: 'Total Series', value: series.length, sub: 'Tournament series', icon: TrendingUp, color: 'text-gray-600' },
              { label: 'Total Tournaments', value: tournaments.length, sub: 'All tournaments', icon: Trophy, color: 'text-gray-600' },
              { label: 'Total Ads', value: 5, sub: 'All advertisements', icon: Image, color: 'text-gray-600' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">{s.label}</span>
                  <s.icon className={`w-5 h-5 ${s.color} opacity-50`} />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{s.value}</div>
                <div className="text-xs text-gray-400">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Role Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Tournament Directors', value: directors.length, sub: 'Total directors', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: Trophy },
              { label: 'Judges', value: judges.length, sub: 'Total judges', color: 'text-purple-600 bg-purple-50 border-purple-100', icon: Scale },
              { label: 'Anglers', value: anglers.length, sub: 'Registered anglers', color: 'text-green-600 bg-green-50 border-green-100', icon: Fish },
              { label: 'Partners', value: partners.length, sub: 'Active partners', color: 'text-orange-600 bg-orange-50 border-orange-100', icon: Heart },
            ].map(s => (
              <div key={s.label} className={`border rounded-xl p-5 ${s.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">{s.label}</span>
                  <s.icon className="w-5 h-5 opacity-50" />
                </div>
                <div className="text-3xl font-bold mb-1">{s.value}</div>
                <div className="text-xs opacity-70">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Administrative Tools */}
          <h2 className="text-xl font-bold text-gray-900 mb-5">Administrative Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { icon: Megaphone, color: 'bg-pink-100 text-pink-600', title: 'Advertising', desc: 'Upload and manage banner ads for public-facing pages', btn: 'Manage Ads', tab: 'Advertising' },
              { icon: FileEdit, color: 'bg-purple-100 text-purple-600', title: 'CMS', desc: 'Manage website content, pages, and media assets', btn: 'Manage Content', tab: 'CMS' },
              { icon: DollarSign, color: 'bg-green-100 text-green-600', title: 'Monetization', desc: 'Manage pricing, subscriptions, revenue, and payment processing', btn: 'Manage Monetization', tab: 'Monetization' },
            ].map(t => (
              <div key={t.title} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${t.color}`}>
                  <t.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{t.title}</h3>
                <p className="text-gray-500 text-sm mb-4">{t.desc}</p>
                <button onClick={() => onTabChange(t.tab)} className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  {t.btn}
                </button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-blue-100 text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Events Management</h3>
              <p className="text-gray-500 text-sm mb-4">Manage expos, boat shows, and other fishing events</p>
              <button onClick={() => onTabChange('Events')} className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Manage Events
              </button>
            </div>
          </div>

          {/* Management Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users, color: 'bg-blue-100 text-blue-600', title: 'User Management', desc: 'Manage user accounts, roles, and permissions across the platform', btn: 'Manage Users', tab: 'Users' },
              { icon: Heart, color: 'bg-orange-100 text-orange-600', title: 'Partner Management', desc: 'Review partner applications and manage partnership agreements', btn: 'Manage Partners', tab: 'Partners' },
              { icon: TrendingUp, color: 'bg-purple-100 text-purple-600', title: 'Series Management', desc: 'Manage tournament series, standings, and seasonal configurations', btn: 'Manage Series', tab: 'Series' },
              { icon: Trophy, color: 'bg-teal-100 text-teal-600', title: 'Tournament Management', desc: 'Oversee all tournaments, review settings, and monitor activity', btn: 'Manage Tournaments', tab: 'Tournaments' },
            ].map(t => (
              <div key={t.title} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${t.color}`}>
                  <t.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{t.title}</h3>
                <p className="text-gray-500 text-sm mb-4">{t.desc}</p>
                <button onClick={() => onTabChange(t.tab)} className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  {t.btn}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// USERS TAB
// ============================================================
function UsersTab({ users, onRefresh, currentUser, onNavigate, subViewProp, selectedUserId }: {
  users: User[];
  onRefresh: () => void;
  currentUser: User;
  onNavigate: (path: string) => void;
  subViewProp?: string;
  selectedUserId?: string;
}) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const subView = subViewProp || 'dashboard';
  const selectedUser = users.find(u => u.id === selectedUserId) || null;
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  // View/Edit page tab state
  const [viewTab, setViewTab] = useState<'profile' | 'account'>('profile');
  const [editTab, setEditTab] = useState<'profile' | 'account' | 'security'>('profile');

  // Judge profile form state
  const [judgeProfile, setJudgeProfile] = useState<{
    avatar: string;
    displayName: string;
    organization: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    email: string;
    phone: string;
    website: string;
    clubAffiliations: { name: string; website: string }[];
    sponsors: { name: string; website: string }[];
    newClub: { name: string; website: string };
    newSponsor: { name: string; website: string };
  }>({
    avatar: '', displayName: '', organization: '', address: '',
    city: '', state: '', zip: '', country: '', email: '', phone: '', website: '',
    clubAffiliations: [], sponsors: [],
    newClub: { name: '', website: '' }, newSponsor: { name: '', website: '' },
  });

  // Pre-fill edit forms whenever selectedUser changes (handles direct URL nav)
  useEffect(() => {
    if (!selectedUser) return;
    // Always pre-fill account info form from user data
    setEditForm({ ...selectedUser });
    // Pre-fill judge profile form from saved profile data
    if (selectedUser.role === 'judge') {
      setJudgeProfile(p => ({
        ...p,
        avatar:           selectedUser.avatar || '',
        displayName:      selectedUser.displayName || '',
        organization:     selectedUser.organization || '',
        address:          selectedUser.address || '',
        city:             selectedUser.city || '',
        state:            selectedUser.state || '',
        zip:              selectedUser.zip || '',
        country:          selectedUser.country || '',
        email:            selectedUser.email || '',
        phone:            selectedUser.phone || '',
        website:          selectedUser.website || '',
        clubAffiliations: selectedUser.clubAffiliations || [],
        sponsors:         selectedUser.sponsors || [],
        newClub:          { name: '', website: '' },
        newSponsor:       { name: '', website: '' },
      }));
    }
  }, [selectedUser]);

  // Password change state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNew, setShowPwNew] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);

  // Toast
  const { toasts, remove: removeToast, success: toastSuccess, error: toastError } = useToast();

  const pendingJudges = users.filter(u => u.role === 'judge' && u.status === 'pending');

  const filtered = users.filter(u =>
    (roleFilter === 'all' || u.role === roleFilter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) ||
     u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const roleBadge = (role: string) => ({
    admin:    'bg-red-100 text-red-700',
    director: 'bg-blue-100 text-blue-700',
    judge:    'bg-purple-100 text-purple-700',
    angler:   'bg-green-100 text-green-700',
    sponsor:  'bg-orange-100 text-orange-700',
  }[role] || 'bg-gray-100 text-gray-600');

  const statusBadge = (status: string) => ({
    active:   'bg-green-100 text-green-700',
    pending:  'bg-yellow-100 text-yellow-700',
    paused:   'bg-orange-100 text-orange-700',
    banned:   'bg-red-100 text-red-700',
    inactive: 'bg-gray-100 text-gray-500',
  }[status] || 'bg-gray-100 text-gray-600');

  const doAction = async (userId: string, action: 'approve' | 'pause' | 'unpause' | 'ban' | 'unban') => {
    setActionLoading(userId + action);
    const { updateUser } = await import('@/lib/supabase');
    const statusMap: Record<string, string> = {
      approve: 'active', pause: 'paused', unpause: 'active', ban: 'banned', unban: 'active',
    };
    await updateUser(userId, { status: statusMap[action] });
    await onRefresh();
    // Refresh selectedUser if we're in view/edit
    setActionLoading(null);
  };

  const doDelete = async (userId: string) => {
    const { deleteUser } = await import('@/lib/supabase');
    await deleteUser(userId);
    setDeleteTarget(null);
    onNavigate('/admin/users/list');
    await onRefresh();
  };

  const openView = (user: User) => { onNavigate(`/admin/users/${user.id}`); };
  const openEdit = (user: User) => {
    setEditForm({ ...user });
    setEditSuccess(false);
    setEditTab('profile');
    // Pre-populate judge profile form if editing a judge
    if (user.role === 'judge') {
      setJudgeProfile(p => ({
        ...p,
        avatar:           user.avatar || '',
        displayName:      user.displayName || '',
        organization:     user.organization || '',
        address:          user.address || '',
        city:             user.city || '',
        state:            user.state || '',
        zip:              user.zip || '',
        country:          user.country || '',
        email:            user.email || '',
        phone:            user.phone || '',
        website:          user.website || '',
        clubAffiliations: user.clubAffiliations || [],
        sponsors:         user.sponsors || [],
        newClub:          { name: '', website: '' },
        newSponsor:       { name: '', website: '' },
      }));
    }
    onNavigate(`/admin/users/${user.id}/edit`);
  };

  const saveEdit = async () => {
    if (!selectedUser) return;
    setEditSaving(true);
    const { updateUser } = await import('@/lib/supabase');
    await updateUser(selectedUser.id, {
      name: editForm.name,
      email: editForm.email,
      role: editForm.role,
      organization: editForm.organization || null,
      phone: editForm.phone || null,
      address: editForm.address || null,
      city: editForm.city || null,
      state: editForm.state || null,
      zip: editForm.zip || null,
      website: editForm.website || null,
    });
    await onRefresh();
    setEditSaving(false);
    setEditSuccess(true);
    toastSuccess('User information saved successfully.');
    onNavigate(`/admin/users/${selectedUser?.id}`);
  };

  const changePasswordForUser = async () => {
    if (!selectedUser) return;
    if (!pwForm.newPw) { toastError('Please enter a new password.'); return; }
    if (pwForm.newPw.length < 6) { toastError('Password must be at least 6 characters.'); return; }
    if (pwForm.newPw !== pwForm.confirm) { toastError('New passwords do not match.'); return; }

    // Admin changing their own password requires current password
    const isOwnAccount = selectedUser.id === currentUser.id;
    if (isOwnAccount && !pwForm.current) {
      toastError('Please enter your current password to change your own password.');
      return;
    }

    setPwSaving(true);
    const { success, error } = await changePassword({
      userId: selectedUser.id,
      currentPassword: isOwnAccount ? pwForm.current : undefined,
      newPassword: pwForm.newPw,
      isAdminOverride: !isOwnAccount,
    });
    setPwSaving(false);

    if (error) {
      toastError(error);
    } else {
      setPwForm({ current: '', newPw: '', confirm: '' });
      toastSuccess(`Password updated successfully for ${selectedUser.name}. A confirmation email has been sent.`);
    }
  };

  // ── Delete Confirmation Modal ──────────────────────────────────────────────
  const DeleteModal = () => deleteTarget ? (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Account?</h2>
        <p className="text-gray-500 text-sm text-center mb-2">
          You are about to permanently delete the account for:
        </p>
        <p className="text-center font-semibold text-gray-800 mb-4">{deleteTarget.name} ({deleteTarget.email})</p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700 text-sm font-semibold mb-1">⚠️ This action is irreversible</p>
          <p className="text-red-600 text-sm">Once deleted, this account cannot be recovered. The user will receive an "Account not found" error if they attempt to log in.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)}
            className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={() => doDelete(deleteTarget.id)}
            className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition">
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // ── View User ─────────────────────────────────────────────────────────────
  if (subView === 'view' && selectedUser) {
    const u = users.find(x => x.id === selectedUser.id) || selectedUser;
    return (
      <div>
        <DeleteModal />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm mb-6">
          <button onClick={() => onNavigate('/admin/users')} className="text-blue-600 hover:underline">Users</button>
          <span className="text-gray-300 mx-1">›</span>
          <button onClick={() => onNavigate('/admin/users/list')} className="text-blue-600 hover:underline">User Management</button>
          <span className="text-gray-300 mx-1">›</span>
          <span className="text-gray-500">{u.name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-2 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{u.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadge(u.role)}`}>
                {u.role === 'sponsor' ? 'partner' : u.role}
              </span>
              <span className="text-gray-400 text-sm">{u.email}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(u.status || 'active')}`}>
                {u.status || 'active'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => openEdit(u)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            {u.status === 'paused'
              ? <button onClick={() => doAction(u.id, 'unpause')} disabled={!!actionLoading} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
                  <Play className="w-3.5 h-3.5" /> Unpause
                </button>
              : <button onClick={() => doAction(u.id, 'pause')} disabled={!!actionLoading} className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50">
                  <Pause className="w-3.5 h-3.5" /> Pause
                </button>
            }
            {u.status === 'banned'
              ? <button onClick={() => doAction(u.id, 'unban')} disabled={!!actionLoading} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
                  <ShieldCheck className="w-3.5 h-3.5" /> Unban
                </button>
              : <button onClick={() => doAction(u.id, 'ban')} disabled={!!actionLoading} className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition disabled:opacity-50">
                  <ShieldOff className="w-3.5 h-3.5" /> Ban
                </button>
            }
            <button onClick={() => setDeleteTarget(u)} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>

        {/* Two tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {(['profile', 'account'] as const).map(tab => {
            const labels = { profile: 'Profile', account: 'Account Info' };
            return (
              <button key={tab} onClick={() => setViewTab(tab)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition -mb-px ${
                  viewTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* ── Profile Tab ── */}
        {viewTab === 'profile' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-2xl">
            <h3 className="font-semibold text-gray-800 mb-5 pb-3 border-b border-gray-100">
              {u.role === 'sponsor' ? 'Partner' :
               u.role === 'director' ? 'Tournament Director' :
               u.role.charAt(0).toUpperCase() + u.role.slice(1)} Profile
            </h3>

            {u.role === 'judge' && (
              <div className="divide-y divide-gray-100">
                {/* Avatar */}
                {u.avatar && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-gray-500 w-40 flex-shrink-0">Avatar</span>
                    <img src={u.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                  </div>
                )}
                {[
                  { label: 'Display Name',   value: u.displayName || '—' },
                  { label: 'Organization',   value: u.organization || '—' },
                  { label: 'Street Address', value: u.address || '—' },
                  { label: 'City',           value: u.city || '—' },
                  { label: 'State',          value: u.state || '—' },
                  { label: 'Zip Code',       value: u.zip || '—' },
                  { label: 'Country',        value: u.country || '—' },
                  { label: 'Email',          value: u.email || '—' },
                  { label: 'Phone',          value: u.phone || '—' },
                  { label: 'Website',        value: u.website || '—' },
                ].map(f => (
                  <div key={f.label} className="flex items-center justify-between py-3">
                    <span className="text-sm text-gray-500 w-40 flex-shrink-0">{f.label}</span>
                    <span className="text-sm font-medium text-gray-900 text-right">{f.value}</span>
                  </div>
                ))}

                {/* Club Affiliations */}
                <div className="py-4">
                  <span className="text-sm text-gray-500 block mb-2">Club Affiliation(s)</span>
                  {(u.clubAffiliations || []).length === 0
                    ? <span className="text-sm text-gray-400">None</span>
                    : <div className="flex flex-wrap gap-2">
                        {(u.clubAffiliations || []).map((c, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                            <span>{c.name}</span>
                            {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-600 text-xs underline ml-1">{c.website}</a>}
                          </div>
                        ))}
                      </div>
                  }
                </div>

                {/* Sponsors */}
                <div className="py-4">
                  <span className="text-sm text-gray-500 block mb-2">Sponsor(s)</span>
                  {(u.sponsors || []).length === 0
                    ? <span className="text-sm text-gray-400">None</span>
                    : <div className="flex flex-wrap gap-2">
                        {(u.sponsors || []).map((s, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm">
                            <span>{s.name}</span>
                            {s.website && <a href={s.website} target="_blank" rel="noreferrer" className="text-orange-400 hover:text-orange-600 text-xs underline ml-1">{s.website}</a>}
                          </div>
                        ))}
                      </div>
                  }
                </div>
              </div>
            )}

            {u.role !== 'judge' && (
              <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">Profile information coming soon</p>
                <p className="text-xs text-gray-400 mt-1">Role-specific profile details will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* ── Account Info Tab ── */}
        {viewTab === 'account' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-2xl">
            <h3 className="font-semibold text-gray-800 mb-5 pb-3 border-b border-gray-100">Account Information</h3>
            <div className="space-y-0 divide-y divide-gray-100">
              {[
                { label: 'Full Name',     value: u.name },
                { label: 'Email',         value: u.email },
                { label: 'Role',          value: u.role === 'sponsor' ? 'partner' : u.role, badge: roleBadge(u.role) },
                { label: 'Status',        value: u.status || 'active', badge: statusBadge(u.status || 'active') },
                { label: 'Organization',  value: u.organization || '—' },
                { label: 'Phone',         value: u.phone || '—' },
                { label: 'Address',       value: u.address || '—' },
                { label: 'City',          value: u.city || '—' },
                { label: 'State',         value: u.state || '—' },
                { label: 'Zip',           value: u.zip || '—' },
                { label: 'Country',       value: u.country || '—' },
                { label: 'Website',       value: u.website || '—' },
                { label: 'Member Since',  value: new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-500 w-36 flex-shrink-0">{f.label}</span>
                  {f.badge
                    ? <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${f.badge}`}>{f.value}</span>
                    : <span className="text-sm font-medium text-gray-900 text-right">{f.value}</span>
                  }
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    );
  }

  // ── Edit User ─────────────────────────────────────────────────────────────
  if (subView === 'edit' && selectedUser) {
    const isOwnAccount = selectedUser.id === currentUser.id;
    const field = (key: keyof User, label: string, type = 'text') => (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
        <input
          type={type}
          value={(editForm[key] as string) || ''}
          onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    );

    const roleBadgeColor = (role: string) => ({
      admin:    'bg-red-100 text-red-700',
      director: 'bg-blue-100 text-blue-700',
      judge:    'bg-purple-100 text-purple-700',
      angler:   'bg-green-100 text-green-700',
      sponsor:  'bg-orange-100 text-orange-700',
    }[role] || 'bg-gray-100 text-gray-600');

    return (
      <div>
        <Toast toasts={toasts} onRemove={removeToast} />
        <DeleteModal />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm mb-6">
          <button onClick={() => onNavigate('/admin/users')} className="text-blue-600 hover:underline">Users</button>
          <span className="text-gray-300 mx-1">›</span>
          <button onClick={() => onNavigate('/admin/users/list')} className="text-blue-600 hover:underline">User Management</button>
          <span className="text-gray-300 mx-1">›</span>
          <button onClick={() => onNavigate(`/admin/users/${selectedUser?.id ?? ''}`)} className="text-blue-600 hover:underline">{selectedUser.name}</button>
          <span className="text-gray-300 mx-1">›</span>
          <span className="text-gray-500">Edit</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadgeColor(selectedUser.role)}`}>
                {selectedUser.role === 'sponsor' ? 'partner' : selectedUser.role}
              </span>
              <span className="text-gray-400 text-sm">{selectedUser.email}</span>
            </div>
          </div>
          <button onClick={() => setDeleteTarget(selectedUser)} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">
            <Trash2 className="w-3.5 h-3.5" /> Delete Account
          </button>
        </div>

        {/* Three tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {(['profile', 'account', 'security'] as const).map(tab => {
            const labels = { profile: 'Profile', account: 'Account Info', security: 'Security Settings' };
            return (
              <button key={tab} onClick={() => setEditTab(tab)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition -mb-px ${
                  editTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* ── Profile Tab ── */}
        {editTab === 'profile' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-2xl">
            <h3 className="font-semibold text-gray-800 mb-5 pb-3 border-b border-gray-100">
              {selectedUser.role === 'sponsor' ? 'Partner' :
               selectedUser.role === 'director' ? 'Tournament Director' :
               selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)} Profile
            </h3>

            {selectedUser.role === 'judge' && (() => {
              const jp = judgeProfile;
              const setJp = (key: string, val: any) => setJudgeProfile(p => ({ ...p, [key]: val }));
              const inputCls = "w-full px-4 py-2.5 bg-gray-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500";
              const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";
              return (
                <div className="space-y-5">

                  {/* Avatar */}
                  <div>
                    <label className={labelCls}>Avatar Image</label>
                    <div className="flex gap-2">
                      <input type="text" value={jp.avatar} placeholder="Upload image"
                        onChange={e => setJp('avatar', e.target.value)}
                        className={`${inputCls} flex-grow`} />
                      <button className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition whitespace-nowrap">Browse</button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Recommended: Square image, at least 200×200px</p>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className={labelCls}>Display name *</label>
                    <input type="text" value={jp.displayName} placeholder={selectedUser.name}
                      onChange={e => setJp('displayName', e.target.value)} className={inputCls} />
                  </div>

                  {/* Organization */}
                  <div>
                    <label className={labelCls}>Organization</label>
                    <input type="text" value={jp.organization}
                      onChange={e => setJp('organization', e.target.value)} className={inputCls} />
                  </div>

                  {/* Street Address */}
                  <div>
                    <label className={labelCls}>Street Address</label>
                    <input type="text" value={jp.address}
                      onChange={e => setJp('address', e.target.value)} className={inputCls} />
                  </div>

                  {/* City */}
                  <div>
                    <label className={labelCls}>City</label>
                    <input type="text" value={jp.city}
                      onChange={e => setJp('city', e.target.value)} className={inputCls} />
                  </div>

                  {/* State + Zip */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>State</label>
                      <input type="text" value={jp.state}
                        onChange={e => setJp('state', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Zip Code</label>
                      <input type="text" value={jp.zip}
                        onChange={e => setJp('zip', e.target.value)} className={inputCls} />
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label className={labelCls}>Country</label>
                    <input type="text" value={jp.country}
                      onChange={e => setJp('country', e.target.value)} className={inputCls} />
                  </div>

                  {/* Email */}
                  <div>
                    <label className={labelCls}>Email *</label>
                    <input type="email" value={jp.email} placeholder="your.name@email.com"
                      onChange={e => setJp('email', e.target.value)} className={inputCls} />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className={labelCls}>Phone Number</label>
                    <input type="tel" value={jp.phone} placeholder="000-000-0000"
                      onChange={e => setJp('phone', e.target.value)} className={inputCls} />
                  </div>

                  {/* Website */}
                  <div>
                    <label className={labelCls}>Website</label>
                    <input type="url" value={jp.website} placeholder="www.yourwebsite.com"
                      onChange={e => setJp('website', e.target.value)} className={inputCls} />
                  </div>

                  {/* Club Affiliations */}
                  <div>
                    <p className="text-sm font-semibold text-gray-800 mb-0.5">Club Affiliation(s)</p>
                    <p className="text-xs text-gray-400 mb-3">Add one or more club affiliations</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {jp.clubAffiliations.map((c, i) => (
                        <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                          {c.name}
                          <button onClick={() => setJp('clubAffiliations', jp.clubAffiliations.filter((_: any, j: number) => j !== i))}
                            className="text-blue-400 hover:text-blue-700 ml-1">×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <input type="text" value={jp.newClub.name} placeholder="Club name"
                        onChange={e => setJp('newClub', { ...jp.newClub, name: e.target.value })}
                        className={`${inputCls} flex-1`} />
                      <input type="url" value={jp.newClub.website} placeholder="Club website"
                        onChange={e => setJp('newClub', { ...jp.newClub, website: e.target.value })}
                        className={`${inputCls} flex-1`} />
                      <button onClick={() => {
                        if (jp.newClub.name.trim()) {
                          setJp('clubAffiliations', [...jp.clubAffiliations, { name: jp.newClub.name.trim(), website: jp.newClub.website.trim() }]);
                          setJp('newClub', { name: '', website: '' });
                        }
                      }} className="flex items-center gap-1 px-3 py-2.5 text-sm text-gray-600 hover:text-blue-600 whitespace-nowrap">
                        <span className="text-lg leading-none">+</span> Add
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Website must include full url: www.website.com</p>
                  </div>

                  {/* Sponsors */}
                  <div>
                    <p className="text-sm font-semibold text-gray-800 mb-0.5">Sponsor(s)</p>
                    <p className="text-xs text-gray-400 mb-3">Add one or more sponsors</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {jp.sponsors.map((s: any, i: number) => (
                        <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm">
                          {s.name}
                          <button onClick={() => setJp('sponsors', jp.sponsors.filter((_: any, j: number) => j !== i))}
                            className="text-orange-400 hover:text-orange-700 ml-1">×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <input type="text" value={jp.newSponsor.name} placeholder="Sponsor name"
                        onChange={e => setJp('newSponsor', { ...jp.newSponsor, name: e.target.value })}
                        className={`${inputCls} flex-1`} />
                      <input type="url" value={jp.newSponsor.website} placeholder="Sponsor website"
                        onChange={e => setJp('newSponsor', { ...jp.newSponsor, website: e.target.value })}
                        className={`${inputCls} flex-1`} />
                      <button onClick={() => {
                        if (jp.newSponsor.name.trim()) {
                          setJp('sponsors', [...jp.sponsors, { name: jp.newSponsor.name.trim(), website: jp.newSponsor.website.trim() }]);
                          setJp('newSponsor', { name: '', website: '' });
                        }
                      }} className="flex items-center gap-1 px-3 py-2.5 text-sm text-gray-600 hover:text-orange-600 whitespace-nowrap">
                        <span className="text-lg leading-none">+</span> Add
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Website must include full url: www.website.com</p>
                  </div>

                  {/* Save */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button onClick={() => onNavigate(`/admin/users/${selectedUser.id}`)}
                      className="px-5 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition text-sm">
                      Cancel
                    </button>
                    <button onClick={async () => {
                      await import('@/lib/supabase').then(m => m.updateUser(selectedUser.id, {
                        display_name: jp.displayName,
                        organization: jp.organization,
                        address: jp.address,
                        city: jp.city,
                        state: jp.state,
                        zip: jp.zip,
                        country: jp.country,
                        phone: jp.phone,
                        website: jp.website,
                        club_affiliations: jp.clubAffiliations,
                        sponsors: jp.sponsors,
                      }));
                      toastSuccess('Judge profile saved successfully.');
                    }} className="px-5 py-2.5 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-700 transition text-sm">
                      Update
                    </button>
                  </div>
                </div>
              );
            })()}

            
