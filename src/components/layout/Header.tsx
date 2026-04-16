'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { User } from '@/types';

interface HeaderProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export default function Header({ currentUser, onNavigate, onLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2 hover:opacity-80 transition flex-shrink-0">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="2" y="28" fontSize="22" fontWeight="800" fill="#1a56db" fontFamily="Arial, sans-serif">HOOX</text>
              <path d="M34 8 C34 8 38 12 36 17 C34 22 28 20 28 20" stroke="#1a56db" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M28 20 C28 20 26 24 28 27" stroke="#1a56db" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M16 32 Q20 36 36 34 Q38 34 38 32 Q38 30 36 30 Q24 32 18 28" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
          </button>

          {/* Desktop Navigation */}
          {!currentUser ? (
            <>
              <nav className="hidden lg:flex items-center gap-1">
                <button onClick={() => onNavigate('series')} className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium text-sm transition">
                  Series
                </button>
                <button onClick={() => onNavigate('tournaments')} className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium text-sm transition">
                  Tournaments
                </button>
                <button onClick={() => onNavigate('clubs')} className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium text-sm transition">
                  Clubs
                </button>
                <button onClick={() => onNavigate('events')} className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium text-sm transition">
                  Events
                </button>
                <button onClick={() => onNavigate('features')} className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium text-sm transition">
                  App Features
                </button>
                <button onClick={() => onNavigate('sponsor')} className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium text-sm transition">
                  Become a Partner
                </button>
              </nav>

              <div className="hidden lg:flex items-center gap-3">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition"
                >
                  Login
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 font-medium text-sm transition"
                >
                  Sign Up
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700 hidden sm:inline">
                Welcome, <span className="font-semibold">{currentUser.name}</span>
              </span>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {!currentUser && mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-4 space-y-1">
            {['series', 'tournaments', 'clubs', 'events', 'features', 'sponsor'].map((item) => (
              <button
                key={item}
                onClick={() => { onNavigate(item); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg capitalize text-sm font-medium"
              >
                {item === 'features' ? 'App Features' : item === 'sponsor' ? 'Become a Partner' : item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
            <div className="flex gap-3 px-4 pt-3 border-t border-gray-100 mt-2">
              <button onClick={() => { onNavigate('login'); setMobileMenuOpen(false); }} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm text-center">Login</button>
              <button onClick={() => { onNavigate('register'); setMobileMenuOpen(false); }} className="flex-1 py-2 bg-gray-900 text-white rounded-lg font-medium text-sm text-center">Sign Up</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
