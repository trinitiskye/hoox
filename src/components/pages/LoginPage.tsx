'use client';

import { useState } from 'react';
import { Fish, Eye, EyeOff, X } from 'lucide-react';
import { loginUser } from '@/lib/auth';
import { User } from '@/types';

interface LoginPageProps {
  onNavigate: (view: string) => void;
  onLogin: (user: User) => void;
}

type ModalType = 'paused' | 'banned' | null;

export default function LoginPage({ onNavigate, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ModalType>(null);

  const handleLogin = async () => {
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true); setError('');
    const { user, code } = await loginUser(email, password);
    setLoading(false);

    if (code === 'account_paused') { setModal('paused'); return; }
    if (code === 'account_banned') { setModal('banned'); return; }
    if (!user) {
      if (code === 'not_found') setError('No account found with that email.');
      else if (code === 'wrong_password') setError('Incorrect password.');
      else if (code === 'account_pending') setError('Your account is pending approval. You will receive an email when approved.');
      else setError('Something went wrong. Please try again.');
      return;
    }
    onLogin(user);
    if (user.role === 'admin') onNavigate('admin-dashboard');
    else onNavigate('home');
  };

  return (
    <>
      {/* Paused / Banned Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm relative">
            <button onClick={() => setModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${modal === 'paused' ? 'bg-yellow-100' : 'bg-red-100'}`}>
              <span className="text-2xl">{modal === 'paused' ? '⏸️' : '🚫'}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-3">
              {modal === 'paused' ? 'Account Paused' : 'Account Restricted'}
            </h2>
            <p className="text-gray-600 text-sm text-center leading-relaxed mb-6">
              {modal === 'paused'
                ? 'Your account has been paused. Please contact the HOOX support team to reactivate your account.'
                : 'Please contact the HOOX support team to discuss your account.'}
            </p>
            <a href="mailto:support@fishtournament.pro"
              className="block w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-center hover:bg-blue-700 transition text-sm mb-3">
              Contact Support
            </a>
            <button onClick={() => setModal(null)}
              className="block w-full py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl text-center hover:bg-gray-50 transition text-sm">
              Close
            </button>
          </div>
        </div>
      )}

      <div className="bg-white flex-grow flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
              <Fish className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm text-center mb-7">Sign in to your HOOX account</p>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
          </div>

          <div className="mb-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition pr-10" />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="text-right mb-5">
            <button onClick={() => onNavigate('forgot-password')} className="text-blue-600 text-xs hover:underline">Forgot password?</button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button onClick={handleLogin} disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 mb-5">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <button onClick={() => onNavigate('register')} className="text-blue-600 font-medium hover:underline">Sign up</button>
          </p>
          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <button onClick={() => onNavigate('admin-login')} className="text-gray-400 text-xs hover:text-gray-600 transition">
              System Admin Login →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
