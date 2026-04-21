'use client';
export const runtime = 'edge';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import PublicLayout from '@/components/layout/PublicLayout';
import { toPath } from '@/lib/routes';
import RegisterJudgePage from '@/components/pages/RegisterJudgePage';

export default function Page() {
  const router = useRouter();
  const { login } = useAuth();
  const navigate = (view: string) => router.push(toPath(view));
  return (
    <PublicLayout>
      <RegisterJudgePage
        onNavigate={navigate}
        onLogin={(user) => { login(user); router.push('/'); }}
      />
    </PublicLayout>
  );
}
