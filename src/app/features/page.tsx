'use client';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { toPath } from '@/lib/routes';
import FeaturesPage from '@/components/pages/FeaturesPage';

export default function Page() {
  const router = useRouter();
  const navigate = (view: string) => router.push(toPath(view));
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <FeaturesPage onNavigate={navigate} />
    </PublicLayout>
  );
}
