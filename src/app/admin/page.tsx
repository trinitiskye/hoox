'use client';
export const runtime = 'edge';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import AdminDashboard from '@/components/pages/AdminDashboard';
import { toPath } from '@/lib/routes';

export default function Admin() {
  const router = useRouter();
  const { currentUser, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!currentUser || currentUser.role !== 'admin')) {
      router.replace('/admin-login');
    }
  }, [currentUser, loading, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600" />
      </div>
    );
  }

  return (
    <AdminDashboard
      currentUser={currentUser}
      onNavigate={(view) => router.push(toPath(view))}
      onLogout={handleLogout}
    />
  );
}
