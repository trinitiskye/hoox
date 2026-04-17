'use client';

import { useState, useEffect } from 'react';
import {
  Users, Trophy, BarChart3, Image, Settings, LogOut, Globe,
  Fish, Shield, DollarSign, Calendar, FileEdit, Heart,
  ChevronDown, TrendingUp, Scale, Megaphone, FlaskConical,
  Eye, EyeOff, Pencil, Trash2, Pause, Play, ShieldOff, ShieldCheck
} from 'lucide-react';
import { User, Tournament, Series, Submission } from '@/types';
import { fetchUsers, fetchTournaments, fetchSeries, fetchSubmissions } from '@/lib/storage';
import { clearSession, createAllDemoAccounts, changePassword, type DemoAccountResult } from '@/lib/auth';
import AddressSelector from '@/components/ui/AddressSelector';
import { Toast, useToast } from '@/components/ui/Toast';

interface AdminDashboardProps {
  currentUser: User;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

const NAV_TABS = [
  'Dashboard', 'Users', 'Partners', 'Clubs', 'Series',
  'Tournaments', 'Events', 'Catch Submissions',
  'Advertising', 'Monetization', 'CMS', 'Settings'
];

export default function AdminDashboard({ currentUser, onNavigate, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('Dashboard');
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
                onClick={() => setActiveTab(tab)}
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
        {activeTab === 'Users' && <UsersTab users={users} onRefresh={() => fetchUsers().then(setUsers)} currentUser={currentUser} />}
        {activeTab === 'Tournaments' && <TournamentsTab tournaments={tournaments} />}
        {activeTab === 'Catch Submissions' && <SubmissionsTab submissions={submissions} />}
        {activeTab === 'Partners' && <PartnersTab partners={partners} />}
        {activeTab !== 'Dashboard' && activeTab !== 'Users' && activeTab !== 'Tournaments' && activeTab !== 'Catch Submissions' && activeTab !== 'Partners' && (
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
function UsersTab({ users, onRefresh, currentUser }: { users: User[]; onRefresh: () => void; currentUser: User }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [subView, setSubView] = useState<'list' | 'view' | 'edit'>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

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
    setSubView('list');
    setSelectedUser(null);
    await onRefresh();
  };

  const openView = (user: User) => { setSelectedUser(user); setSubView('view'); };
  const openEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm({ ...user });
    setEditSuccess(false);
    setSubView('edit');
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
          <button onClick={() => setSubView('list')} className="text-blue-600 hover:underline">User Management</button>
          <span className="text-gray-300 mx-1">›</span>
          <span className="text-gray-700 font-medium">{u.name}</span>
          <span className="text-gray-300 mx-1">›</span>
          <span className="text-gray-500">View</span>
        </nav>

        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Full Name', value: u.name },
            { label: 'Email', value: u.email },
            { label: 'Role', value: u.role, badge: roleBadge(u.role) },
            { label: 'Status', value: u.status || 'active', badge: statusBadge(u.status || 'active') },
            { label: 'Organization', value: u.organization || '—' },
            { label: 'Phone', value: u.phone || '—' },
            { label: 'Address', value: u.address || '—' },
            { label: 'City', value: u.city || '—' },
            { label: 'State', value: u.state || '—' },
            { label: 'Zip', value: u.zip || '—' },
            { label: 'Website', value: u.website || '—' },
            { label: 'Joined', value: new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
          ].map(f => (
            <div key={f.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{f.label}</div>
              {f.badge
                ? <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${f.badge}`}>{f.value}</span>
                : <div className="text-gray-800 text-sm font-medium">{f.value}</div>
              }
            </div>
          ))}
        </div>
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

    return (
      <div>
        <Toast toasts={toasts} onRemove={removeToast} />
        <DeleteModal />
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm mb-6">
          <button onClick={() => setSubView('list')} className="text-blue-600 hover:underline">User Management</button>
          <span className="text-gray-300 mx-1">›</span>
          <button onClick={() => setSubView('view')} className="text-blue-600 hover:underline">{selectedUser.name}</button>
          <span className="text-gray-300 mx-1">›</span>
          <span className="text-gray-500">Edit</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
          <button onClick={() => setDeleteTarget(selectedUser)} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">
            <Trash2 className="w-3.5 h-3.5" /> Delete Account
          </button>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* LEFT — User Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100">User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {field('name', 'Full Name')}
              {field('email', 'Email Address', 'email')}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select
                  value={editForm.role || ''}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value as any }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="angler">Angler</option>
                  <option value="director">Director</option>
                  <option value="judge">Judge</option>
                  <option value="sponsor">Partner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  value={editForm.status || 'active'}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value as any }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="paused">Paused</option>
                  <option value="banned">Banned</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              {field('organization', 'Organization')}
              {field('phone', 'Phone Number')}
              <div className="md:col-span-2">
                <AddressSelector
                  value={{
                    address: editForm.address || '',
                    country: editForm.country || 'US',
                    state: editForm.state || '',
                    city: editForm.city || '',
                    zip: editForm.zip || '',
                  }}
                  onChange={v => setEditForm(f => ({ ...f, address: v.address, country: v.country, state: v.state, city: v.city, zip: v.zip }))}
                  inputClass="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  labelClass="block text-sm font-medium text-gray-700 mb-1.5"
                />
              </div>
              {field('website', 'Website')}
            </div>

            {editSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                ✅ Changes saved successfully.
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setSubView('view')} className="px-5 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition text-sm">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={editSaving} className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm">
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* RIGHT — Change Password */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-800 mb-1 pb-3 border-b border-gray-100">Change Password</h3>
            <p className="text-gray-500 text-sm mb-5 mt-3">
              {isOwnAccount
                ? 'Changing your own password requires your current password.'
                : `Set a new password for ${selectedUser.name}. They will receive an email notification.`
              }
            </p>

            <div className="space-y-4">
              {/* Current password — only shown when admin is editing their OWN account */}
              {isOwnAccount && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password *</label>
                  <div className="relative">
                    <input
                      type={showPwCurrent ? 'text' : 'password'}
                      value={pwForm.current}
                      onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                      placeholder="Enter your current password"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    />
                    <button type="button" onClick={() => setShowPwCurrent(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPwCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password *</label>
                <div className="relative">
                  <input
                    type={showPwNew ? 'text' : 'password'}
                    value={pwForm.newPw}
                    onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  />
                  <button type="button" onClick={() => setShowPwNew(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password strength hint */}
                {pwForm.newPw && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 w-8 rounded-full ${
                          pwForm.newPw.length >= i * 3
                            ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-orange-400' : i <= 3 ? 'bg-yellow-400' : 'bg-green-500'
                            : 'bg-gray-200'
                        }`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">
                      {pwForm.newPw.length < 4 ? 'Too short' : pwForm.newPw.length < 7 ? 'Weak' : pwForm.newPw.length < 10 ? 'Fair' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password *</label>
                <div className="relative">
                  <input
                    type={showPwConfirm ? 'text' : 'password'}
                    value={pwForm.confirm}
                    onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                    placeholder="Re-enter new password"
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                      pwForm.confirm && pwForm.newPw !== pwForm.confirm
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                  />
                  <button type="button" onClick={() => setShowPwConfirm(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={changePasswordForUser}
                disabled={pwSaving || !pwForm.newPw || !pwForm.confirm || pwForm.newPw !== pwForm.confirm}
                className="w-full py-2.5 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-700 transition disabled:opacity-40 text-sm"
              >
                {pwSaving ? 'Updating Password...' : 'Update Password'}
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">
                {isOwnAccount
                  ? 'A confirmation email will be sent to your address.'
                  : `A notification email will be sent to ${selectedUser.email}.`
                }
              </p>
            </div>
          </div>

        </div>
      </div>
    );
  }
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── User List ─────────────────────────────────────────────────────────────
  return (
    <div>
      <DeleteModal />

      {/* Pending Judge Approvals */}
      {pendingJudges.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
          <h3 className="font-bold text-yellow-900 mb-1 flex items-center gap-2">
            ⏳ Pending Judge Approvals ({pendingJudges.length})
          </h3>
          <p className="text-yellow-700 text-sm mb-4">These judges are waiting for approval to be connected to their tournament director.</p>
          <div className="space-y-3">
            {pendingJudges.map(j => (
              <div key={j.id} className="bg-white border border-yellow-200 rounded-lg p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-gray-900">{j.name}</div>
                  <div className="text-sm text-gray-500">{j.email}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Director: {j.message || '—'}</div>
                </div>
                <button onClick={() => doAction(j.id, 'approve')} disabled={!!actionLoading}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 whitespace-nowrap">
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <span className="text-sm text-gray-500">{filtered.length} of {users.length} users</span>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
          className="flex-1 min-w-48 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="director">Director</option>
          <option value="judge">Judge</option>
          <option value="angler">Angler</option>
          <option value="sponsor">Partner</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase ${h === 'Actions' ? 'text-center' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No users found</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadge(u.role)}`}>{u.role === 'sponsor' ? 'partner' : u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(u.status || 'active')}`}>{u.status || 'active'}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {/* View */}
                    <button onClick={() => openView(u)} title="View user"
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" >
                      <Eye className="w-4 h-4" />
                    </button>
                    {/* Edit */}
                    <button onClick={() => openEdit(u)} title="Edit user"
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition">
                      <Pencil className="w-4 h-4" />
                    </button>
                    {/* Pause / Unpause */}
                    {u.status === 'paused'
                      ? <button onClick={() => doAction(u.id, 'unpause')} disabled={actionLoading === u.id + 'unpause'} title="Unpause account"
                          className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition disabled:opacity-40">
                          <Play className="w-4 h-4" />
                        </button>
                      : <button onClick={() => doAction(u.id, 'pause')} disabled={actionLoading === u.id + 'pause'} title="Pause account"
                          className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition disabled:opacity-40">
                          <Pause className="w-4 h-4" />
                        </button>
                    }
                    {/* Ban / Unban */}
                    {u.status === 'banned'
                      ? <button onClick={() => doAction(u.id, 'unban')} disabled={actionLoading === u.id + 'unban'} title="Remove ban"
                          className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition disabled:opacity-40">
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      : <button onClick={() => doAction(u.id, 'ban')} disabled={actionLoading === u.id + 'ban'} title="Ban account"
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition disabled:opacity-40">
                          <ShieldOff className="w-4 h-4" />
                        </button>
                    }
                    {/* Delete */}
                    <button onClick={() => setDeleteTarget(u)} title="Delete account"
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// TOURNAMENTS TAB
// ============================================================
function TournamentsTab({ tournaments }: { tournaments: Tournament[] }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Tournament Management</h2>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Name', 'Location', 'Date', 'Status', 'Created By'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tournaments.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No tournaments yet</td></tr>
            ) : tournaments.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                <td className="px-4 py-3 text-gray-600">{t.city}, {t.state}</td>
                <td className="px-4 py-3 text-gray-600">{t.startDate}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    t.status === 'active' ? 'bg-green-100 text-green-700' :
                    t.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                    'bg-blue-100 text-blue-700'
                  }`}>{t.status || 'upcoming'}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{t.createdBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// SUBMISSIONS TAB
// ============================================================
function SubmissionsTab({ submissions }: { submissions: Submission[] }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Catch Submissions</h2>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Angler', 'Species', 'Size', 'Tournament', 'Status', 'Submitted'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {submissions.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No submissions yet</td></tr>
            ) : submissions.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{s.angler}</td>
                <td className="px-4 py-3 text-gray-600">{s.species}</td>
                <td className="px-4 py-3 text-gray-600">{s.size}"</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{s.tournamentId.slice(0, 8)}...</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.status === 'approved' ? 'bg-green-100 text-green-700' :
                    s.status === 'denied' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{s.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(s.submittedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// PARTNERS TAB
// ============================================================
function PartnersTab({ partners }: { partners: User[] }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Partner Management</h2>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Name', 'Organization', 'Email', 'Status', 'Joined'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {partners.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No partners yet</td></tr>
            ) : partners.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.organization || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{p.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.status || 'pending'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// COMING SOON TAB
// ============================================================
function ComingSoonTab({ tab }: { tab: string }) {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="text-5xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{tab}</h2>
        <p className="text-gray-500">This section is coming soon.</p>
      </div>
    </div>
  );
}
