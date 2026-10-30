'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import PublicLayout from '@/components/layout/PublicLayout';
import { toPath } from '@/lib/routes';
import RegisterDirectorPage from '@/components/pages/RegisterDirectorPage';

export default function Page() {
  const router = useRouter();
  const { login } = useAuth();
  const navigate = (view: string) => router.push(toPath(view));
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <RegisterDirectorPage
        onNavigate={navigate}
        onLogin={(user) => { login(user); router.replace('/'); }}
      />
    </PublicLayout>
  );
}
