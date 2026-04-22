'use client';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { toPath } from '@/lib/routes';
import { useAuth } from '@/lib/AuthContext';
import LoginPage from '@/components/pages/LoginPage';

export default function Page() {
  const router = useRouter();
  const navigate = (view: string) => router.push(toPath(view));
  const { login } = useAuth();
  return (
    <PublicLayout>
      <LoginPage
        onNavigate={navigate}
        onLogin={(user) => { login(user); router.replace(user.role === 'admin' ? '/admin' : '/'); }}
      />
    </PublicLayout>
  );
}
