'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import PublicLayout from '@/components/layout/PublicLayout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentUser, loading, logout } = useAuth();
  const expiredRef = useRef(false);
  const isAdmin = !!currentUser && currentUser.role === 'admin';

  useEffect(() => {
    if (!loading && (!currentUser || currentUser.role !== 'admin')) {
      router.replace(expiredRef.current ? '/admin-login?expired=1' : '/admin-login');
    }
  }, [currentUser, loading, router]);

  // Keep the server session in step with the page: refresh it while the admin
  // is active, and send them to sign in again if it has expired (otherwise
  // admin pages load but every request comes back "Forbidden").
  useEffect(() => {
    if (!isAdmin) return;
    let stopped = false;
    const check = async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!stopped && res.status === 401) {
          stopped = true;
          expiredRef.current = true;
          logout();
        }
      } catch { /* offline: try again next time */ }
    };
    check();
    const id = window.setInterval(check, 15 * 60 * 1000);
    const onFocus = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onFocus);
    return () => { stopped = true; window.clearInterval(id); document.removeEventListener('visibilitychange', onFocus); };
  }, [isAdmin, logout, router]);

  if (loading || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#0E7C7B]" />
      </div>
    );
  }

  // Same branded shell as the public site: header (+ admin tier), content, footer
  return <PublicLayout bgClassName="bg-[#F1F6FA]">{children}</PublicLayout>;
}
