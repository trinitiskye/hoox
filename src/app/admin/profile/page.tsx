'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import AdminDashboard from '@/components/pages/AdminDashboard';
import { toPath } from '@/lib/routes';

/** The signed-in admin's own profile — opened from their name in the header. */
export default function Page() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  if (!currentUser) return null;
  return (
    <AdminDashboard
      currentUser={currentUser}
      initialTab="Users"
      usersSubView="view"
      usersSelectedId={currentUser.id}
      onNavigate={(view) => router.push(view.startsWith('/admin') ? view : toPath(view))}
      onNavigateReplace={(view) => router.replace(view.startsWith('/admin') ? view : toPath(view))}
      onLogout={() => { logout(); router.replace('/'); }}
    />
  );
}
