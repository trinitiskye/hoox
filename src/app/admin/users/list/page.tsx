'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import AdminDashboard from '@/components/pages/AdminDashboard';
import { toPath } from '@/lib/routes';

export default function Page() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  if (!currentUser) return null;
  return (
    <AdminDashboard
      currentUser={currentUser}
      initialTab="Users"
      usersSubView="list"
      usersFilter={filter}
      onNavigate={(view) => {
        if (view.startsWith('/admin')) router.push(view);
        else router.push(toPath(view));
      }}
      onNavigateReplace={(view) => {
        if (view.startsWith('/admin')) router.replace(view);
        else router.replace(toPath(view));
      }}
      onLogout={() => { logout(); router.replace('/'); }}
    />
  );
}
