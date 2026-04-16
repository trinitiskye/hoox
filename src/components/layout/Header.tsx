'use client';

import { useState } from 'react';
import { ChevronDown, Fish, Menu, X } from 'lucide-react';
import { User } from '@/types';

interface HeaderProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export default function Header({ currentUser, onNavigate, onLogout }: HeaderProps) {
  const [showEventsMenu, setShowEventsMenu] = useState(false);
  const [showPartnersMenu, setShowPartnersMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 py-4 md:py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <Fish className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-2xl font-bold text-gray-900">FishTournament Pro</h1>
              <p className="text-xs md:text-sm text-gray-600 hidden md:block">Professional Tournament Management Platform</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-gray-900">FishTournament</h1>
            </div>
          </button>

          {/* Desktop Navigation */}
          {!currentUser ? (
            <>
              <nav className="hidden lg:flex items-center gap-6">
                {/* Events Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowEventsMenu(!showEventsMenu)}
                    onBlur={() => setTimeout(() => setShowEventsMenu(false), 200)}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    Events
                    <ChevronDown className={`w-4 h-4 transition-transform ${showEventsMenu ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showEventsMenu && (
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg py-2 min-w-[200px] z-50">
                      <button
                        onClick={() => {
                          onNavigate('expos');
                          setShowEventsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                      >
                        Expos
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('series');
                          setShowEventsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                      >
                        Series
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('tournaments');
                          setShowEventsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                      >
                        Tournaments
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onNavigate('features')}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Features
                </button>

                {/* Partners Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowPartnersMenu(!showPartnersMenu)}
                    onBlur={() => setTimeout(() => setShowPartnersMenu(false), 200)}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    Partners
                    <ChevronDown className={`w-4 h-4 transition-transform ${showPartnersMenu ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showPartnersMenu && (
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg py-2 min-w-[200px] z-50">
                      <button
                        onClick={() => {
                          onNavigate('partner-benefits');
                          setShowPartnersMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                      >
                        Benefits
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('sponsor');
                          setShowPartnersMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                      >
                        Partner with us!
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onNavigate('register')}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Register
                </button>

                <button
                  onClick={() => onNavigate('login')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Login
                </button>
              </nav>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 md:gap-4">
              <span className="text-sm md:text-base text-gray-700 hidden sm:inline">
                Welcome, <span className="font-semibold">{currentUser.name}</span>
              </span>
              <span className="text-sm text-gray-700 sm:hidden font-semibold">
                {currentUser.name.split(' ')[0]}
              </span>
              <button
                onClick={onLogout}
                className="px-4 md:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm md:text-base"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {!currentUser && mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <div className="flex flex-col space-y-2">
              {/* Events Section */}
              <div className="border-b border-gray-100 pb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2">Events</p>
                <button
                  onClick={() => {
                    onNavigate('expos');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                >
                  Expos
                </button>
                <button
                  onClick={() => {
                    onNavigate('series');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                >
                  Series
                </button>
                <button
                  onClick={() => {
                    onNavigate('tournaments');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                >
                  Tournaments
                </button>
              </div>

              <button
                onClick={() => {
                  onNavigate('features');
                  setMobileMenuOpen(false);
                }}
                className="text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-semibold"
              >
                Features
              </button>

              {/* Partners Section */}
              <div className="border-b border-gray-100 pb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2">Partners</p>
                <button
                  onClick={() => {
                    onNavigate('partner-benefits');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                >
                  Benefits
                </button>
                <button
                  onClick={() => {
                    onNavigate('sponsor');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                >
                  Partner with us!
                </button>
              </div>

              <button
                onClick={() => {
                  onNavigate('register');
                  setMobileMenuOpen(false);
                }}
                className="text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-semibold"
              >
                Register
              </button>

              <button
                onClick={() => {
                  onNavigate('login');
                  setMobileMenuOpen(false);
                }}
                className="mx-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-center"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
