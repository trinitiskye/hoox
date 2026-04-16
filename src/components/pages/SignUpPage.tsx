'use client';

import { Fish, Trophy } from 'lucide-react';

interface SignUpPageProps {
  onNavigate: (view: string) => void;
}

export default function SignUpPage({ onNavigate }: SignUpPageProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">Manage Tournaments Seamlessly</h1>
          <p className="text-lg text-gray-300">Powerful tools for directors to organize successful events</p>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {[0,1,2].map(i => <button key={i} className={`w-2.5 h-2.5 rounded-full ${i === 2 ? 'bg-white' : 'bg-white/40'}`} />)}
        </div>
      </div>

      {/* Account Type Selector */}
      <div className="flex-grow flex flex-col items-center justify-center py-16 px-4">
        <p className="text-gray-600 text-lg mb-10">Select the account type that best fits your needs</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
          {/* Angler */}
          <div className="border-2 border-gray-200 rounded-xl p-8 hover:border-blue-500 hover:shadow-lg transition cursor-pointer group">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:bg-blue-100 transition">
              <Fish className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Angler Account</h3>
            <p className="text-gray-500 text-center text-sm mb-6">For tournament participants</p>
            <ul className="space-y-2 mb-8">
              {['Register for tournaments', 'Submit catches with photos', 'Track your rankings', 'View tournament results'].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => onNavigate('register-angler')}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Sign Up as Angler
            </button>
          </div>

          {/* Director */}
          <div className="border-2 border-gray-200 rounded-xl p-8 hover:border-purple-500 hover:shadow-lg transition cursor-pointer group">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:bg-purple-100 transition">
              <Trophy className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Tournament Director</h3>
            <p className="text-gray-500 text-center text-sm mb-6">For tournament organizers</p>
            <ul className="space-y-2 mb-8">
              {['Create and manage tournaments', 'Review and approve catches', 'Manage registrations', 'Generate reports'].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => onNavigate('register-director')}
              className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
            >
              Sign Up as Director
            </button>
          </div>
        </div>

        <p className="mt-8 text-gray-500 text-sm">
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} className="text-blue-600 hover:underline font-medium">
            Login here
          </button>
        </p>
      </div>
    </div>
  );
}
