'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import AdminDashboard from '@/components/pages/AdminDashboard';
import { toPath } from '@/lib/routes';

export default function AdminPage() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  if (!currentUser) return null;
  return (
    <AdminDashboard
      currentUser={currentUser}
      initialTab="Advertising"
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
