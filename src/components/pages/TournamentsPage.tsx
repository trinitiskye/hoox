'use client';

import { Trophy, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { Tournament } from '@/types';
import { useState } from 'react';

interface TournamentsPageProps {
  tournaments: Tournament[];
  onNavigate: (view: string) => void;
}

export default function TournamentsPage({ tournaments, onNavigate }: TournamentsPageProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'inprocess' | 'archived'>('upcoming');

  const now = new Date();
  const upcoming = tournaments.filter(t => new Date(t.startDate) > now);
  const inProcess = tournaments.filter(t => {
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    return now >= start && now <= end;
  });
  const archived = tournaments.filter(t => new Date(t.endDate) < now);
  const tabTournaments = activeTab === 'upcoming' ? upcoming : activeTab === 'inprocess' ? inProcess : archived;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-teal-600 py-16 px-4 text-center">
        <Trophy className="w-12 h-12 text-white/80 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white mb-3">Fishing Tournaments</h1>
        <p className="text-blue-100 text-lg">Browse and register for upcoming fishing tournaments across the country</p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {([
            { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
            { key: 'inprocess', label: 'In Process', count: inProcess.length },
            { key: 'archived', label: 'Archived', count: archived.length },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium flex items-center gap-1.5 border-b-2 -mb-px transition ${
                activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tournament Cards */}
        {tabTournaments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No tournaments in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tabTournaments.map(t => (
              <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                {t.image ? (
                  <div className="h-44 overflow-hidden">
                    <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-44 bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-white/60" />
                  </div>
                )}
                <div className="p-5">
                  {t.status && (
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded mb-2 ${
                      t.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                      t.status === 'active' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </span>
                  )}
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{t.name}</h3>
                  {t.description && <p className="text-gray-500 text-sm mb-3 line-clamp-2">{t.description}</p>}
                  {t.fishTypes?.map(f => (
                    <span key={f} className="inline-block mr-1 mb-2 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">{f}</span>
                  ))}
                  <div className="flex items-center gap-2 text-gray-500 text-sm mt-2 mb-1">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>{t.startDate} {t.startTime} – {t.endDate} {t.endTime} {t.timezone?.split('/')[1]?.replace('_',' ') || ''}</span>
                  </div>
                  <div className="flex items-start gap-2 text-gray-500 text-sm mb-4">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" />
                    <div>
                      <div>{t.location}</div>
                      <div>{t.city}, {t.state}</div>
                      <a href="#" className="text-blue-600 hover:underline text-xs flex items-center gap-1 mt-0.5">
                        View on Map <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('register')}
                    className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    Entry Fee: {t.entryFee ? `$${t.entryFee}` : t.registrationFee ? `$${t.registrationFee}` : 'Free'}
                  </button>
                  {t.directorFeePercentage ? (
                    <p className="text-center text-xs text-gray-400 mt-1.5">Big Bass: ${(parseFloat(t.entryFee || t.registrationFee || '50') * t.directorFeePercentage / 100).toFixed(2)}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Banner */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 mb-10">
        <div className="bg-gradient-to-r from-blue-600 to-green-500 rounded-2xl p-10 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to Compete?</h2>
          <p className="text-white/90 mb-6 max-w-lg mx-auto">Join thousands of anglers competing in professional fishing tournaments. Sign up today and start your journey to becoming a champion!</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => onNavigate('register')} className="px-6 py-3 bg-white/20 border border-white text-white font-semibold rounded-lg hover:bg-white/30 transition">Create Account</button>
            <button onClick={() => onNavigate('login')} className="px-6 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white/20 transition">Sign In</button>
          </div>
        </div>
      </div>

      {/* Ad Banner */}
      <div className="max-w-3xl mx-auto w-full px-4 mb-10">
        <div className="bg-gray-200 rounded-lg h-20 flex items-center justify-center">
          <p className="text-sm text-gray-400">728 x 90 pixels</p>
        </div>
      </div>
    </div>
  );
}
