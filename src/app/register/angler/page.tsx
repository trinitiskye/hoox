'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import PublicLayout from '@/components/layout/PublicLayout';
import { toPath } from '@/lib/routes';
import RegisterAnglerPage from '@/components/pages/RegisterAnglerPage';

export default function Page() {
  const router = useRouter();
  const { login } = useAuth();
  const navigate = (view: string) => router.push(toPath(view));
  return (
    <PublicLayout>
      <RegisterAnglerPage
        onNavigate={navigate}
        onLogin={(user) => { login(user); router.replace('/'); }}
      />
    </PublicLayout>
  );
}
