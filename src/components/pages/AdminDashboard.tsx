'use client';

import { useState, useEffect } from 'react';
import {
  Users, Trophy, BarChart3, Image, Settings, LogOut, Globe,
  Fish, Shield, DollarSign, Calendar, FileEdit, Heart,
  ChevronDown, TrendingUp, Scale, Megaphone
} from 'lucide-react';
import { User, Tournament, Series, Submission } from '@/types';
import { fetchUsers, fetchTournaments, fetchSeries, fetchSubmissions } from '@/lib/storage';
import { clearSession } from '@/lib/auth';

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
        {activeTab === 'Users' && <UsersTab users={users} onRefresh={() => fetchUsers().then(setUsers)} />}
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
function UsersTab({ users, onRefresh }: { users: User[]; onRefresh: () => void }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const pendingJudges = users.filter(u => u.role === 'judge' && u.status === 'pending');

  const approveJudge = async (userId: string) => {
    setApprovingId(userId);
    const { updateUser } = await import('@/lib/supabase');
    await updateUser(userId, { status: 'active' });
    await onRefresh();
    setApprovingId(null);
  };

  const filtered = users.filter(u =>
    (roleFilter === 'all' || u.role === roleFilter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      admin: 'bg-red-100 text-red-700',
      director: 'bg-blue-100 text-blue-700',
      judge: 'bg-purple-100 text-purple-700',
      angler: 'bg-green-100 text-green-700',
      sponsor: 'bg-orange-100 text-orange-700',
    };
    return map[role] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div>
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
                  <div className="text-xs text-gray-400 mt-0.5">Referred by director: {j.message || '—'}</div>
                </div>
                <button
                  onClick={() => approveJudge(j.id)}
                  disabled={approvingId === j.id}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 whitespace-nowrap"
                >
                  {approvingId === j.id ? 'Approving...' : 'Approve'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <span className="text-sm text-gray-500">{filtered.length} users</span>
      </div>
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 min-w-48 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="director">Director</option>
          <option value="judge">Judge</option>
          <option value="angler">Angler</option>
          <option value="sponsor">Partner</option>
        </select>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Joined'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No users found</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadge(u.role)}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.status || 'active'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
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
