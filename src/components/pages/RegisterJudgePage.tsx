'use client';

import { useState } from 'react';
import { Scale, Eye, EyeOff, Clock, Mail, CheckCircle } from 'lucide-react';
import { registerJudge } from '@/lib/auth';
import { User } from '@/types';

interface RegisterJudgePageProps {
  onNavigate: (view: string) => void;
  onLogin: (user: User) => void;
}

type SuccessState =
  | { type: 'pending_approval'; directorName?: string; directorEmail: string }
  | { type: 'invite_sent'; directorEmail: string };

export default function RegisterJudgePage({ onNavigate, onLogin }: RegisterJudgePageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [form, setForm] = useState({
    directorEmail: '', name: '', organization: '', phone: '',
    address: '', city: '', state: '', country: 'United States', zip: '',
    email: '', password: '', confirmPassword: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError('');
    if (!form.directorEmail) { setError('Tournament Director email is required.'); return; }
    if (!form.name || !form.email || !form.password) { setError('Name, email, and password are required.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { user, outcome, directorName, error: err } = await registerJudge(form);
    setLoading(false);
    if (err) { setError(err); return; }
    if (outcome === 'pending_approval') {
      setSuccess({ type: 'pending_approval', directorName, directorEmail: form.directorEmail });
    } else if (outcome === 'invite_sent') {
      setSuccess({ type: 'invite_sent', directorEmail: form.directorEmail });
      // User is active, set session
      if (user) onLogin(user);
    }
  };

  // ── Success: pending director approval ──────────────────────────────────
  if (success?.type === 'pending_approval') {
    return (
      <div className="bg-gray-50 flex-grow flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created — Pending Approval</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Your judge account has been created and is waiting for approval from{' '}
            <span className="font-semibold text-gray-700">
              {success.directorName || success.directorEmail}
            </span>.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left mb-6">
            <p className="text-blue-800 font-semibold text-sm mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" /> What happens next?
            </p>
            <ul className="space-y-1.5 text-blue-700 text-sm">
              <li>• The tournament director has been notified of your registration</li>
              <li>• They will review and approve your account on their dashboard</li>
              <li>• Once approved, you'll be able to log in and manage catch submissions</li>
            </ul>
          </div>

          <p className="text-gray-400 text-xs mb-5">
            Director notified at: <span className="font-medium">{success.directorEmail}</span>
          </p>

          <button
            onClick={() => onNavigate('home')}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Success: director not found, invite sent ─────────────────────────────
  if (success?.type === 'invite_sent') {
    return (
      <div className="bg-gray-50 flex-grow flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Judge Account Created!</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Your account is active. No HOOX account was found for the director email you provided,
            so we've sent them an invitation to join.
          </p>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-left mb-6">
            <p className="text-orange-800 font-semibold text-sm mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Invitation sent to director
            </p>
            <p className="text-orange-700 text-sm">
              An email has been sent to <span className="font-semibold">{success.directorEmail}</span> inviting
              them to register as a Tournament Director. Once they join and connect with you,
              you'll be able to manage their tournaments.
            </p>
          </div>

          <button
            onClick={() => onNavigate('home')}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition mb-3"
          >
            Go to Home
          </button>
          <button
            onClick={() => onNavigate('login')}
            className="w-full py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition text-sm"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────
  return (
    <div className="bg-gray-50 flex-grow flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
            <Scale className="w-7 h-7 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Judge Registration</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Register as a tournament judge to manage catch submissions</p>

        {/* Director referral */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Email of the Tournament Director that referred you *
          </label>
          <input
            type="email"
            value={form.directorEmail}
            onChange={set('directorEmail')}
            placeholder="director@example.com"
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-2">
            Enter the email address of the Tournament Director who referred you to register as a judge.
            If they don't have a HOOX account yet, we'll send them an invitation.
          </p>
        </div>

        {/* Personal Info */}
        <h2 className="font-bold text-gray-900 mb-3">Personal Information</h2>
        <hr className="mb-4 border-gray-100" />
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
            <input value={form.name} onChange={set('name')} placeholder="John Doe"
              className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 text-sm focus:ring-2 focus:ring-green-500 focus:bg-white transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization (Optional)</label>
            <input value={form.organization} onChange={set('organization')} placeholder="Your fishing organization or association"
              className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 text-sm focus:ring-2 focus:ring-green-500 focus:bg-white transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
            <input value={form.phone} onChange={set('phone')} placeholder="(555) 123-4567"
              className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 text-sm focus:ring-2 focus:ring-green-500 focus:bg-white transition" />
          </div>
        </div>

        {/* Address */}
        <h2 className="font-bold text-gray-900 mb-3">Address Information</h2>
        <hr className="mb-4 border-gray-100" />
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address *</label>
            <input value={form.address} onChange={set('address')} placeholder="123 Main Street"
              className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 text-sm focus:ring-2 focus:ring-green-500 focus:bg-white transition" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
              <input value={form.city} onChange={set('city')} placeholder="Los Angeles"
                className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 text-sm focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State *</label>
              <input value={form.state} onChange={set('state')} placeholder="CA"
                className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 text-sm focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Country *</label>
              <input value={form.country} onChange={set('country')} placeholder="United States"
                className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 text-sm focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Zip Code *</label>
              <input value={form.zip} onChange={set('zip')} placeholder="90210"
                className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 text-sm focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
        </div>

        {/* Login Info */}
        <h2 className="font-bold text-gray-900 mb-3">Login Information</h2>
        <hr className="mb-4 border-gray-100" />
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="judge@example.com"
              className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 text-sm focus:ring-2 focus:ring-green-500 focus:bg-white transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min. 6 characters"
                className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 text-sm focus:ring-2 focus:ring-green-500 focus:bg-white transition pr-10" />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter your password"
                className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 text-sm focus:ring-2 focus:ring-green-500 focus:bg-white transition pr-10" />
              <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showConfirm ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition disabled:opacity-50 mb-3">
          {loading ? 'Creating Account...' : 'Create Judge Account'}
        </button>
        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} className="text-blue-600 font-medium hover:underline">Login here</button>
        </p>
      </div>
    </div>
  );
}
