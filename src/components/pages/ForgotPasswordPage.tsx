'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigate: (view: string) => void;
}

export default function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!email) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm mb-6">
            If an account exists for <span className="font-medium text-gray-700">{email}</span>, you'll receive a password reset link shortly.
          </p>
          <button onClick={() => onNavigate('login')} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-7 h-7 text-blue-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Forgot password?</h1>
        <p className="text-gray-500 text-sm text-center mb-7">Enter your email and we'll send you a reset link.</p>

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="you@example.com"
            className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition mb-4"
        >
          Send Reset Link
        </button>

        <p className="text-center text-sm text-gray-500">
          Remember your password?{' '}
          <button onClick={() => onNavigate('login')} className="text-blue-600 font-medium hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
