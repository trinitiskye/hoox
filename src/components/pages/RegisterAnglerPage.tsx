'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { registerAngler } from '@/lib/auth';
import { User } from '@/types';
import AddressSelector, { AddressValue } from '@/components/ui/AddressSelector';

interface RegisterAnglerPageProps {
  onNavigate: (view: string) => void;
  onLogin: (user: User) => void;
}

export default function RegisterAnglerPage({ onNavigate, onLogin }: RegisterAnglerPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', organization: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [address, setAddress] = useState<AddressValue>({
    address: '', country: 'US', state: '', city: '', zip: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError('');
    if (!form.name || !form.email || !form.password) { setError('Name, email, and password are required.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { user, error: err } = await registerAngler({ ...form, ...address });
    setLoading(false);
    if (err) { setError(err); return; }
    if (user) { onLogin(user); onNavigate('home'); }
  };

  return (
    <div className="bg-white flex-grow flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Create Angler Account</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Join tournaments and track your catches</p>
        <hr className="mb-6 border-gray-100" />

        <h2 className="font-bold text-gray-900 mb-4">Profile Information</h2>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input value={form.name} onChange={set('name')} placeholder="David Chen"
              className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization</label>
            <input value={form.organization} onChange={set('organization')} placeholder="N/A"
              className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="david.chen@example.com"
              className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
            <input value={form.phone} onChange={set('phone')} placeholder="(555) 123-4567"
              className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
          </div>
        </div>

        <h2 className="font-bold text-gray-900 mb-4">Address</h2>
        <div className="mb-6">
          <AddressSelector value={address} onChange={setAddress} required />
        </div>

        <h2 className="font-bold text-gray-900 mb-4">Password</h2>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Create a password"
                className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition pr-10" />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Confirm your password"
                className="w-full px-4 py-3 bg-gray-100 rounded-xl border-0 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition pr-10" />
              <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 mb-3">
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} className="text-blue-600 font-medium hover:underline">Login</button>
        </p>
      </div>
    </div>
  );
}
