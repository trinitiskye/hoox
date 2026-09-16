'use client';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { toPath } from '@/lib/routes';
import PartnerPage from '@/components/pages/PartnerPage';

export default function Page() {
  const router = useRouter();
  const navigate = (view: string) => router.push(toPath(view));
  return (
    <PublicLayout>
      <PartnerPage onNavigate={navigate} />
    </PublicLayout>
  );
}
