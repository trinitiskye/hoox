'use client';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { toPath } from '@/lib/routes';
import SeriesPage from '@/components/pages/SeriesPage';

export default function Page() {
  const router = useRouter();
  const navigate = (view: string) => router.push(toPath(view));
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <SeriesPage onNavigate={navigate} />
    </PublicLayout>
  );
}
