'use client';

import { MapPin, Map } from 'lucide-react';
import { useState } from 'react';

interface ClubsPageProps {
  onNavigate: (view: string) => void;
}

const DEMO_CLUBS = [
  { id: '1', name: 'All American Kayak Classic', city: 'Clinton', state: 'MO' },
  { id: '2', name: 'All Starr Fishing Kayak Div', city: 'Texas', state: 'TX' },
  { id: '3', name: 'Appalachian KFL', city: 'Appalachia', state: 'Multi-State' },
  { id: '4', name: 'B.A.S.S. Nation Kayak Series', city: 'Various', state: 'National' },
  { id: '5', name: "BAM Bassin' Kayak Fishing", city: 'Louisiana', state: 'LA' },
  { id: '6', name: 'Bartow Parks and Recreation', city: 'Bartow', state: 'GA' },
  { id: '7', name: 'Bassgrabbers Tournament Trails', city: 'Various', state: 'Multi-State' },
  { id: '8', name: 'BASSMASTER College Kayak Series', city: 'Various', state: 'National' },
  { id: '9', name: 'BASSMASTER Kayak Series OPENS', city: 'Various', state: 'National' },
  { id: '10', name: 'Big Bass Tour', city: 'Various', state: 'National' },
  { id: '11', name: 'Carolina Kayak Anglers', city: 'Charlotte', state: 'NC' },
  { id: '12', name: 'Desert Kayak Fishing Club', city: 'Phoenix', state: 'AZ' },
  { id: '13', name: 'Florida Kayak Bass Anglers', city: 'Orlando', state: 'FL' },
  { id: '14', name: 'Great Lakes Kayak Series', city: 'Various', state: 'Multi-State' },
  { id: '15', name: 'Gulf Coast Kayak Federation', city: 'Various', state: 'Multi-State' },
  { id: '16', name: 'Heartland Kayak Bass Tour', city: 'Kansas City', state: 'MO' },
  { id: '17', name: 'High Desert Kayak Anglers', city: 'Albuquerque', state: 'NM' },
  { id: '18', name: 'Kayak Bass Fishing', city: 'Various', state: 'National' },
];

const COUNTRIES = ['All Countries', 'United States', 'Canada', 'Mexico', 'Australia'];
const PER_PAGE = 9;

export default function ClubsPage({ onNavigate }: ClubsPageProps) {
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState('All Countries');
  const [page, setPage] = useState(1);

  const filtered = DEMO_CLUBS.filter(c =>
    (!keyword || c.name.toLowerCase().includes(keyword.toLowerCase()) || c.city.toLowerCase().includes(keyword.toLowerCase()) || c.state.toLowerCase().includes(keyword.toLowerCase()))
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero */}
      <div className="bg-blue-600 py-12 px-4 text-center">
        <h1 className="text-4xl font-bold text-white mb-3">Fishing Clubs</h1>
        <p className="text-blue-100 text-lg max-w-lg mx-auto">Discover and connect with fishing clubs in your area. Join a community of anglers who share your passion.</p>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Search Clubs</h3>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 border border-green-600 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50 transition">
                    <Map className="w-4 h-4" /> Map View
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                    Sort
                  </button>
                  <span className="flex items-center px-3 py-1.5 border border-blue-300 text-blue-700 bg-blue-50 rounded-lg text-sm font-medium">
                    {filtered.length} Clubs Found
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keyword(s)</label>
                  <input
                    type="text"
                    value={keyword}
                    onChange={e => { setKeyword(e.target.value); setPage(1); }}
                    placeholder="Search all fields..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Club Grid */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paged.map(club => (
            <div key={club.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-2">{club.name}</h3>
              <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{club.city}, {club.state}</span>
              </div>
              <button className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition text-sm flex items-center justify-center gap-1">
                View club details →
              </button>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
            >
              ‹
            </button>
            <span className="text-sm text-gray-600">{page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
