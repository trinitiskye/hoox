'use client';

import { useState } from 'react';
import { Shield, Eye, EyeOff, Key } from 'lucide-react';
import { loginAdmin, createDemoAdmin } from '@/lib/auth';
import { User } from '@/types';

interface AdminLoginPageProps {
  onNavigate: (view: string) => void;
  onLogin: (user: User) => void;
}

export default function AdminLoginPage({ onNavigate, onLogin }: AdminLoginPageProps) {
  const [email, setEmail] = useState('cher.chronis@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoMsg, setDemoMsg] = useState('');

  const handleCreateDemo = async () => {
    setLoading(true); setDemoMsg('');
    const { success, error } = await createDemoAdmin();
    setLoading(false);
    if (success) { setDemoMsg('✅ Demo admin account ready! Use the credentials above to sign in.'); setPassword('DemoAdmin123!'); }
    else setDemoMsg('❌ Error: ' + error);
  };

  const handleLogin = async () => {
    if (!email || !password) { setError('Please enter email and password.'); return; }
    setLoading(true); setError('');
    const { user, error: err } = await loginAdmin(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    if (user) { onLogin(user); onNavigate('admin-dashboard'); }
  };

  return (
    <div className="bg-blue-50 flex-grow flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">System Admin Access</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Administrative login for platform management</p>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-blue-700 font-semibold text-sm flex items-center gap-1.5 mb-2"><Key className="w-4 h-4" /> Demo Admin Credentials</p>
          <p className="text-blue-700 text-sm"><span className="font-semibold">Email:</span> cher.chronis@gmail.com</p>
          <p className="text-blue-700 text-sm mb-3"><span className="font-semibold">Password:</span> DemoAdmin123!</p>
          <button onClick={handleCreateDemo} disabled={loading}
            className="w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Demo Admin Account'}
          </button>
          {demoMsg && <p className="text-xs mt-2 text-gray-600">{demoMsg}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">Password</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••••••"
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition pr-10" />
            <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

        <button onClick={handleLogin} disabled={loading}
          className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-700 transition disabled:opacity-50 mb-4">
          {loading ? 'Signing in...' : 'Sign In to Admin Panel'}
        </button>
        <div className="text-center mb-5">
          <button onClick={() => onNavigate('login')} className="text-blue-600 text-sm hover:underline">Regular user login</button>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
          <p className="text-yellow-800 text-xs font-semibold flex items-center gap-1 mb-1">⚠️ Restricted Access</p>
          <p className="text-yellow-700 text-xs">This login is for system administrators only. Unauthorized access attempts will be logged.</p>
        </div>
      </div>
    </div>
  );
}
