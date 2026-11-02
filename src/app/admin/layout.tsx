'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import PublicLayout from '@/components/layout/PublicLayout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!currentUser || currentUser.role !== 'admin')) {
      router.replace('/admin-login');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#0E7C7B]" />
      </div>
    );
  }

  // Same branded shell as the public site: header (+ admin tier), content, footer
  return <PublicLayout bgClassName="bg-white">{children}</PublicLayout>;
}
