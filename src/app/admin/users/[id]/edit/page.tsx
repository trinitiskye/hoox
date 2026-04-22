'use client';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import AdminDashboard from '@/components/pages/AdminDashboard';
import { toPath } from '@/lib/routes';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  if (!currentUser) return null;
  return (
    <AdminDashboard
      currentUser={currentUser}
      initialTab="Users"
      usersSubView="edit"
      usersSelectedId={id}
      onNavigate={(view) => {
        if (view.startsWith('/admin')) router.push(view);
        else router.push(toPath(view));
      }}
      onLogout={() => { logout(); router.replace('/'); }}
    />
  );
}
