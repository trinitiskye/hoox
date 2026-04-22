'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import AdminDashboard from '@/components/pages/AdminDashboard';
import { toPath } from '@/lib/routes';

export default function Page({ params }: { params: { id?: string } }) {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  if (!currentUser) return null;
  return (
    <AdminDashboard
      currentUser={currentUser}
      initialTab="Users"
      usersSubView="edit"
      usersSelectedId={params.id}
      onNavigate={(view) => {
        if (view.startsWith('/admin')) router.push(view);
        else router.push(toPath(view));
      }}
      onLogout={() => { logout(); router.replace('/'); }}
    />
  );
}
