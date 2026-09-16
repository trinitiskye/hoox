'use client';

import { useState } from 'react';
import { Trophy, MapPin, Calendar, DollarSign, Users, ChevronUp, ChevronDown } from 'lucide-react';
import { Tournament, Submission, User, SearchParams } from '@/types';

interface HomePageProps {
  tournaments: Tournament[];
  submissions: Submission[];
  users: User[];
  onNavigate: (view: string) => void;
  onSearch: (params: SearchParams) => void;
}

const DEMO_LEADERBOARD = [
  { place: 1, angler: 'Sarah Williams', weight: '22.5 lbs' },
  { place: 2, angler: 'Mike Johnson', weight: '20.1 lbs' },
  { place: 3, angler: 'Tom Davis', weight: '18.7 lbs' },
];

const DEMO_ANGLERS = [
  { name: 'Sarah Williams', wins: 3, state: 'AZ' },
  { name: 'Mike Johnson', wins: 2, state: 'CA' },
  { name: 'Tom Davis', wins: 1, state: 'TX' },
];

export default function HomePage({ tournaments, submissions, users, onNavigate, onSearch }: HomePageProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'inprocess' | 'archived'>('upcoming');
  const [searchType, setSearchType] = useState('Tournaments');
  const [searchQuery, setSearchQuery] = useState('');

  const now = new Date();
  const upcoming = tournaments.filter(t => new Date(t.startDate) > now);
  const inProcess = tournaments.filter(t => {
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    return now >= start && now <= end;
  });
  const archived = tournaments.filter(t => new Date(t.endDate) < now);

  const tabTournaments = activeTab === 'upcoming' ? upcoming : activeTab === 'inprocess' ? inProcess : archived;

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    onSearch({ type: searchType.toLowerCase() as any, query: searchQuery });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero Carousel */}
      <div className="relative w-full h-64 md:h-80 overflow-hidden bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-teal-800/60 z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200')] bg-cover bg-center opacity-50" />
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">Manage Your Tournaments</h1>
          <p className="text-lg text-white/90 mb-6">Complete tournament management system</p>
          <button onClick={() => onNavigate('features')} className="px-6 py-2.5 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition">
            Learn More
          </button>
        </div>
        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {[0,1,2].map(i => <button key={i} className={`w-2.5 h-2.5 rounded-full transition ${i === 1 ? 'bg-white' : 'bg-white/40'}`} />)}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gray-800 py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <span className="text-white font-medium text-sm whitespace-nowrap">Search</span>
          <select
            value={searchType}
            onChange={e => setSearchType(e.target.value)}
            className="px-3 py-2 rounded bg-white text-gray-800 text-sm border-0 focus:ring-2 focus:ring-blue-500"
          >
            {['Tournaments', 'Series', 'Clubs', 'Directors', 'Anglers'].map(t => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={`Search for ${searchType.toLowerCase()}...`}
            className="flex-1 px-4 py-2 rounded text-sm border-0 focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={handleSearch} className="px-5 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700 transition whitespace-nowrap">
            Search
          </button>
        </div>
      </div>

      <div className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Tournaments Table */}
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tournaments</h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 bg-white">
                {(['upcoming', 'inprocess', 'archived'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium flex items-center gap-1.5 transition ${
                      activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'upcoming' ? 'Upcoming' : tab === 'inprocess' ? 'In Process' : 'Archived'}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      {tab === 'upcoming' ? upcoming.length : tab === 'inprocess' ? inProcess.length : archived.length}
                    </span>
                  </button>
                ))}
              </div>
              {/* Table */}
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Tournament Name', 'Date', 'Location', 'Entry Fee'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <span className="flex items-center gap-1">{h} <ChevronUp className="w-3 h-3 opacity-40" /></span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tabTournaments.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">No tournaments in this category</td></tr>
                  ) : tabTournaments.map(t => (
                    <tr key={t.id} className="hover:bg-blue-50/50 cursor-pointer transition" onClick={() => onNavigate('tournaments')}>
                      <td className="px-4 py-3">
                        <div className="text-blue-600 font-medium hover:underline">{t.name}</div>
                        {t.fishTypes?.map(f => (
                          <span key={f} className="inline-block mt-1 mr-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">{f}</span>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{t.startDate} – {t.endDate}</td>
                      <td className="px-4 py-3 text-gray-600">{t.location}<br/><span className="text-gray-400 text-xs">{t.city}, {t.state}</span></td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{t.entryFee ? `$${t.entryFee}` : t.registrationFee ? `$${t.registrationFee}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Leaderboard + Featured Anglers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Leaderboard */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Leaderboard Status</h2>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Place</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Angler</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Weight (lbs)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {DEMO_LEADERBOARD.map(row => (
                        <tr key={row.place} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              row.place === 1 ? 'bg-yellow-100 text-yellow-700' :
                              row.place === 2 ? 'bg-gray-100 text-gray-600' :
                              'bg-orange-50 text-orange-600'
                            }`}>{row.place}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-800 font-medium">{row.angler}</td>
                          <td className="px-4 py-3 text-gray-600">{row.weight}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Featured Anglers */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Featured Anglers</h2>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {DEMO_ANGLERS.map(a => (
                      <div key={a.name} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 text-sm">{a.name}</div>
                          <div className="text-xs text-gray-500">{a.state} · {a.wins} wins</div>
                        </div>
                        <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Ad */}
          <div className="lg:w-48 flex-shrink-0">
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400">We Recommend</p>
              <div className="mt-2 bg-gray-200 rounded h-32 flex items-center justify-center">
                <p className="text-xs text-gray-400">Partner ads will appear here</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ad Banner */}
        <div className="mt-8 bg-gray-100 border border-gray-200 rounded-lg h-20 flex items-center justify-center">
          <p className="text-sm text-gray-400">728 x 90 pixels</p>
        </div>
      </div>
    </div>
  );
}
