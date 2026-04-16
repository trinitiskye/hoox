'use client';

import { useState } from 'react';
import { Trophy, Eye, EyeOff } from 'lucide-react';
import { registerDirector } from '@/lib/auth';
import { User } from '@/types';
import AddressSelector, { AddressValue } from '@/components/ui/AddressSelector';

interface RegisterDirectorPageProps {
  onNavigate: (view: string) => void;
  onLogin: (user: User) => void;
}

export default function RegisterDirectorPage({ onNavigate, onLogin }: RegisterDirectorPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', organization: '', email: '', phone: '', website: '', password: '', confirmPassword: '',
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
    const { user, error: err } = await registerDirector({ ...form, ...address });
    setLoading(false);
    if (err) { setError(err); return; }
    if (user) { onLogin(user); onNavigate('home'); }
  };

  const inputClass = 'w-full px-4 py-3 bg-gray-100 rounded-xl border-0 text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white transition';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <div className="bg-white flex-grow flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
            <Trophy className="w-7 h-7 text-purple-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Create Director Account</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Organize and manage fishing tournaments</p>
        <hr className="mb-6 border-gray-100" />

        <h2 className="font-bold text-gray-900 mb-4">Profile Information</h2>
        <div className="space-y-4 mb-6">
          {[
            { key: 'name', label: 'Full Name', placeholder: 'John Smith' },
            { key: 'organization', label: 'Organization / Club', placeholder: 'Lake Pleasant Fishing Club' },
            { key: 'email', label: 'Email', placeholder: 'john@example.com', type: 'email' },
            { key: 'phone', label: 'Phone Number', placeholder: '(555) 123-4567' },
            { key: 'website', label: 'Website (Optional)', placeholder: 'https://www.example.com' },
          ].map(f => (
            <div key={f.key}>
              <label className={labelClass}>{f.label}</label>
              <input type={f.type || 'text'} value={(form as any)[f.key]} onChange={set(f.key)}
                placeholder={f.placeholder} className={inputClass} />
            </div>
          ))}
        </div>

        <h2 className="font-bold text-gray-900 mb-4">Address</h2>
        <div className="mb-6">
          <AddressSelector value={address} onChange={setAddress}
            inputClass={inputClass.replace('focus:ring-blue-500', 'focus:ring-purple-500')}
            labelClass={labelClass} required />
        </div>

        <h2 className="font-bold text-gray-900 mb-4">Password</h2>
        <div className="space-y-4 mb-6">
          <div>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')}
                placeholder="Create a password" className={`${inputClass} pr-10`} />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Confirm Password</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')}
                placeholder="Confirm your password" className={`${inputClass} pr-10`} />
              <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition disabled:opacity-50 mb-3">
          {loading ? 'Creating Account...' : 'Create Director Account'}
        </button>
        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} className="text-blue-600 font-medium hover:underline">Login</button>
        </p>
      </div>
    </div>
  );
}
