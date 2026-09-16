'use client';

import { Trophy, Users, BarChart3, Zap, Shield, Globe, Settings, Edit } from 'lucide-react';

interface FeaturesPageProps {
  onNavigate: (view: string) => void;
}

const FEATURES = [
  { icon: Trophy, color: 'text-yellow-500 bg-yellow-50', title: 'Tournament Creation', desc: 'Create and manage fishing tournaments with custom rules, dates, and locations. Support for single events and tournament series.' },
  { icon: Users, color: 'text-green-500 bg-green-50', title: 'Angler Registration', desc: 'Easy online registration with automated payment processing. Track registrations and manage participant information.' },
  { icon: BarChart3, color: 'text-purple-500 bg-purple-50', title: 'Analytics Dashboard', desc: 'Detailed analytics and reporting tools to track tournament performance and participant engagement.' },
  { icon: Zap, color: 'text-orange-500 bg-orange-50', title: 'Live Leaderboards', desc: 'Real-time rankings and results updated instantly as catches are approved. Keep participants engaged throughout the event.' },
  { icon: Shield, color: 'text-red-500 bg-red-50', title: 'Security Features', desc: 'Advanced security measures to protect tournament data and ensure fair competition.' },
  { icon: Settings, color: 'text-cyan-500 bg-cyan-50', title: 'Automation Tools', desc: 'Automate tournament management tasks such as registration, scoring, and prize distribution.' },
  { icon: Globe, color: 'text-blue-500 bg-blue-50', title: 'Global Reach', desc: 'Host tournaments with participants from around the world. Access to a global community of anglers.' },
  { icon: Edit, color: 'text-indigo-500 bg-indigo-50', title: 'Admin Dashboard', desc: 'Comprehensive admin tools for managing users, tournaments, submissions, and system settings. Full control at your fingertips.' },
];

export default function FeaturesPage({ onNavigate }: FeaturesPageProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero */}
      <div className="relative w-full h-48 bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
          <p className="text-gray-400 text-sm uppercase tracking-widest mb-1">Real-Time</p>
          <p className="text-gray-400">Keep participants engaged</p>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {[0,1,2].map(i => <button key={i} className={`w-2.5 h-2.5 rounded-full ${i === 1 ? 'bg-white' : 'bg-white/40'}`} />)}
        </div>
      </div>

      {/* Headline */}
      <div className="max-w-3xl mx-auto text-center px-4 py-14">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Manage Fishing Tournaments{' '}
          <span className="text-blue-600">Like a Pro</span>
        </h1>
        <p className="text-gray-500 text-lg mb-8">
          The complete platform for tournament directors and anglers to organize, register, compete, and track fishing tournaments with real-time leaderboards.
        </p>
        <div className="flex gap-4 justify-center">
          <button onClick={() => onNavigate('register')} className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-700 transition">
            Get Started Free
          </button>
          <button onClick={() => onNavigate('login')} className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">
            Sign In
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition bg-white">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
