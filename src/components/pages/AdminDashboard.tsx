'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Trophy, BarChart3, Image, Settings,
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
import { createAllDemoAccounts, changePassword, type DemoAccountResult } from '@/lib/auth';
import AddressSelector from '@/components/ui/AddressSelector';
import { Toast, useToast } from '@/components/ui/Toast';
import HeroSlidesManager from '@/components/admin/HeroSlidesManager';
import HomeBannersManager from '@/components/admin/HomeBannersManager';
import EventSubmissionsManager from '@/components/admin/EventSubmissionsManager';
import ClubSubmissionsManager from '@/components/admin/ClubSubmissionsManager';
import ClubFeatureRequestsManager from '@/components/admin/ClubFeatureRequestsManager';
import FeaturePricingEditor from '@/components/admin/FeaturePricingEditor';
import SpeciesManager from '@/components/admin/SpeciesManager';

interface AdminDashboardProps {
  currentUser: User;
  onNavigate: (view: string) => void;
  onNavigateReplace: (view: string) => void;
  onLogout: () => void;
  initialTab?: string;
  usersSubView?: string;
  usersSelectedId?: string;
  usersFilter?: string;
}

const TAB_TO_PATH: Record<string, string> = {
  'Dashboard':        '/admin',
  'Users':            '/admin/users',
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

export default function AdminDashboard({ currentUser, onNavigate, initialTab, usersSubView, usersSelectedId, usersFilter }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState(initialTab || 'Dashboard');
  const [usersTabKey] = useState(0);
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

  return (
    <div className="font-roboto flex flex-col text-[#0D1B4C]">
      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto w-full px-4 md:px-5 py-8">
        {activeTab === 'Dashboard' && (
          <DashboardTab
            users={users} tournaments={tournaments} series={series} submissions={submissions}
            directors={directors} judges={judges} anglers={anglers} partners={partners}
            loading={loading} onTabChange={(t: string) => { setActiveTab(t); if (TAB_TO_PATH[t]) onNavigate(TAB_TO_PATH[t]); }}
          />
        )}
        {activeTab === 'Users' && <UsersTab key={usersTabKey} users={users} onRefresh={() => { fetchUsers().then(setUsers); }} currentUser={currentUser} onNavigate={onNavigate} subViewProp={usersSubView} selectedUserId={usersSelectedId} initialFilter={usersFilter} />}
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
      </div>
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
      <h1 className="font-montserrat text-3xl font-bold text-[#0D1B4C] mb-1">Hoox Command Center</h1>
      <p className="text-[#5F6F86] mb-8">Manage users, tournaments, and platform settings</p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0E7C7B]" />
        </div>
      ) : (
        <>
          {/* Demo Accounts Setup */}
          <div className="bg-[#EEF8F8] border border-[#BFE6E6] rounded-lg p-5 mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-montserrat font-bold text-[#0D1B4C] flex items-center gap-2 mb-1">
                  <FlaskConical className="w-4 h-4" /> Demo Account Setup
                </h3>
                <p className="text-[#0B6564] text-sm mb-1">Create all test accounts with password <code className="bg-[#E3F4F4] px-1.5 py-0.5 rounded font-mono text-xs">demo123</code></p>
                <div className="flex flex-wrap gap-2 text-xs text-[#0E7C7B] mt-2">
                  {[
                    { label: 'Director', email: 'tournamentdirector@hoox.app' },
                    { label: 'Angler', email: 'angler@hoox.app' },
                    { label: 'Judge', email: 'judge@hoox.app' },
                    { label: 'Partner', email: 'partner@hoox.app' },
                  ].map(a => (
                    <span key={a.email} className="bg-[#E3F4F4] px-2 py-1 rounded-full">
                      <span className="font-semibold">{a.label}:</span> {a.email}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSeedDemoAccounts}
                disabled={seeding}
                className="px-5 py-2.5 bg-[#0E7C7B] text-white font-semibold rounded-lg hover:bg-[#0B6564] transition disabled:opacity-50 whitespace-nowrap flex-shrink-0"
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
              { label: 'Total Users', value: users.length, sub: 'All platform users', icon: Users, color: 'text-[#4A5B76]' },
              { label: 'Total Series', value: series.length, sub: 'Tournament series', icon: TrendingUp, color: 'text-[#4A5B76]' },
              { label: 'Total Tournaments', value: tournaments.length, sub: 'All tournaments', icon: Trophy, color: 'text-[#4A5B76]' },
              { label: 'Total Ads', value: 5, sub: 'All advertisements', icon: Image, color: 'text-[#4A5B76]' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-[#E8EEF4] rounded-lg p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[#4A5B76]">{s.label}</span>
                  <s.icon className={`w-5 h-5 ${s.color} opacity-50`} />
                </div>
                <div className="text-3xl font-bold text-[#0D1B4C] mb-1">{s.value}</div>
                <div className="text-xs text-[#8A9AB0]">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Role Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Tournament Directors', value: directors.length, sub: 'Total directors', color: 'text-[#0E7C7B] bg-[#EEF8F8] border-[#D6EFEF]', icon: Trophy },
              { label: 'Judges', value: judges.length, sub: 'Total judges', color: 'text-purple-600 bg-purple-50 border-purple-100', icon: Scale },
              { label: 'Anglers', value: anglers.length, sub: 'Registered anglers', color: 'text-green-600 bg-green-50 border-green-100', icon: Fish },
              { label: 'Partners', value: partners.length, sub: 'Active partners', color: 'text-orange-600 bg-orange-50 border-orange-100', icon: Heart },
            ].map(s => (
              <div key={s.label} className={`border rounded-lg p-5 ${s.color}`}>
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
          <h2 className="font-montserrat text-xl font-bold text-[#0D1B4C] mb-5">Administrative Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { icon: Megaphone, color: 'bg-pink-100 text-pink-600', title: 'Advertising', desc: 'Upload and manage banner ads for public-facing pages', btn: 'Manage Ads', tab: 'Advertising' },
              { icon: FileEdit, color: 'bg-purple-100 text-purple-600', title: 'CMS', desc: 'Manage website content, pages, and media assets', btn: 'Manage Content', tab: 'CMS' },
              { icon: DollarSign, color: 'bg-green-100 text-green-600', title: 'Monetization', desc: 'Manage pricing, subscriptions, revenue, and payment processing', btn: 'Manage Monetization', tab: 'Monetization' },
            ].map(t => (
              <div key={t.title} className="bg-white border border-[#E8EEF4] rounded-lg p-6 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${t.color}`}>
                  <t.icon className="w-5 h-5" />
                </div>
                <h3 className="font-montserrat font-bold text-[#0D1B4C] mb-2">{t.title}</h3>
                <p className="text-[#5F6F86] text-sm mb-4">{t.desc}</p>
                <button onClick={() => onTabChange(t.tab)} className="w-full py-2 border border-[#E8EEF4] rounded-lg text-sm font-medium text-[#2E3F5C] hover:bg-[#F5F8FB] transition">
                  {t.btn}
                </button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-[#E8EEF4] rounded-lg p-6 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-[#E3F4F4] text-[#0E7C7B]">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-montserrat font-bold text-[#0D1B4C] mb-2">Events Management</h3>
              <p className="text-[#5F6F86] text-sm mb-4">Manage expos, boat shows, and other fishing events</p>
              <button onClick={() => onTabChange('Events')} className="w-full py-2 border border-[#E8EEF4] rounded-lg text-sm font-medium text-[#2E3F5C] hover:bg-[#F5F8FB] transition">
                Manage Events
              </button>
            </div>
          </div>

          {/* Management Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users, color: 'bg-[#E3F4F4] text-[#0E7C7B]', title: 'User Management', desc: 'Manage user accounts, roles, and permissions across the platform', btn: 'Manage Users', tab: 'Users' },
              { icon: Heart, color: 'bg-orange-100 text-orange-600', title: 'Partner Management', desc: 'Review partner applications and manage partnership agreements', btn: 'Manage Partners', tab: 'Partners' },
              { icon: TrendingUp, color: 'bg-purple-100 text-purple-600', title: 'Series Management', desc: 'Manage tournament series, standings, and seasonal configurations', btn: 'Manage Series', tab: 'Series' },
              { icon: Trophy, color: 'bg-teal-100 text-[#0E7C7B]', title: 'Tournament Management', desc: 'Oversee all tournaments, review settings, and monitor activity', btn: 'Manage Tournaments', tab: 'Tournaments' },
            ].map(t => (
              <div key={t.title} className="bg-white border border-[#E8EEF4] rounded-lg p-6 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${t.color}`}>
                  <t.icon className="w-5 h-5" />
                </div>
                <h3 className="font-montserrat font-bold text-[#0D1B4C] mb-2">{t.title}</h3>
                <p className="text-[#5F6F86] text-sm mb-4">{t.desc}</p>
                <button onClick={() => onTabChange(t.tab)} className="w-full py-2 border border-[#E8EEF4] rounded-lg text-sm font-medium text-[#2E3F5C] hover:bg-[#F5F8FB] transition">
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
function UsersTab({ users, onRefresh, currentUser, onNavigate, subViewProp, selectedUserId, initialFilter }: {
  users: User[];
  onRefresh: () => void;
  currentUser: User;
  onNavigate: (path: string) => void;
  subViewProp?: string;
  selectedUserId?: string;
  initialFilter?: string;
}) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(initialFilter || 'all');
  const subView = subViewProp || 'dashboard';
  const selectedUser = users.find(u => u.id === selectedUserId) || null;
  // The signed-in admin's own record lives at /admin/profile (opened from their name in the header)
  const isSelf = (id?: string) => !!id && id === currentUser.id;
  const viewPath = (id?: string) => (isSelf(id) ? '/admin/profile' : `/admin/users/${id ?? ''}`);
  const editPath = (id?: string) => (isSelf(id) ? '/admin/profile/edit' : `/admin/users/${id ?? ''}/edit`);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  // View/Edit page tab state
  // Admins have no role-specific profile fields yet, so open on Account Info for them
  const adminRecord = selectedUser?.role === 'admin' || (isSelf(selectedUserId) && currentUser.role === 'admin');
  const [viewTab, setViewTab] = useState<'profile' | 'account'>(adminRecord ? 'account' : 'profile');
  const [editTab, setEditTab] = useState<'profile' | 'account' | 'security'>(adminRecord ? 'account' : 'profile');

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
    // Pre-fill judge profile form from saved profile data (separate profile_ columns)
    if (selectedUser.role === 'judge') {
      setJudgeProfile(p => ({
        ...p,
        avatar:           selectedUser.profileAvatar || '',
        displayName:      selectedUser.profileDisplayName || '',
        organization:     selectedUser.profileOrganization || '',
        address:          selectedUser.profileAddress || '',
        city:             selectedUser.profileCity || '',
        state:            selectedUser.profileState || '',
        zip:              selectedUser.profileZip || '',
        country:          selectedUser.profileCountry || '',
        email:            selectedUser.profileEmail || '',
        phone:            selectedUser.profilePhone || '',
        website:          selectedUser.profileWebsite || '',
        clubAffiliations: selectedUser.profileClubAffiliations || [],
        sponsors:         selectedUser.profileSponsors || [],
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

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    let matchFilter = true;
    if (roleFilter === 'active') matchFilter = u.status === 'active';
    else if (roleFilter === 'new') matchFilter = new Date(u.createdAt) >= thirtyDaysAgo;
    else if (roleFilter !== 'all') matchFilter = u.role === roleFilter;
    return matchSearch && matchFilter;
  });

  const roleBadge = (role: string) => ({
    admin:    'bg-red-100 text-red-700',
    director: 'bg-[#E3F4F4] text-[#0B6564]',
    judge:    'bg-purple-100 text-purple-700',
    angler:   'bg-green-100 text-green-700',
    sponsor:  'bg-orange-100 text-orange-700',
  }[role] || 'bg-[#EEF3F8] text-[#4A5B76]');

  const statusBadge = (status: string) => ({
    active:   'bg-green-100 text-green-700',
    pending:  'bg-yellow-100 text-yellow-700',
    paused:   'bg-orange-100 text-orange-700',
    banned:   'bg-red-100 text-red-700',
    inactive: 'bg-[#EEF3F8] text-[#5F6F86]',
  }[status] || 'bg-[#EEF3F8] text-[#4A5B76]');

  const doAction = async (userId: string, action: 'approve' | 'pause' | 'unpause' | 'ban' | 'unban') => {
    setActionLoading(userId + action);
    // Goes through a server route that re-verifies we're actually logged in
    // as an admin before touching anything (see src/app/api/admin/users/[id]/route.ts) —
    // this used to call the Supabase anon key directly from the browser.
    await fetch(`/api/admin/users/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    await onRefresh();
    // Refresh selectedUser if we're in view/edit
    setActionLoading(null);
  };

  const doDelete = async (userId: string) => {
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    setDeleteTarget(null);
    onNavigate('/admin/users/list');
    await onRefresh();
  };

  const openView = (user: User) => { onNavigate(viewPath(user.id)); };
  const openEdit = (user: User) => {
    setEditForm({ ...user });
    setEditSuccess(false);
    setEditTab(user.role === 'admin' ? 'account' : 'profile');
    // Pre-populate judge profile form if editing a judge (separate profile_ columns)
    if (user.role === 'judge') {
      setJudgeProfile(p => ({
        ...p,
        avatar:           user.profileAvatar || '',
        displayName:      user.profileDisplayName || '',
        organization:     user.profileOrganization || '',
        address:          user.profileAddress || '',
        city:             user.profileCity || '',
        state:            user.profileState || '',
        zip:              user.profileZip || '',
        country:          user.profileCountry || '',
        email:            user.profileEmail || '',
        phone:            user.profilePhone || '',
        website:          user.profileWebsite || '',
        clubAffiliations: user.profileClubAffiliations || [],
        sponsors:         user.profileSponsors || [],
        newClub:          { name: '', website: '' },
        newSponsor:       { name: '', website: '' },
      }));
    }
    onNavigate(editPath(user.id));
  };

  const saveEdit = async () => {
    if (!selectedUser) return;
    setEditSaving(true);
    // Goes through a server route that re-verifies we're actually logged in
    // as an admin before touching anything (see src/app/api/admin/users/[id]/route.ts) —
    // this used to call the Supabase anon key directly from the browser.
    await fetch(`/api/admin/users/${selectedUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
      }),
    });
    await onRefresh();
    setEditSaving(false);
    setEditSuccess(true);
    toastSuccess('User information saved successfully.');
    onNavigate(viewPath(selectedUser?.id));
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
        <h2 className="font-montserrat text-xl font-bold text-[#0D1B4C] text-center mb-2">Delete Account?</h2>
        <p className="text-[#5F6F86] text-sm text-center mb-2">
          You are about to permanently delete the account for:
        </p>
        <p className="text-center font-semibold text-[#0D1B4C] mb-4">{deleteTarget.name} ({deleteTarget.email})</p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm font-semibold mb-1">⚠️ This action is irreversible</p>
          <p className="text-red-600 text-sm">Once deleted, this account cannot be recovered. The user will receive an "Account not found" error if they attempt to log in.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)}
            className="flex-1 py-3 border border-[#E8EEF4] text-[#2E3F5C] font-semibold rounded-lg hover:bg-[#F5F8FB] transition">
            Cancel
          </button>
          <button onClick={() => doDelete(deleteTarget.id)}
            className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition">
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
        {isSelf(u.id) ? (
          <nav className="flex items-center gap-1 text-sm mb-6">
            <span className="text-[#5F6F86]">My Profile</span>
          </nav>
        ) : (
          <nav className="flex items-center gap-1 text-sm mb-6">
            <button onClick={() => onNavigate('/admin/users')} className="text-[#0E7C7B] hover:underline">Users</button>
            <span className="text-[#B9C6D4] mx-1">›</span>
            <button onClick={() => onNavigate('/admin/users/list')} className="text-[#0E7C7B] hover:underline">User Management</button>
            <span className="text-[#B9C6D4] mx-1">›</span>
            <span className="text-[#5F6F86]">{u.name}</span>
          </nav>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-2 flex-wrap gap-3">
          <div>
            <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C]">{u.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadge(u.role)}`}>
                {u.role === 'sponsor' ? 'partner' : u.role}
              </span>
              <span className="text-[#8A9AB0] text-sm">{u.email}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(u.status || 'active')}`}>
                {u.status || 'active'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => openEdit(u)} className="flex items-center gap-1.5 px-4 py-2 bg-[#0E7C7B] text-white rounded-lg text-sm font-medium hover:bg-[#0B6564] transition">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            {/* No pausing, banning or deleting your own account */}
            {!isSelf(u.id) && <>
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
            </>}
          </div>
        </div>

        {/* Two tabs */}
        <div className="flex border-b border-[#E8EEF4] mb-6">
          {(['profile', 'account'] as const).map(tab => {
            const labels = { profile: 'Profile', account: 'Account Info' };
            return (
              <button key={tab} onClick={() => setViewTab(tab)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition -mb-px ${
                  viewTab === tab
                    ? 'border-[#0E7C7B] text-[#0E7C7B]'
                    : 'border-transparent text-[#5F6F86] hover:text-[#2E3F5C]'
                }`}>
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* ── Profile Tab ── */}
        {viewTab === 'profile' && (
          <div className="bg-white border border-[#E8EEF4] rounded-lg p-6 max-w-2xl shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
            <h3 className="font-montserrat font-semibold text-[#0D1B4C] mb-5 pb-3 border-b border-[#EEF3F8]">
              {u.role === 'sponsor' ? 'Partner' :
               u.role === 'director' ? 'Tournament Director' :
               u.role.charAt(0).toUpperCase() + u.role.slice(1)} Profile
            </h3>

            {u.role === 'judge' && (
              <div className="divide-y divide-[#EEF3F8]">
                {/* Avatar */}
                {u.profileAvatar && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-[#5F6F86] w-40 flex-shrink-0">Avatar</span>
                    <img src={u.profileAvatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                  </div>
                )}
                {[
                  { label: 'Display Name',   value: u.profileDisplayName || '—' },
                  { label: 'Organization',   value: u.profileOrganization || '—' },
                  { label: 'Street Address', value: u.profileAddress || '—' },
                  { label: 'City',           value: u.profileCity || '—' },
                  { label: 'State',          value: u.profileState || '—' },
                  { label: 'Zip Code',       value: u.profileZip || '—' },
                  { label: 'Country',        value: u.profileCountry || '—' },
                  { label: 'Email',          value: u.profileEmail || '—' },
                  { label: 'Phone',          value: u.profilePhone || '—' },
                  { label: 'Website',        value: u.profileWebsite || '—' },
                ].map(f => (
                  <div key={f.label} className="flex items-center justify-between py-3">
                    <span className="text-sm text-[#5F6F86] w-40 flex-shrink-0">{f.label}</span>
                    <span className="text-sm font-medium text-[#0D1B4C] text-right">{f.value}</span>
                  </div>
                ))}

                {/* Club Affiliations */}
                <div className="py-4">
                  <span className="text-sm text-[#5F6F86] block mb-2">Club Affiliation(s)</span>
                  {(u.profileClubAffiliations || []).length === 0
                    ? <span className="text-sm text-[#8A9AB0]">None</span>
                    : <div className="flex flex-wrap gap-2">
                        {(u.profileClubAffiliations || []).map((c, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-3 py-1 bg-[#EEF8F8] text-[#0B6564] rounded-full text-sm">
                            <span>{c.name}</span>
                            {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="text-[#22B3B5] hover:text-[#0E7C7B] text-xs underline ml-1">{c.website}</a>}
                          </div>
                        ))}
                      </div>
                  }
                </div>

                {/* Sponsors */}
                <div className="py-4">
                  <span className="text-sm text-[#5F6F86] block mb-2">Sponsor(s)</span>
                  {(u.profileSponsors || []).length === 0
                    ? <span className="text-sm text-[#8A9AB0]">None</span>
                    : <div className="flex flex-wrap gap-2">
                        {(u.profileSponsors || []).map((s, i) => (
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
              <div className="flex flex-col items-center justify-center py-10 text-center text-[#8A9AB0]">
                <div className="w-16 h-16 bg-[#EEF3F8] rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-[#B9C6D4]" />
                </div>
                <p className="text-sm font-medium text-[#5F6F86]">Profile information coming soon</p>
                <p className="text-xs text-[#8A9AB0] mt-1">Role-specific profile details will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* ── Account Info Tab ── */}
        {viewTab === 'account' && (
          <div className="bg-white border border-[#E8EEF4] rounded-lg p-6 max-w-2xl shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
            <h3 className="font-montserrat font-semibold text-[#0D1B4C] mb-5 pb-3 border-b border-[#EEF3F8]">Account Information</h3>
            <div className="space-y-0 divide-y divide-[#EEF3F8]">
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
                  <span className="text-sm text-[#5F6F86] w-36 flex-shrink-0">{f.label}</span>
                  {f.badge
                    ? <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${f.badge}`}>{f.value}</span>
                    : <span className="text-sm font-medium text-[#0D1B4C] text-right">{f.value}</span>
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
        <label className="block text-sm font-medium text-[#2E3F5C] mb-1.5">{label}</label>
        <input
          type={type}
          value={(editForm[key] as string) || ''}
          onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full px-4 py-2.5 border border-[#D3DEE8] rounded-lg text-sm focus:ring-2 focus:ring-[#22B3B5] focus:border-transparent"
        />
      </div>
    );

    const roleBadgeColor = (role: string): string => {
      const map: Record<string, string> = {
        admin:    'bg-red-100 text-red-700',
        director: 'bg-[#E3F4F4] text-[#0B6564]',
        judge:    'bg-purple-100 text-purple-700',
        angler:   'bg-green-100 text-green-700',
        sponsor:  'bg-orange-100 text-orange-700',
      };
      return map[role] || 'bg-[#EEF3F8] text-[#4A5B76]';
    };

    return (
      <div>
        <Toast toasts={toasts} onRemove={removeToast} />
        <DeleteModal />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm mb-6">
          {isSelf(selectedUser.id) ? (
            <button onClick={() => onNavigate('/admin/profile')} className="text-[#0E7C7B] hover:underline">My Profile</button>
          ) : (<>
          <button onClick={() => onNavigate('/admin/users')} className="text-[#0E7C7B] hover:underline">Users</button>
          <span className="text-[#B9C6D4] mx-1">›</span>
          <button onClick={() => onNavigate('/admin/users/list')} className="text-[#0E7C7B] hover:underline">User Management</button>
          <span className="text-[#B9C6D4] mx-1">›</span>
          <button onClick={() => onNavigate(viewPath(selectedUser?.id))} className="text-[#0E7C7B] hover:underline">{selectedUser.name}</button>
          </>)}
          <span className="text-[#B9C6D4] mx-1">›</span>
          <span className="text-[#5F6F86]">Edit</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
          <div>
            <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C]">{selectedUser.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadgeColor(selectedUser.role)}`}>
                {selectedUser.role === 'sponsor' ? 'partner' : selectedUser.role}
              </span>
              <span className="text-[#8A9AB0] text-sm">{selectedUser.email}</span>
            </div>
          </div>
          {!isSelf(selectedUser.id) && (
          <button onClick={() => setDeleteTarget(selectedUser)} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">
            <Trash2 className="w-3.5 h-3.5" /> Delete Account
          </button>
          )}
        </div>

        {/* Three tabs */}
        <div className="flex border-b border-[#E8EEF4] mb-6">
          {(['profile', 'account', 'security'] as const).map(tab => {
            const labels = { profile: 'Profile', account: 'Account Info', security: 'Security Settings' };
            return (
              <button key={tab} onClick={() => setEditTab(tab)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition -mb-px ${
                  editTab === tab
                    ? 'border-[#0E7C7B] text-[#0E7C7B]'
                    : 'border-transparent text-[#5F6F86] hover:text-[#2E3F5C]'
                }`}>
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* ── Profile Tab ── */}
        {editTab === 'profile' && (
          <div className="bg-white border border-[#E8EEF4] rounded-lg p-6 max-w-2xl shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
            <h3 className="font-montserrat font-semibold text-[#0D1B4C] mb-5 pb-3 border-b border-[#EEF3F8]">
              {selectedUser.role === 'sponsor' ? 'Partner' :
               selectedUser.role === 'director' ? 'Tournament Director' :
               selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)} Profile
            </h3>

            {selectedUser.role === 'judge' && (() => {
              const jp = judgeProfile;
              const setJp = (key: string, val: any) => setJudgeProfile(p => ({ ...p, [key]: val }));
              const inputCls = "w-full px-4 py-2.5 border border-[#D3DEE8] rounded-lg text-sm focus:ring-2 focus:ring-[#22B3B5] focus:border-transparent";
              const labelCls = "block text-sm font-medium text-[#2E3F5C] mb-1.5";
              return (
                <div className="space-y-5">

                  {/* Avatar */}
                  <div>
                    <label className={labelCls}>Avatar Image</label>
                    <div className="flex gap-2">
                      <input type="text" value={jp.avatar} placeholder="Upload image"
                        onChange={e => setJp('avatar', e.target.value)}
                        className={`${inputCls} flex-grow`} />
                      <button className="px-4 py-2.5 border border-[#D3DEE8] rounded-lg text-sm text-[#4A5B76] hover:bg-[#F5F8FB] transition whitespace-nowrap">Browse</button>
                    </div>
                    <p className="text-xs text-[#8A9AB0] mt-1">Recommended: Square image, at least 200×200px</p>
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
                    <p className="text-sm font-semibold text-[#0D1B4C] mb-0.5">Club Affiliation(s)</p>
                    <p className="text-xs text-[#8A9AB0] mb-3">Add one or more club affiliations</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {jp.clubAffiliations.map((c, i) => (
                        <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-[#EEF8F8] text-[#0B6564] rounded-full text-sm">
                          {c.name}
                          <button onClick={() => setJp('clubAffiliations', jp.clubAffiliations.filter((_: any, j: number) => j !== i))}
                            className="text-[#22B3B5] hover:text-[#0B6564] ml-1">×</button>
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
                      }} className="flex items-center gap-1 px-3 py-2.5 text-sm text-[#4A5B76] hover:text-[#0E7C7B] whitespace-nowrap">
                        <span className="text-lg leading-none">+</span> Add
                      </button>
                    </div>
                    <p className="text-xs text-[#8A9AB0] mt-1">Website must include full url: www.website.com</p>
                  </div>

                  {/* Sponsors */}
                  <div>
                    <p className="text-sm font-semibold text-[#0D1B4C] mb-0.5">Sponsor(s)</p>
                    <p className="text-xs text-[#8A9AB0] mb-3">Add one or more sponsors</p>
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
                      }} className="flex items-center gap-1 px-3 py-2.5 text-sm text-[#4A5B76] hover:text-orange-600 whitespace-nowrap">
                        <span className="text-lg leading-none">+</span> Add
                      </button>
                    </div>
                    <p className="text-xs text-[#8A9AB0] mt-1">Website must include full url: www.website.com</p>
                  </div>

                  {/* Save */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-[#EEF3F8]">
                    <button onClick={() => onNavigate(viewPath(selectedUser.id))}
                      className="px-5 py-2.5 border border-[#E8EEF4] text-[#2E3F5C] font-medium rounded-lg hover:bg-[#F5F8FB] transition text-sm">
                      Cancel
                    </button>
                    <button onClick={async () => {
                      // Goes through a server route that re-verifies we're actually
                      // logged in as an admin before touching anything (see
                      // src/app/api/admin/users/[id]/route.ts) — this used to call
                      // the Supabase anon key directly from the browser.
                      await fetch(`/api/admin/users/${selectedUser.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          profile_avatar: jp.avatar,
                          profile_display_name: jp.displayName,
                          profile_organization: jp.organization,
                          profile_address: jp.address,
                          profile_city: jp.city,
                          profile_state: jp.state,
                          profile_zip: jp.zip,
                          profile_country: jp.country,
                          profile_email: jp.email,
                          profile_phone: jp.phone,
                          profile_website: jp.website,
                          profile_club_affiliations: jp.clubAffiliations,
                          profile_sponsors: jp.sponsors,
                        }),
                      });
                      toastSuccess('Judge profile saved successfully.');
                    }} className="px-5 py-2.5 bg-[#0E7C7B] text-white font-semibold rounded-lg hover:bg-[#0B6564] transition text-sm">
                      Update
                    </button>
                  </div>
                </div>
              );
            })()}

            {selectedUser.role !== 'judge' && (
              <div className="flex items-center gap-4 py-8 text-center justify-center text-[#8A9AB0]">
                <div>
                  <div className="text-4xl mb-3">👤</div>
                  <p className="text-sm font-medium text-[#5F6F86]">Profile fields coming soon</p>
                  <p className="text-xs text-[#8A9AB0] mt-1">Role-specific profile information will appear here</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Account Info Tab ── */}
        {editTab === 'account' && (
          <div className="bg-white border border-[#E8EEF4] rounded-lg p-6 max-w-2xl shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
            <h3 className="font-montserrat font-semibold text-[#0D1B4C] mb-4 pb-3 border-b border-[#EEF3F8]">User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {field('name', 'Full Name')}
              {field('email', 'Email Address', 'email')}
              <div>
                <label className="block text-sm font-medium text-[#2E3F5C] mb-1.5">Role</label>
                <select
                  value={editForm.role || ''}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value as any }))}
                  disabled={isSelf(selectedUser.id)}
                  title={isSelf(selectedUser.id) ? 'You can’t change your own role' : undefined}
                  className="w-full px-4 py-2.5 border border-[#D3DEE8] rounded-lg text-sm focus:ring-2 focus:ring-[#22B3B5] disabled:bg-[#F5F8FB] disabled:text-[#5F6F86]"
                >
                  <option value="angler">Angler</option>
                  <option value="director">Director</option>
                  <option value="judge">Judge</option>
                  <option value="sponsor">Partner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2E3F5C] mb-1.5">Status</label>
                <select
                  value={editForm.status || 'active'}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value as any }))}
                  disabled={isSelf(selectedUser.id)}
                  title={isSelf(selectedUser.id) ? 'You can’t change your own status' : undefined}
                  className="w-full px-4 py-2.5 border border-[#D3DEE8] rounded-lg text-sm focus:ring-2 focus:ring-[#22B3B5] disabled:bg-[#F5F8FB] disabled:text-[#5F6F86]"
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
                  inputClass="w-full px-4 py-2.5 border border-[#D3DEE8] rounded-lg text-sm focus:ring-2 focus:ring-[#22B3B5] focus:border-transparent"
                  labelClass="block text-sm font-medium text-[#2E3F5C] mb-1.5"
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
              <button onClick={() => onNavigate(viewPath(selectedUser?.id))} className="px-5 py-2.5 border border-[#E8EEF4] text-[#2E3F5C] font-medium rounded-lg hover:bg-[#F5F8FB] transition text-sm">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={editSaving} className="px-5 py-2.5 bg-[#0E7C7B] text-white font-semibold rounded-lg hover:bg-[#0B6564] transition disabled:opacity-50 text-sm">
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* ── Security Settings Tab ── */}
        {editTab === 'security' && (
          <div className="bg-white border border-[#E8EEF4] rounded-lg p-6 max-w-lg shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
            <h3 className="font-montserrat font-semibold text-[#0D1B4C] mb-1 pb-3 border-b border-[#EEF3F8]">Change Password</h3>
            <p className="text-[#5F6F86] text-sm mb-5 mt-3">
              {isOwnAccount
                ? 'Changing your own password requires your current password.'
                : `Set a new password for ${selectedUser.name}. They will receive an email notification.`
              }
            </p>
            <div className="space-y-4">
              {isOwnAccount && (
                <div>
                  <label className="block text-sm font-medium text-[#2E3F5C] mb-1.5">Current Password *</label>
                  <div className="relative">
                    <input
                      type={showPwCurrent ? 'text' : 'password'}
                      value={pwForm.current}
                      onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                      placeholder="Enter your current password"
                      className="w-full px-4 py-2.5 border border-[#D3DEE8] rounded-lg text-sm focus:ring-2 focus:ring-[#22B3B5] focus:border-transparent pr-10"
                    />
                    <button type="button" onClick={() => setShowPwCurrent(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9AB0] hover:text-[#4A5B76]">
                      {showPwCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[#2E3F5C] mb-1.5">New Password *</label>
                <div className="relative">
                  <input
                    type={showPwNew ? 'text' : 'password'}
                    value={pwForm.newPw}
                    onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-2.5 border border-[#D3DEE8] rounded-lg text-sm focus:ring-2 focus:ring-[#22B3B5] focus:border-transparent pr-10"
                  />
                  <button type="button" onClick={() => setShowPwNew(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9AB0] hover:text-[#4A5B76]">
                    {showPwNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwForm.newPw && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 w-8 rounded-full ${
                          pwForm.newPw.length >= i * 3
                            ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-orange-400' : i <= 3 ? 'bg-yellow-400' : 'bg-green-500'
                            : 'bg-[#E1E9F1]'
                        }`} />
                      ))}
                    </div>
                    <span className="text-xs text-[#8A9AB0]">
                      {pwForm.newPw.length < 4 ? 'Too short' : pwForm.newPw.length < 7 ? 'Weak' : pwForm.newPw.length < 10 ? 'Fair' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2E3F5C] mb-1.5">Confirm New Password *</label>
                <div className="relative">
                  <input
                    type={showPwConfirm ? 'text' : 'password'}
                    value={pwForm.confirm}
                    onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                    placeholder="Re-enter new password"
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#22B3B5] focus:border-transparent pr-10 ${
                      pwForm.confirm && pwForm.newPw !== pwForm.confirm ? 'border-red-300 bg-red-50' : 'border-[#D3DEE8]'
                    }`}
                  />
                  <button type="button" onClick={() => setShowPwConfirm(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9AB0] hover:text-[#4A5B76]">
                    {showPwConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-[#EEF3F8]">
              <button
                onClick={changePasswordForUser}
                disabled={pwSaving || !pwForm.newPw || !pwForm.confirm || pwForm.newPw !== pwForm.confirm}
                className="w-full py-2.5 bg-[#0E7C7B] text-white font-semibold rounded-lg hover:bg-[#0B6564] transition disabled:opacity-40 text-sm"
              >
                {pwSaving ? 'Updating Password...' : 'Update Password'}
              </button>
              <p className="text-xs text-[#8A9AB0] text-center mt-3">
                {isOwnAccount
                  ? 'A confirmation email will be sent to your address.'
                  : `A notification email will be sent to ${selectedUser.email}.`
                }
              </p>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ── User Dashboard ────────────────────────────────────────────────────────
  if (subView === 'dashboard') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers   = users.filter(u => u.status === 'active');
    const newThisMonth  = users.filter(u => new Date(u.createdAt) >= thirtyDaysAgo);
    const admins        = users.filter(u => u.role === 'admin');
    const directors     = users.filter(u => u.role === 'director');
    const anglers       = users.filter(u => u.role === 'angler');
    const judges        = users.filter(u => u.role === 'judge');
    const partners      = users.filter(u => u.role === 'sponsor');

    const roleCards = [
      { label: 'System Admins',         value: admins.length,    sub: 'System administrators',   icon: Shield,     filter: 'admin' },
      { label: 'Tournament Directors',   value: directors.length, sub: 'Tournament directors',     icon: Trophy,     filter: 'director' },
      { label: 'Anglers',               value: anglers.length,   sub: 'Registered anglers',       icon: Users,      filter: 'angler' },
      { label: 'Judges',                value: judges.length,    sub: 'Active judges',            icon: Scale,      filter: 'judge' },
      { label: 'Partners',              value: partners.length,  sub: 'Active partners',          icon: Heart,      filter: 'sponsor' },
    ];

    const toolCards = [
      { icon: Users,      color: 'bg-[#E3F4F4] text-[#0E7C7B]',   title: 'User Directory',       desc: 'View and manage all user accounts',                  btn: 'View All Users',      primary: true,  action: () => onNavigate('/admin/users/list') },
      { icon: Shield,     color: 'bg-purple-100 text-purple-600', title: 'Role Management',    desc: 'Assign and modify user roles and permissions',        btn: 'Manage Roles',        primary: false, action: () => {} },
      { icon: Megaphone,  color: 'bg-teal-100 text-[#0E7C7B]',   title: 'User Communication',   desc: 'Send notifications and announcements to users',       btn: 'Send Notification',   primary: false, action: () => {} },
      { icon: Activity,   color: 'bg-green-100 text-green-600', title: 'User Activity',        desc: 'Monitor user activity and engagement',                btn: 'View Activity',       primary: false, action: () => {} },
    ];

    return (
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C]">User Management</h2>
            <p className="text-[#5F6F86] text-sm mt-0.5">Manage user accounts, roles, and permissions across the platform</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'Add a Partner',             filter: 'sponsor' },
              { label: 'Add a Tournament Director',  filter: 'director' },
              { label: 'Add a Judge',               filter: 'judge' },
              { label: 'Add an Angler',             filter: 'angler' },
            ].map(b => (
              <button key={b.label} onClick={() => onNavigate('/admin/users/list')}
                className="px-4 py-2.5 bg-[#0E7C7B] text-white rounded-lg text-sm font-semibold hover:bg-[#0B6564] transition whitespace-nowrap">
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Total Users',     value: users.length,         sub: 'All registered users',      icon: Users,     onClick: () => onNavigate('/admin/users/list') },
            { label: 'Active Users',    value: activeUsers.length,   sub: 'Active in last 30 days',    icon: Activity,  onClick: () => onNavigate('/admin/users/list?filter=active') },
            { label: 'New This Month',  value: newThisMonth.length,  sub: 'New registrations',         icon: UserCheck, onClick: () => onNavigate('/admin/users/list?filter=new') },
          ].map(s => (
            <button key={s.label} onClick={s.onClick}
              className="bg-white border border-[#E8EEF4] rounded-lg p-5 text-left hover:border-[#22B3B5] hover:shadow-sm transition group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#5F6F86]">{s.label}</span>
                <s.icon className="w-5 h-5 text-[#B9C6D4] group-hover:text-[#22B3B5] transition" />
              </div>
              <div className="text-3xl font-bold text-[#0D1B4C] mb-1 group-hover:text-[#0E7C7B] transition">{s.value}</div>
              <div className="text-xs text-[#8A9AB0]">{s.sub}</div>
            </button>
          ))}
        </div>

        {/* Role breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {roleCards.map(r => (
            <button key={r.label} onClick={() => onNavigate(`/admin/users/list?filter=${r.filter}`)}
              className="bg-white border border-[#E8EEF4] rounded-lg p-4 text-left hover:border-[#22B3B5] hover:shadow-sm transition group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#5F6F86]">{r.label}</span>
                <r.icon className="w-4 h-4 text-[#B9C6D4] group-hover:text-[#22B3B5] transition" />
              </div>
              <div className="text-2xl font-bold text-[#0D1B4C] mb-1">{r.value}</div>
              <div className="text-xs text-[#8A9AB0]">{r.sub}</div>
            </button>
          ))}
        </div>

        {/* Tool cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {toolCards.map(t => (
            <div key={t.title} className="bg-white border border-[#E8EEF4] rounded-lg p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.color}`}>
                  <t.icon className="w-4 h-4" />
                </div>
                <h3 className="font-montserrat font-semibold text-[#0D1B4C] text-sm">{t.title}</h3>
              </div>
              <p className="text-[#5F6F86] text-sm mb-5 leading-relaxed">{t.desc}</p>
              <button onClick={t.action}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition ${
                  t.primary
                    ? 'bg-[#0E7C7B] text-white hover:bg-[#0B6564]'
                    : 'border border-[#D3DEE8] text-[#2E3F5C] hover:bg-[#F5F8FB]'
                }`}>
                {t.btn}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── User List ─────────────────────────────────────────────────────────────
  return (
    <div>
      <DeleteModal />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm mb-5">
        <button onClick={() => onNavigate('/admin/users')} className="text-[#0E7C7B] hover:underline">Users</button>
        <span className="text-[#B9C6D4] mx-1">›</span>
        <span className="text-[#2E3F5C] font-medium">User Management</span>
      </nav>

      {/* Pending Judge Approvals */}
      {pendingJudges.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 mb-6">
          <h3 className="font-montserrat font-bold text-yellow-900 mb-1 flex items-center gap-2">
            ⏳ Pending Judge Approvals ({pendingJudges.length})
          </h3>
          <p className="text-yellow-700 text-sm mb-4">These judges are waiting for approval to be connected to their tournament director.</p>
          <div className="space-y-3">
            {pendingJudges.map(j => (
              <div key={j.id} className="bg-white border border-yellow-200 rounded-lg p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-[#0D1B4C]">{j.name}</div>
                  <div className="text-sm text-[#5F6F86]">{j.email}</div>
                  <div className="text-xs text-[#8A9AB0] mt-0.5">Director: {j.message || '—'}</div>
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
        <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C]">User Management</h2>
        <span className="text-sm text-[#5F6F86]">{filtered.length} of {users.length} users</span>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
          className="flex-1 min-w-48 px-4 py-2 border border-[#D3DEE8] rounded-lg text-sm focus:ring-2 focus:ring-[#22B3B5]" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 border border-[#D3DEE8] rounded-lg text-sm">
          <option value="all">All Users</option>
          <option value="active">Active Users</option>
          <option value="new">New This Month</option>
          <option value="admin">Admins</option>
          <option value="director">Directors</option>
          <option value="judge">Judges</option>
          <option value="angler">Anglers</option>
          <option value="sponsor">Partners</option>
        </select>
      </div>

      <div className="bg-white border border-[#E8EEF4] rounded-lg overflow-x-auto shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-[#F5F8FB] border-b border-[#E8EEF4]">
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} className={`px-4 py-3 text-left text-xs font-semibold text-[#5F6F86] uppercase ${h === 'Actions' ? 'text-center' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF3F8]">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[#8A9AB0]">No users found</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} className="hover:bg-[#F5F8FB]">
                <td className="px-4 py-3 font-medium text-[#0D1B4C] whitespace-nowrap">{u.name}</td>
                <td className="px-4 py-3 text-[#4A5B76]">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadge(u.role)}`}>{u.role === 'sponsor' ? 'partner' : u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(u.status || 'active')}`}>{u.status || 'active'}</span>
                </td>
                <td className="px-4 py-3 text-[#5F6F86] whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {/* View */}
                    <button onClick={() => openView(u)} title="View user"
                      className="p-1.5 text-[#0E7C7B] hover:bg-[#EEF8F8] rounded-lg transition" >
                      <Eye className="w-4 h-4" />
                    </button>
                    {/* Edit */}
                    <button onClick={() => openEdit(u)} title="Edit user"
                      className="p-1.5 text-[#5F6F86] hover:bg-[#EEF3F8] rounded-lg transition">
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const stats = [
    { label: 'Total Tournaments', value: tournaments.length, sub: 'All tournaments', icon: Trophy, color: 'text-[#8A9AB0]' },
    { label: 'Upcoming', value: tournaments.filter(t => t.status === 'upcoming').length, sub: 'Not yet started', icon: Clock, color: 'text-[#22B3B5]' },
    { label: 'Active', value: tournaments.filter(t => t.status === 'active').length, sub: 'In progress', icon: Activity, color: 'text-green-400' },
    { label: 'Completed', value: tournaments.filter(t => t.status === 'completed').length, sub: 'Finished tournaments', icon: CheckCircle, color: 'text-[#8A9AB0]' },
  ];

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const today = new Date();
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C]">Tournament Management</h2>
          <p className="text-[#5F6F86] text-sm mt-0.5">Oversee all tournaments, review settings, and monitor activity</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0E7C7B] text-white rounded-lg text-sm font-semibold hover:bg-[#0B6564] transition">
            <Plus className="w-4 h-4" /> Add a Tournament
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-[#D3DEE8] text-[#2E3F5C] rounded-lg text-sm font-medium hover:bg-[#F5F8FB] transition">
            <UserCheck className="w-4 h-4" /> Register Angler
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-[#E8EEF4] rounded-lg p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#5F6F86]">{s.label}</span>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className="text-3xl font-bold text-[#0D1B4C] mb-1">{s.value}</div>
            <div className="text-xs text-[#8A9AB0]">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Master species list for the public Species filters */}
      <SpeciesManager usage={tournaments.reduce<Record<string, number>>((m, t) => {
        new Set(t.fishTypes?.length ? t.fishTypes : t.species ? [t.species] : []).forEach((f) => { m[f] = (m[f] || 0) + 1; });
        return m;
      }, {})} />

      {/* Calendar + List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="bg-white border border-[#E8EEF4] rounded-lg p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth()-1))} className="p-1.5 hover:bg-[#EEF3F8] rounded-lg transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-[#0D1B4C]">{monthName}</span>
            <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth()+1))} className="p-1.5 hover:bg-[#EEF3F8] rounded-lg transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-[#8A9AB0] py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();
              return (
                <div key={day} className={`text-center text-sm py-1.5 rounded-lg cursor-pointer transition ${isToday ? 'bg-[#0E7C7B] text-white font-bold' : 'text-[#2E3F5C] hover:bg-[#EEF3F8]'}`}>
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tournament List */}
        <div className="bg-white border border-[#E8EEF4] rounded-lg p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
          <h3 className="font-montserrat font-semibold text-[#0D1B4C] mb-4">Tournaments ({tournaments.length})</h3>
          {tournaments.length === 0 ? (
            <div className="text-center py-12 text-[#8A9AB0]">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No tournaments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tournaments.map(t => (
                <div key={t.id} className="border border-[#EEF3F8] rounded-lg p-4 hover:border-[#E8EEF4] transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-[#0D1B4C] mb-1">{t.name}</div>
                      <div className="flex items-center gap-1 text-xs text-[#5F6F86] mb-1">
                        <Calendar className="w-3 h-3" /> {t.startDate}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#5F6F86] mb-2">
                        <MapPin className="w-3 h-3" /> {t.city}, {t.state}
                      </div>
                      {t.createdBy && <div className="flex items-center gap-1 text-xs text-[#8A9AB0]"><Users className="w-3 h-3" /> {t.createdBy}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.status === 'active' ? 'bg-green-100 text-green-700' : t.status === 'completed' ? 'bg-[#EEF3F8] text-[#4A5B76]' : 'bg-[#E3F4F4] text-[#0B6564]'}`}>
                        {t.status || 'upcoming'}
                      </span>
                      <button className="p-1.5 text-[#8A9AB0] hover:text-[#0E7C7B] hover:bg-[#EEF8F8] rounded-lg transition"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 text-[#8A9AB0] hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CATCH SUBMISSIONS TAB
// ============================================================
function SubmissionsTab({ submissions }: { submissions: Submission[] }) {
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: string }) => (
    <span className="ml-1 inline-flex flex-col" onClick={() => toggleSort(field)}>
      <ChevronRight className={`w-3 h-3 -rotate-90 ${sortField === field && sortDir === 'asc' ? 'text-[#0E7C7B]' : 'text-[#B9C6D4]'}`} />
    </span>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C]">Catch Submissions</h2>
          <p className="text-[#5F6F86] text-sm mt-0.5">View all tournaments and submit catches</p>
        </div>
      </div>

      <div className="bg-white border border-[#E8EEF4] rounded-lg overflow-x-auto shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="border-b border-[#E8EEF4]">
            <tr>
              <th className="px-5 py-3.5 text-left text-sm font-semibold text-[#0E7C7B] cursor-pointer" onClick={() => toggleSort('tournament')}>
                Tournament <SortIcon field="tournament" />
              </th>
              <th className="px-5 py-3.5 text-left text-sm font-semibold text-[#0E7C7B] cursor-pointer" onClick={() => toggleSort('regCutoff')}>
                Reg Cutoff <SortIcon field="regCutoff" />
              </th>
              <th className="px-5 py-3.5 text-left text-sm font-semibold text-[#0E7C7B] cursor-pointer" onClick={() => toggleSort('start')}>
                Start <span className="ml-1 text-[#22B3B5]">↑</span>
              </th>
              <th className="px-5 py-3.5 text-left text-sm font-semibold text-[#0E7C7B] cursor-pointer" onClick={() => toggleSort('end')}>
                End <SortIcon field="end" />
              </th>
              <th className="px-5 py-3.5 text-left text-sm font-semibold text-[#0E7C7B] cursor-pointer" onClick={() => toggleSort('lotw')}>
                LOTW <SortIcon field="lotw" />
              </th>
              <th className="px-5 py-3.5 text-right text-sm font-semibold text-[#0E7C7B]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF3F8]">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <Fish className="w-10 h-10 mx-auto mb-3 text-[#D3DEE8]" />
                  <p className="text-[#8A9AB0] text-sm">No catch submissions yet</p>
                </td>
              </tr>
            ) : submissions.map(s => (
              <tr key={s.id} className="hover:bg-[#F5F8FB]">
                <td className="px-5 py-4">
                  <div className="font-semibold text-[#0D1B4C]">{s.tournamentId}</div>
                  <div className="text-xs text-[#5F6F86] mt-0.5">{s.angler}</div>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="px-2 py-0.5 bg-[#EEF3F8] text-[#4A5B76] text-xs rounded-full">{s.status}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-[#4A5B76]">—</td>
                <td className="px-5 py-4 text-sm text-[#4A5B76]">{new Date(s.submittedAt).toLocaleDateString()}</td>
                <td className="px-5 py-4 text-sm text-[#4A5B76]">—</td>
                <td className="px-5 py-4 text-sm text-[#5F6F86]">N/A</td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1.5 text-[#0E7C7B] hover:bg-[#EEF8F8] rounded-lg transition"><Eye className="w-4 h-4" /></button>
                    <button className="p-1.5 text-[#22B3B5] hover:bg-[#EEF8F8] rounded-lg transition"><Fish className="w-4 h-4" /></button>
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
// PARTNERS TAB
// ============================================================
function PartnersTab({ partners }: { partners: User[] }) {
  return (
    <div>
      <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C] mb-6">Partner Management</h2>
      <div className="bg-white border border-[#E8EEF4] rounded-lg overflow-hidden shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F8FB] border-b border-[#E8EEF4]">
            <tr>
              {['Name', 'Organization', 'Email', 'Status', 'Joined'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#5F6F86] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF3F8]">
            {partners.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[#8A9AB0]">No partners yet</td></tr>
            ) : partners.map(p => (
              <tr key={p.id} className="hover:bg-[#F5F8FB]">
                <td className="px-4 py-3 font-medium text-[#0D1B4C]">{p.name}</td>
                <td className="px-4 py-3 text-[#4A5B76]">{p.organization || '—'}</td>
                <td className="px-4 py-3 text-[#4A5B76]">{p.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.status || 'pending'}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#5F6F86]">{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// CLUBS TAB
// ============================================================
function ClubsTab() {
  const [search, setSearch] = useState('');
  const clubs = [
    { name: 'All American Kayak Classic', city: 'Clinton', state: 'MS', country: 'USA', director: 'N/A', website: null },
    { name: 'All Star Fishing Kayak Div.', city: 'Texas', state: 'TX', country: 'USA', director: 'N/A', website: null },
    { name: 'Appalachian FFL', city: 'Appalachia', state: 'Multi-State', country: 'USA', director: 'N/A', website: null },
    { name: 'B.A.S.S. Nation Kayak Series', city: 'Various', state: 'National', country: 'USA', director: 'N/A', website: null },
    { name: 'BMA Mount Kayak Bass Fishing', city: 'Louisiana', state: 'LA', country: 'USA', director: 'N/A', website: null },
    { name: 'BASSMASTER College Kayak Series', city: 'Various', state: 'National', country: 'USA', director: 'N/A', website: null },
    { name: 'Bassmaster Parks and Recreation', city: 'Georgia', state: 'GA', country: 'USA', director: 'N/A', website: null },
    { name: 'Bassgrabbers Tournament Trail', city: 'Various', state: 'Multi-State', country: 'USA', director: 'N/A', website: null },
    { name: 'Testing New Club Name', city: 'Folsom', state: 'CA', country: 'USA', director: 'Test Director', website: 'Visit' },
  ];

  const filtered = clubs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase()) ||
    c.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C]">Clubs Management</h2>
          <p className="text-[#5F6F86] text-sm mt-0.5">Manage fishing clubs and organizations</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0E7C7B] text-white rounded-lg text-sm font-semibold hover:bg-[#0B6564] transition">
          <Plus className="w-4 h-4" /> Add Club
        </button>
      </div>

      {/* Requests from the public /clubs/submit form */}
      <ClubSubmissionsManager />

      {/* Requests from the public /clubs/feature page */}
      <ClubFeatureRequestsManager />

      {/* Prices shown on /clubs/feature */}
      <FeaturePricingEditor />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#E8EEF4] rounded-lg p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
          <div className="text-3xl font-bold text-[#0D1B4C] mb-1">{clubs.length}</div>
          <div className="text-sm text-[#5F6F86]">Total Clubs</div>
        </div>
        <div className="bg-white border border-[#E8EEF4] rounded-lg p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
          <div className="text-3xl font-bold text-[#0E7C7B] mb-1">28</div>
          <div className="text-sm text-[#5F6F86]">States Represented</div>
        </div>
        <div className="bg-white border border-[#E8EEF4] rounded-lg p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
          <div className="text-3xl font-bold text-[#0D1B4C] mb-1">0</div>
          <div className="text-sm text-[#5F6F86]">Total Members</div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A9AB0]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clubs..."
            className="w-full pl-9 pr-4 py-2 border border-[#D3DEE8] rounded-lg text-sm focus:ring-2 focus:ring-[#22B3B5]" />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 border border-[#D3DEE8] rounded-lg text-sm text-[#4A5B76] hover:bg-[#F5F8FB] transition">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      <div className="bg-white border border-[#E8EEF4] rounded-lg overflow-x-auto shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[#E8EEF4]">
            <tr>
              {['Club Name', 'City', 'State', 'Country', 'Club Director', 'Website', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#5F6F86] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF3F8]">
            {filtered.map((c, i) => (
              <tr key={i} className="hover:bg-[#F5F8FB]">
                <td className="px-4 py-3 font-medium text-[#0E7C7B] hover:underline cursor-pointer">{c.name}</td>
                <td className="px-4 py-3 text-[#4A5B76]">{c.city}</td>
                <td className="px-4 py-3 text-[#4A5B76]">{c.state}</td>
                <td className="px-4 py-3 text-[#4A5B76]">{c.country}</td>
                <td className="px-4 py-3 text-[#5F6F86]">{c.director}</td>
                <td className="px-4 py-3">
                  {c.website && <span className="text-[#0E7C7B] text-xs hover:underline cursor-pointer">{c.website}</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button className="p-1.5 text-[#8A9AB0] hover:text-[#0E7C7B] hover:bg-[#EEF8F8] rounded-lg transition"><Pencil className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 text-[#8A9AB0] hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-[#EEF3F8] text-xs text-[#8A9AB0]">
          Showing {filtered.length} of {clubs.length} clubs
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SERIES TAB
// ============================================================
function SeriesTab({ series }: { series: Series[] }) {
  const [activeFilter, setActiveFilter] = useState('All Series');
  const filters = ['All Series', 'Current Series', 'Upcoming Series', 'Past Series'];

  const stats = [
    { label: 'Total Series', value: series.length, sub: 'All series', icon: TrendingUp },
    { label: 'Active Series', value: series.length, sub: 'Active status', icon: Calendar },
    { label: 'In Progress', value: 0, sub: 'Currently running', icon: Clock },
    { label: 'Total Participants', value: 0, sub: 'Across all series', icon: Users },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C]">Series Management</h2>
          <p className="text-[#5F6F86] text-sm mt-0.5">Manage tournament series, standings, and seasonal configurations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-[#E8EEF4] rounded-lg p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#5F6F86]">{s.label}</span>
              <s.icon className="w-5 h-5 text-[#B9C6D4]" />
            </div>
            <div className="text-3xl font-bold text-[#0D1B4C] mb-1">{s.value}</div>
            <div className="text-xs text-[#8A9AB0]">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Series Table */}
      <div className="bg-white border border-[#E8EEF4] rounded-lg mb-6 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
        <div className="p-5 border-b border-[#EEF3F8] flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-[#5F6F86]" />
              <span className="font-semibold text-[#0D1B4C]">All Series</span>
            </div>
            <p className="text-[#5F6F86] text-sm">View and manage all tournament series</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 border border-[#D3DEE8] rounded-lg text-sm text-[#4A5B76] hover:bg-[#F5F8FB] transition">
              Check Users DB
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0E7C7B] text-white rounded-lg text-sm font-semibold hover:bg-[#0B6564] transition">
              <Plus className="w-4 h-4" /> Create Series
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex border-b border-[#EEF3F8] px-5">
          {filters.map(f => {
            const count = f === 'All Series' ? series.length : 0;
            return (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeFilter === f ? 'border-[#0E7C7B] text-[#0E7C7B]' : 'border-transparent text-[#5F6F86] hover:text-[#2E3F5C]'}`}>
                {f} {count}
              </button>
            );
          })}
        </div>

        <table className="w-full text-sm">
          <thead className="bg-[#F5F8FB] border-b border-[#EEF3F8]">
            <tr>
              {['Image', 'Series Name', 'Description', 'Club', 'Start Date', 'End Date', 'Location', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#5F6F86] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF3F8]">
            {series.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-[#8A9AB0]">No series yet</td></tr>
            ) : series.map(s => (
              <tr key={s.id} className="hover:bg-[#F5F8FB]">
                <td className="px-4 py-3">
                  <div className="w-10 h-10 bg-[#E1E9F1] rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-[#8A9AB0]" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded mr-1">Active</span>
                  <div className="font-medium text-[#0E7C7B] hover:underline cursor-pointer mt-0.5">{s.name}</div>
                </td>
                <td className="px-4 py-3 text-[#4A5B76] text-xs max-w-xs">{s.description || '—'}</td>
                <td className="px-4 py-3 text-[#4A5B76] text-sm">—</td>
                <td className="px-4 py-3 text-[#4A5B76] text-sm">{new Date(s.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-[#4A5B76] text-sm">—</td>
                <td className="px-4 py-3 text-[#4A5B76] text-sm">—</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button className="p-1.5 text-[#8A9AB0] hover:text-[#0E7C7B] hover:bg-[#EEF8F8] rounded-lg transition"><Pencil className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 text-[#8A9AB0] hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom sections */}
      {[
        { icon: Calendar, title: 'Season Schedule', desc: 'Plan and schedule series seasons', empty: 'No schedules configured', btn: 'View Schedule' },
        { icon: Trophy, title: 'Standings & Points', desc: 'Manage points systems and standings', empty: 'No standings data', btn: 'View Standings' },
        { icon: Users, title: 'Series Directors', desc: 'Assign directors to manage series', empty: 'No directors assigned', btn: 'Manage Directors' },
      ].map(section => (
        <div key={section.title} className="bg-white border border-[#E8EEF4] rounded-lg p-6 mb-4 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
          <div className="flex items-center gap-2 mb-1">
            <section.icon className="w-5 h-5 text-[#0E7C7B]" />
            <h3 className="font-montserrat font-semibold text-[#0D1B4C]">{section.title}</h3>
          </div>
          <p className="text-[#5F6F86] text-sm mb-6">{section.desc}</p>
          <div className="text-center py-6 text-[#8A9AB0]">
            <p className="text-sm mb-4">{section.empty}</p>
            <button className="px-4 py-2 border border-[#D3DEE8] rounded-lg text-sm text-[#4A5B76] hover:bg-[#F5F8FB] transition">{section.btn}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// EVENTS TAB
// ============================================================
function EventsTab() {
  const events = [
    { name: "Eastern Main Sportsman's Show", type: 'Expo', status: 'Active', dates: ['Mar 20, 2026', 'Mar 21, 2026', 'Mar 22, 2026'], location: 'University of Main Fieldhouse', city: 'Orono, ME', fees: [{label:'Day Pass Adult', amount:'$10.00'},{label:'Day Pass Child', amount:'$0.00'},{label:'Weekend Pass Adult', amount:'$15.00'}], image: '🎣' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C]">Events Management</h2>
          <p className="text-[#5F6F86] text-sm mt-0.5">Manage expos and boat shows</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0E7C7B] text-white rounded-lg text-sm font-semibold hover:bg-[#0B6564] transition">
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      {/* Requests from the public /events/submit form */}
      <EventSubmissionsManager />

      {/* Filters */}
      <div className="bg-white border border-[#E8EEF4] rounded-lg p-4 mb-4 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <div>
            <label className="block text-xs font-semibold text-[#0E7C7B] mb-1.5">Filter by Type</label>
            <select className="w-full px-3 py-2 border border-[#D3DEE8] rounded-lg text-sm focus:ring-2 focus:ring-[#22B3B5]">
              <option value="">All Types</option>
              <option>Expo</option>
              <option>Boat Show</option>
              <option>Tournament</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0E7C7B] mb-1.5">Filter by Status</label>
            <select className="w-full px-3 py-2 border border-[#D3DEE8] rounded-lg text-sm focus:ring-2 focus:ring-[#22B3B5]">
              <option value="">All Status</option>
              <option>Active</option>
              <option>Upcoming</option>
              <option>Completed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E8EEF4] rounded-lg overflow-hidden shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
        <div className="px-5 py-3.5 border-b border-[#EEF3F8]">
          <span className="font-semibold text-[#0D1B4C]">Events ({events.length})</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[#F5F8FB] border-b border-[#EEF3F8]">
            <tr>
              {['Image', 'Event', 'Dates', 'Fees', 'Location', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#5F6F86] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF3F8]">
            {events.map((e, i) => (
              <tr key={i} className="hover:bg-[#F5F8FB]">
                <td className="px-4 py-4">
                  <div className="w-14 h-14 bg-green-800 rounded-lg flex items-center justify-center text-2xl">{e.image}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-medium text-[#0E7C7B] hover:underline cursor-pointer mb-1.5">{e.name}</div>
                  <div className="flex gap-1.5">
                    <span className="px-2 py-0.5 bg-[#E3F4F4] text-[#0B6564] text-xs rounded-full">{e.type}</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{e.status}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {e.dates.map((d, di) => (
                    <div key={di} className="flex items-center gap-1.5 text-xs text-[#4A5B76] mb-1">
                      <Calendar className="w-3 h-3 text-[#8A9AB0] flex-shrink-0" />
                      <span>{d}, 9:00 AM – 8:00 PM</span>
                    </div>
                  ))}
                </td>
                <td className="px-4 py-4">
                  {e.fees.map((f, fi) => (
                    <div key={fi} className="flex items-center gap-1.5 text-xs text-[#4A5B76] mb-1">
                      <DollarSign className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>{f.label}: <span className="font-semibold text-green-600">{f.amount}</span></span>
                    </div>
                  ))}
                </td>
                <td className="px-4 py-4 text-sm text-[#4A5B76]">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#8A9AB0] mt-0.5 flex-shrink-0" />
                    <div>
                      <div>{e.location}</div>
                      <div className="text-[#8A9AB0] text-xs">{e.city}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-1.5">
                    <button className="p-1.5 text-[#8A9AB0] hover:text-[#0E7C7B] hover:bg-[#EEF8F8] rounded-lg transition"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 text-[#8A9AB0] hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
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
// ADVERTISING TAB
// ============================================================
function AdvertisingTab() {
  const ads = [
    { name: 'Wide Skyscraper Advertisement', company: 'Pro Fishing Company', status: 'Active', live: false, category: ['boats'], size: '160 × 600', position: 'Sidebar-Zone-1', start: '2/15/2026, 1:44 PM', end: '3/29/2026, 1:44 PM', url: 'http://www.yahoo.com...', cost: '$200.00' },
    { name: 'Testing Banner Ad', company: '123 Fishing Company', status: 'Active', live: false, category: ['fishing-gear','tackle'], size: '300 × 250', position: 'Sidebar-Zone-1', start: '2/27/2026, 3:04 PM', end: '3/27/2026, 3:04 PM', url: 'http://www.yahoo.com...', cost: null },
    { name: 'Testing footer zone 1 banner', company: 'Leaderboard company', status: 'Active', live: true, category: ['kayaks','boats'], size: '728 × 90', position: 'Footer-Zone-1', start: '3/4/2026, 8:11 AM', end: '4/25/2026, 8:11 AM', url: 'https://www.basspro.com...', cost: null },
    { name: 'Testing footer zone 2 advertising banner', company: 'Footer zone 2 company name', status: 'Active', live: true, category: ['tackle','boats'], size: '728 × 90', position: 'Footer-Zone-2', start: '3/4/2026, 8:45 AM', end: '4/25/2026, 8:45 AM', url: 'http://www.test.com...', cost: null },
    { name: 'Test Banner Footer Zone 3', company: 'Test Banner', status: 'Active', live: true, category: ['fishing-gear'], size: '728 × 90', position: 'Footer-Zone-3', start: '3/4/2026, 9:59 AM', end: '5/4/2026, 9:59 AM', url: 'http://www.test.com...', cost: null },
  ];

  const totalAds = ads.length;
  const activeAds = ads.filter(a => a.status === 'Active').length;
  const liveNow = ads.filter(a => a.live).length;
  const monthlyRevenue = ads.reduce((sum, a) => sum + (a.cost ? parseInt(a.cost.replace(/\D/g,'')) : 0), 0);

  const statCards = [
    { label: 'Total Ads', value: totalAds, icon: Image, color: '' },
    { label: 'Active', value: activeAds, icon: Play, color: 'text-green-500' },
    { label: 'Paused', value: 0, icon: Pause, color: 'text-yellow-500' },
    { label: 'Inactive', value: 0, icon: EyeOff, color: 'text-[#8A9AB0]' },
    { label: 'Currently Live', value: liveNow, icon: Calendar, color: 'text-[#0E7C7B]' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C]">Advertising Management</h2>
          <p className="text-[#5F6F86] text-sm mt-0.5">Upload and manage banner advertisements for public-facing pages</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0E7C7B] text-white rounded-lg text-sm font-semibold hover:bg-[#0B6564] transition">
          <Plus className="w-4 h-4" /> Add Advertisement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {statCards.map(s => (
          <div key={s.label} className="bg-white border border-[#E8EEF4] rounded-lg p-4 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#5F6F86]">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color || 'text-[#B9C6D4]'}`} />
            </div>
            <div className="text-2xl font-bold text-[#0D1B4C]">{s.value}</div>
          </div>
        ))}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-green-700">Monthly Revenue</span>
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-700">${monthlyRevenue.toFixed(2)}</div>
          <div className="text-xs text-green-600 mt-0.5">From active ads</div>
        </div>
      </div>

      {/* Ads List */}
      <div className="bg-white border border-[#E8EEF4] rounded-lg mb-6 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
        <div className="px-5 py-4 border-b border-[#EEF3F8]">
          <h3 className="font-montserrat font-semibold text-[#0D1B4C]">All Advertisements</h3>
          <p className="text-[#5F6F86] text-sm">Manage banner ads displayed on public-facing pages</p>
        </div>
        <div className="divide-y divide-[#EEF3F8]">
          {ads.map((ad, i) => (
            <div key={i} className="px-5 py-4 flex items-start gap-4 hover:bg-[#F5F8FB]">
              <div className="w-20 h-16 bg-[#EEF3F8] border border-[#E8EEF4] rounded-lg flex items-center justify-center text-xs text-[#8A9AB0] flex-shrink-0 text-center px-1">
                {ad.size} pixels
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-[#0D1B4C]">{ad.name}</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{ad.status}</span>
                  {ad.live && <span className="px-2 py-0.5 bg-[#E3F4F4] text-[#0B6564] text-xs rounded-full flex items-center gap-1">● Live Now</span>}
                </div>
                <div className="text-sm text-[#5F6F86] mb-1">Company: <span className="text-[#2E3F5C]">{ad.company}</span></div>
                <div className="flex flex-wrap gap-3 text-xs text-[#5F6F86] mb-1">
                  <span>Category: {ad.category.map(c => <span key={c} className="px-1.5 py-0.5 bg-[#EEF3F8] rounded mr-1">{c}</span>)}</span>
                  <span>Size: {ad.size}</span>
                  <span>Position: {ad.position}</span>
                </div>
                <div className="text-xs text-[#8A9AB0] mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Display: {ad.start} → {ad.end}</div>
                <a href="#" className="text-xs text-[#0E7C7B] hover:underline">{ad.url}</a>
                {ad.cost && <div className="text-xs text-[#5F6F86] mt-0.5">Cost Per Month: <span className="text-green-600 font-semibold">{ad.cost}</span></div>}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button className="flex items-center gap-1 px-2.5 py-1.5 text-[#0E7C7B] text-xs border border-[#BFE6E6] rounded-lg hover:bg-[#EEF8F8] transition"><Eye className="w-3 h-3" /> View</button>
                <button className="flex items-center gap-1 px-2.5 py-1.5 text-[#4A5B76] text-xs border border-[#E8EEF4] rounded-lg hover:bg-[#F5F8FB] transition"><Edit2 className="w-3 h-3" /> Edit</button>
                <button className="flex items-center gap-1 px-2.5 py-1.5 text-yellow-600 text-xs border border-yellow-200 rounded-lg hover:bg-yellow-50 transition"><Pause className="w-3 h-3" /> Pause</button>
                <button className="flex items-center gap-1 px-2.5 py-1.5 text-[#5F6F86] text-xs border border-[#E8EEF4] rounded-lg hover:bg-[#F5F8FB] transition"><EyeOff className="w-3 h-3" /> Deactivate</button>
                <button className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Carousel (home page) */}
      <HeroSlidesManager />

      {/* "We recommend" banners (home page) */}
      <HomeBannersManager />

      {/* Banner Info */}
      <div className="bg-white border border-[#E8EEF4] rounded-lg p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
        <h3 className="font-montserrat font-semibold text-[#0D1B4C] mb-4">Banner Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-montserrat text-sm font-semibold text-[#0E7C7B] mb-3">Ad Status:</h4>
            <div className="space-y-2 text-sm text-[#4A5B76]">
              <div><span className="text-green-600 font-medium">Active:</span> Ad is eligible to display during scheduled time</div>
              <div><span className="text-yellow-600 font-medium">Paused:</span> Temporarily stopped, can be resumed</div>
              <div><span className="text-[#5F6F86] font-medium">Inactive:</span> Completely disabled, not displayed</div>
            </div>
          </div>
          <div>
            <h4 className="font-montserrat text-sm font-semibold text-[#0E7C7B] mb-3">Display Positions:</h4>
            <div className="space-y-2 text-sm text-[#4A5B76]">
              <div><span className="font-medium">Top Banner:</span> Displayed at the top of pages</div>
              <div><span className="font-medium">Sidebar:</span> Shown in page sidebars</div>
              <div><span className="font-medium">Footer:</span> Appears at the bottom of pages</div>
              <div><span className="font-medium">In-Content:</span> Embedded within page content</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MONETIZATION TAB
// ============================================================
function MonetizationTab() {
  const [activeTab, setActiveTab] = useState('All Revenue');
  const tabs = ['All Revenue', 'Tournament Registration Revenue', 'Ad Revenue'];

  const revenueCards = [
    { title: 'Total Registration Revenue', badge: '0 Registrations', badgeColor: 'bg-purple-100 text-purple-700', amount: '$0.00', sub: '0 registrations × $6.50', color: 'purple', bg: 'bg-purple-50 border-purple-100' },
    { title: 'YTD Registration Revenue', badge: '0 Registrations', badgeColor: 'bg-teal-100 text-[#0B6564]', amount: '$0.00', sub: '0 registrations × $6.50', color: 'teal', bg: 'bg-teal-50 border-teal-100' },
    { title: 'APR 2026 Registration Revenue', badge: '0 Registrations', badgeColor: 'bg-orange-100 text-orange-700', amount: '$0.00', sub: '0 registrations × $6.50', color: 'orange', bg: 'bg-orange-50 border-orange-100' },
    { title: 'Total Ad Revenue', badge: '5 Ads', badgeColor: 'bg-purple-100 text-purple-700', amount: '$400.00', sub: 'All-time ad revenue', color: 'purple', bg: 'bg-purple-50 border-purple-100' },
    { title: 'YTD Ad Revenue', badge: '5 Ads', badgeColor: 'bg-teal-100 text-[#0B6564]', amount: '$400.00', sub: 'Year-to-date revenue for 2026', color: 'teal', bg: 'bg-teal-50 border-teal-100' },
    { title: 'APR 2026 Ad Revenue', badge: '3 Ads', badgeColor: 'bg-purple-100 text-purple-700', amount: '$0.00', sub: 'Revenue for current month', color: 'purple', bg: 'bg-purple-50 border-purple-100' },
  ];

  const toolCards = [
    { icon: Package, title: 'Pricing Plans', desc: 'Create and manage subscription tiers and pricing', empty: 'No pricing plans configured', btn: 'Create Pricing Plan', btnStyle: 'bg-[#0E7C7B] text-white hover:bg-[#0B6564]' },
    { icon: CreditCard, title: 'Payment Processing', desc: 'Configure payment gateways and processing settings', empty: 'No payment gateway connected', btn: 'Connect Payment Gateway', btnStyle: 'bg-[#0E7C7B] text-white hover:bg-[#0B6564]' },
    { icon: BarChart2, title: 'Revenue Analytics', desc: 'View revenue trends and financial reports', empty: 'No revenue data available', btn: 'View Reports', btnStyle: 'border border-[#D3DEE8] text-[#2E3F5C] hover:bg-[#F5F8FB]' },
    { icon: Users, title: 'Subscription Management', desc: 'Manage user subscriptions and billing', empty: 'No active subscriptions', btn: 'View Subscriptions', btnStyle: 'border border-[#D3DEE8] text-[#2E3F5C] hover:bg-[#F5F8FB]' },
  ];

  const amountColor: Record<string, string> = { purple: 'text-purple-600', teal: 'text-[#0E7C7B]', orange: 'text-orange-600' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C]">Monetization</h2>
          <p className="text-[#5F6F86] text-sm mt-0.5">Manage pricing, subscriptions, revenue, and payment processing</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#E8EEF4] mb-6">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${activeTab === t ? 'border-[#0E7C7B] text-[#0E7C7B]' : 'border-transparent text-[#5F6F86] hover:text-[#2E3F5C]'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {revenueCards.map(c => (
          <div key={c.title} className={`border rounded-lg p-5 ${c.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#0D1B4C]">{c.title}</span>
              <DollarSign className={`w-5 h-5 ${amountColor[c.color]}`} />
            </div>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-3 ${c.badgeColor}`}>{c.badge}</span>
            <div className={`text-3xl font-bold mb-1 ${amountColor[c.color]}`}>{c.amount}</div>
            <div className={`text-xs ${amountColor[c.color]} opacity-70`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Tool Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {toolCards.map(t => (
          <div key={t.title} className="bg-white border border-[#E8EEF4] rounded-lg p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
            <div className="flex items-center gap-2 mb-2">
              <t.icon className="w-5 h-5 text-green-600" />
              <h3 className="font-montserrat font-semibold text-[#0D1B4C] text-sm">{t.title}</h3>
            </div>
            <p className="text-xs text-[#5F6F86] mb-4">{t.desc}</p>
            <div className="text-xs text-[#8A9AB0] mb-4">{t.empty}</div>
            <button className={`w-full py-2 rounded-lg text-sm font-medium transition ${t.btnStyle}`}>{t.btn}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// CMS TAB
// ============================================================
function CMSTab() {
  const [activeSection, setActiveSection] = useState('Pages');
  const sections = ['Pages', 'Media Library', 'Content Sections'];
  const pages = [
    { title: 'Home', slug: '/', status: 'published', updated: '2/17/2026' },
    { title: 'Services', slug: '/services', status: 'published', updated: '2/17/2026' },
    { title: 'Fishing Expos', slug: '/events/expos', status: 'published', updated: '2/17/2026' },
    { title: 'Sign Up', slug: '/signup-choice', status: 'published', updated: '2/17/2026' },
    { title: 'Login', slug: '/login', status: 'published', updated: '2/17/2026' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C]">Website Content Management</h2>
          <p className="text-[#5F6F86] text-sm mt-0.5">Manage pages, content sections, and media assets across your platform</p>
        </div>
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
          <FileEdit className="w-6 h-6 text-purple-600" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Pages', value: pages.length, sub: `${pages.filter(p=>p.status==='published').length} published`, icon: BookOpen },
          { label: 'Draft Pages', value: 0, sub: 'Awaiting publication', icon: FileText },
          { label: 'Media Assets', value: 14, sub: 'Images, videos, files', icon: Image },
          { label: 'Content Sections', value: 1, sub: 'Across all pages', icon: Layers },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#E8EEF4] rounded-lg p-5 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#5F6F86]">{s.label}</span>
              <s.icon className="w-5 h-5 text-[#B9C6D4]" />
            </div>
            <div className="text-3xl font-bold text-[#0D1B4C] mb-1">{s.value}</div>
            <div className="text-xs text-[#8A9AB0]">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Section Tabs */}
      <div className="bg-white border border-[#E8EEF4] rounded-lg shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
        <div className="flex border-b border-[#E8EEF4]">
          {sections.map(s => (
            <button key={s} onClick={() => setActiveSection(s)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition rounded-t-xl ${activeSection === s ? 'bg-white text-[#0D1B4C] border-b-2 border-transparent' : 'bg-[#F5F8FB] text-[#5F6F86] hover:text-[#2E3F5C]'}`}>
              {s === 'Pages' && <BookOpen className="w-4 h-4" />}
              {s === 'Media Library' && <Image className="w-4 h-4" />}
              {s === 'Content Sections' && <Settings className="w-4 h-4" />}
              {s}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeSection === 'Pages' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-montserrat font-semibold text-[#0D1B4C]">Pages Management</h3>
                  <p className="text-[#5F6F86] text-sm">Create and manage website pages</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0E7C7B] text-white rounded-lg text-sm font-semibold hover:bg-[#0B6564] transition">
                  <Plus className="w-4 h-4" /> Create New Page
                </button>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-[#EEF3F8]">
                  <tr>
                    {['Title', 'Slug', 'Status', 'Last Updated', 'Actions'].map(h => (
                      <th key={h} className={`py-3 text-xs font-semibold text-[#5F6F86] uppercase ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF3F8]">
                  {pages.map(p => (
                    <tr key={p.slug} className="hover:bg-[#F5F8FB]">
                      <td className="py-3.5 font-medium text-[#0D1B4C]">{p.title}</td>
                      <td className="py-3.5 text-[#5F6F86] font-mono text-xs">{p.slug}</td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-1 bg-[#0E7C7B] text-white text-xs rounded-full font-medium">{p.status}</span>
                      </td>
                      <td className="py-3.5 text-[#5F6F86] text-xs">{p.updated}</td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-1.5 text-[#8A9AB0] hover:text-[#0E7C7B] hover:bg-[#EEF8F8] rounded-lg transition"><Eye className="w-3.5 h-3.5" /></button>
                          <button className="p-1.5 text-[#8A9AB0] hover:text-[#2E3F5C] hover:bg-[#EEF3F8] rounded-lg transition"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {activeSection === 'Media Library' && (
            <div className="text-center py-16 text-[#8A9AB0]">
              <Image className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Media library coming soon</p>
              <button className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-[#0E7C7B] text-white rounded-lg text-sm font-semibold hover:bg-[#0B6564] transition mx-auto">
                <Upload className="w-4 h-4" /> Upload Media
              </button>
            </div>
          )}
          {activeSection === 'Content Sections' && (
            <div className="text-center py-16 text-[#8A9AB0]">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Content sections editor coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SETTINGS TAB
// ============================================================
function SettingsTab() {
  const cards = [
    { icon: BarChart2, color: 'bg-[#E3F4F4] text-[#0E7C7B]', title: 'Reports & Analytics', desc: 'View system analytics, reports, and performance metrics', btn: 'View Analytics' },
    { icon: Settings, color: 'bg-[#EEF3F8] text-[#4A5B76]', title: 'Platform Settings', desc: 'Configure platform-wide settings and preferences', btn: 'Manage Settings' },
    { icon: Database, color: 'bg-[#E3F4F4] text-[#0E7C7B]', title: 'Database Management', desc: 'Manage database, backups, and data integrity', btn: 'Database Tools' },
    { icon: Lock, color: 'bg-[#E3F4F4] text-[#0E7C7B]', title: 'Security & Access', desc: 'Manage security settings, access controls, and permissions', btn: 'Security Settings' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C]">Settings</h2>
        <p className="text-[#5F6F86] text-sm mt-0.5">Manage platform settings, security, analytics, and database</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.title} className="bg-white border border-[#E8EEF4] rounded-lg p-6 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${c.color}`}>
              <c.icon className="w-5 h-5" />
            </div>
            <h3 className="font-montserrat font-bold text-[#0D1B4C] mb-2">{c.title}</h3>
            <p className="text-[#5F6F86] text-sm mb-6 leading-relaxed">{c.desc}</p>
            <button className="w-full py-2.5 bg-[#0E7C7B] text-white rounded-lg text-sm font-semibold hover:bg-[#0B6564] transition">{c.btn}</button>
          </div>
        ))}
      </div>
    </div>
  );
}


function ComingSoonTab({ tab }: { tab: string }) {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="text-5xl mb-4">🚧</div>
        <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C] mb-2">{tab}</h2>
        <p className="text-[#5F6F86]">This section is coming soon.</p>
      </div>
    </div>
  );
}
