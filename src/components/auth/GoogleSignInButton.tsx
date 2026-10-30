'use client';

/* ------------------------------------------------------------------ */
/* Google's official "Sign in with Google" button (Google Identity      */
/* Services). Google returns an ID token, which /api/auth/google        */
/* verifies before signing the person in or creating their account.    */
/*                                                                      */
/* Needs NEXT_PUBLIC_GOOGLE_CLIENT_ID (Cloudflare Pages → Settings →    */
/* Environment variables). Without it, a placeholder button explains    */
/* that Google sign-in isn't set up yet.                                */
/* ------------------------------------------------------------------ */

import { useEffect, useRef, useState } from 'react';
import type { User } from '@/types';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GSI_SRC = 'https://accounts.google.com/gsi/client';

type GoogleApi = {
  accounts: {
    id: {
      initialize: (o: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode?: string; auto_select?: boolean; cancel_on_tap_outside?: boolean }) => void;
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
    };
  };
};

let gsiLoading: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if ((window as unknown as { google?: GoogleApi }).google?.accounts?.id) return Promise.resolve();
  if (!gsiLoading) {
    gsiLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = GSI_SRC;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => { gsiLoading = null; reject(new Error('Google sign-in failed to load')); };
      document.head.appendChild(s);
    });
  }
  return gsiLoading;
}

export default function GoogleSignInButton({
  mode,
  role,
  onUser,
  onError,
}: {
  /** signup = create an account if none exists (needs `role`); signin = existing accounts only */
  mode: 'signup' | 'signin';
  role?: 'angler' | 'director';
  onUser: (user: User, created: boolean) => void;
  onError: (message: string) => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const cb = useRef({ onUser, onError, role });
  cb.current = { onUser, onError, role };

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadGsi()
      .then(() => {
        const google = (window as unknown as { google?: GoogleApi }).google;
        if (cancelled || !holder.current || !google) return;
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async ({ credential }) => {
            if (!credential) return;
            setBusy(true);
            try {
              const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential, role: cb.current.role }),
              });
              const json = await res.json();
              if (json.user) cb.current.onUser(json.user as User, !!json.created);
              else cb.current.onError(json.error === 'paused' ? 'This account is paused. Please contact support.' : json.error === 'banned' ? 'This account is no longer active.' : json.error || 'Google sign-in failed. Please try again.');
            } catch {
              cb.current.onError('Connection error. Please try again.');
            } finally {
              setBusy(false);
            }
          },
          cancel_on_tap_outside: true,
        });
        const width = Math.max(220, Math.min(400, Math.floor(holder.current.getBoundingClientRect().width)));
        google.accounts.id.renderButton(holder.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          logo_alignment: 'center',
          text: mode === 'signup' ? 'signup_with' : 'signin_with',
          width,
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => { cancelled = true; };
  }, [mode]);

  // Not configured (or Google's script blocked): neutral placeholder
  if (!CLIENT_ID || failed) {
    return (
      <button
        type="button"
        onClick={() => onError(CLIENT_ID ? 'Google sign-in couldn’t load. Check your connection or ad blocker and try again.' : 'Google sign-in isn’t set up yet. Please use email for now.')}
        className="flex h-[44px] w-full items-center justify-center gap-3 rounded-md border border-[#D9E3EC] bg-white text-[15px] font-medium text-[#1F2D3D] transition hover:bg-[#F7F9FB]"
      >
        <span aria-hidden className="font-montserrat text-[18px] font-bold text-[#4285F4]">G</span>
        {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
      </button>
    );
  }

  return (
    <div className="relative">
      <div ref={holder} className={`flex min-h-[44px] w-full justify-center ${busy ? 'pointer-events-none opacity-60' : ''}`} />
      {busy && <p className="mt-2 text-center text-[13px] text-[#5F7896]" aria-live="polite">Signing you in…</p>}
    </div>
  );
}
