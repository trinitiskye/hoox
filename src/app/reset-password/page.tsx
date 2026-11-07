'use client';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { toPath } from '@/lib/routes';
import ResetPasswordPage from '@/components/pages/ResetPasswordPage';

export default function Page() {
  const router = useRouter();
  return (
    <PublicLayout>
      <ResetPasswordPage onNavigate={(view) => router.push(toPath(view))} />
    </PublicLayout>
  );
}
