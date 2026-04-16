'use client';

import { Trophy, MapPin, Calendar } from 'lucide-react';

interface SeriesPageProps {
  onNavigate: (view: string) => void;
}

const DEMO_SERIES = [
  {
    id: '1',
    name: 'Bass Pro Shops Bassmaster Classic',
    sponsor: 'Presented by Under Armor',
    description: 'The Bass Pro Shops Bassmaster Classic presented by Under Armour is headed back to the Tennessee River! The prestigious...',
    startDate: 'Mar 11, 2026',
    endDate: 'Mar 14, 2026',
    location: 'Tennessee River',
    city: 'Knoxville',
    state: 'Tennessee',
    country: 'United States',
    image: 'https://images.unsplash.com/photo-1532462893822-e0dab0f1e6ef?w=400&h=200&fit=crop',
  },
  {
    id: '2',
    name: 'FLW Tour Championship',
    sponsor: 'Presented by Toyota',
    description: 'The FLW Tour Championship is the pinnacle of professional bass fishing, bringing together the best anglers from across the nation...',
    startDate: 'Apr 5, 2026',
    endDate: 'Apr 8, 2026',
    location: 'Lake Guntersville',
    city: 'Guntersville',
    state: 'Alabama',
    country: 'United States',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=200&fit=crop',
  },
  {
    id: '3',
    name: 'Major League Fishing Cup',
    sponsor: 'Presented by Berkley',
    description: 'Major League Fishing brings a new format to competitive bass fishing with instant weigh-ins and real-time scoring...',
    startDate: 'May 15, 2026',
    endDate: 'May 18, 2026',
    location: 'Lake Chickamauga',
    city: 'Dayton',
    state: 'Tennessee',
    country: 'United States',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=200&fit=crop',
  },
];

export default function SeriesPage({ onNavigate }: SeriesPageProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 py-16 px-4 text-center">
        <Trophy className="w-12 h-12 text-white/80 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white mb-3">Tournament Series</h1>
        <p className="text-teal-100 text-lg">Explore our upcoming fishing tournament series and join the competition</p>
      </div>

      {/* Series Grid */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEMO_SERIES.map(series => (
            <div key={series.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
              <div className="h-44 overflow-hidden">
                <img src={series.image} alt={series.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-lg mb-1">{series.name}</h3>
                <a href="#" className="text-blue-600 text-sm hover:underline flex items-center gap-1 mb-3">
                  {series.sponsor} ↗
                </a>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{series.description}</p>
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{series.startDate} - {series.endDate}</span>
                </div>
                <div className="flex items-start gap-2 text-gray-500 text-sm mb-5">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{series.location}<br />{series.city}, {series.state}, {series.country}</span>
                </div>
                <button className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-sm">
                  View more details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="mx-4 md:mx-8 mb-10 max-w-7xl mx-auto w-full">
        <div className="bg-gradient-to-r from-blue-600 to-green-500 rounded-2xl p-10 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to Compete?</h2>
          <p className="text-white/90 mb-6 max-w-lg mx-auto">Join thousands of anglers competing in professional fishing tournaments. Sign up today and start your journey to becoming a champion!</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => onNavigate('register')} className="px-6 py-3 bg-white/20 border border-white text-white font-semibold rounded-lg hover:bg-white/30 transition">
              Create Account
            </button>
            <button onClick={() => onNavigate('login')} className="px-6 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white/20 transition">
              Sign In
            </button>
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
