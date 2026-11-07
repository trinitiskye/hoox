'use client';

import { useEffect, useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { setSession } from '@/lib/auth';
import type { User } from '@/types';

export default function ResetPasswordPage({ onNavigate }: { onNavigate: (view: string) => void }) {
  const { login } = useAuth();
  const [token, setToken] = useState('');
  const [state, setState] = useState<'checking' | 'valid' | 'invalid' | 'done'>('checking');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token') || '';
    setToken(t);
    if (!t) { setState('invalid'); return; }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(t)}`, { cache: 'no-store' }).then((r) => r.json())
      .then((j) => { setState(j.valid ? 'valid' : 'invalid'); setEmail(j.email || ''); })
      .catch(() => setState('invalid'));
  }, []);

  const submit = async () => {
    setError('');
    if (pw.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (pw !== pw2) { setError('Passwords don’t match.'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password: pw }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) { setError(j.error || 'Couldn’t reset your password.'); return; }
      if (j.user) { setSession(j.user as User); login(j.user as User); setSignedIn(true); }
      setState('done');
    } catch { setError('Couldn’t reach HOOX. Check your connection.'); }
    finally { setBusy(false); }
  };

  const card = 'bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm';
  const input = 'w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition';
  return (
    <div className="bg-white flex-grow flex items-center justify-center px-4 py-12">
      {state === 'checking' && <p className="text-sm text-gray-500">Checking your link…</p>}
      {state === 'invalid' && (
        <div className={`${card} text-center`}>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link expired</h1>
          <p className="text-gray-500 text-sm mb-6">This reset link has expired or was already used. Reset links work once, for 1 hour.</p>
          <button onClick={() => onNavigate('forgot-password')} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition">Get a new link</button>
        </div>
      )}
      {state === 'done' && (
        <div className={`${card} text-center`}>
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-7 h-7 text-green-600" /></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Password updated</h1>
          <p className="text-gray-500 text-sm mb-6">{signedIn ? 'You’re signed in with your new password.' : 'Sign in with your new password.'}</p>
          <button onClick={() => onNavigate(signedIn ? 'home' : 'login')} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition">{signedIn ? 'Continue' : 'Sign in'}</button>
        </div>
      )}
      {state === 'valid' && (
        <div className={card}>
          <div className="flex justify-center mb-6"><div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center"><Lock className="w-7 h-7 text-blue-600" /></div></div>
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Choose a new password</h1>
          <p className="text-gray-500 text-sm text-center mb-7">{email ? `For ${email}` : 'At least 8 characters.'}</p>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">New password</label>
          <div className="relative mb-4">
            <input type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} className={`${input} pr-11`} autoComplete="new-password" />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
          </div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm new password</label>
          <input type={show ? 'text' : 'password'} value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} className={`${input} mb-5`} autoComplete="new-password" />
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <button onClick={submit} disabled={busy} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-60">{busy ? 'Saving…' : 'Save new password'}</button>
        </div>
      )}
    </div>
  );
}
