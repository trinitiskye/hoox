'use client';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { toPath } from '@/lib/routes';
import ForgotPasswordPage from '@/components/pages/ForgotPasswordPage';

export default function Page() {
  const router = useRouter();
  const navigate = (view: string) => router.push(toPath(view));
  return (
    <PublicLayout>
      <ForgotPasswordPage onNavigate={navigate} />
    </PublicLayout>
  );
}
