'use client';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { toPath } from '@/lib/routes';
import ClubsPage from '@/components/pages/ClubsPage';

export default function Page() {
  const router = useRouter();
  const navigate = (view: string) => router.push(toPath(view));
  return (
    <PublicLayout>
      <ClubsPage onNavigate={navigate} />
    </PublicLayout>
  );
}
