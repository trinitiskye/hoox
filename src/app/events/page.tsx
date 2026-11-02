'use client';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { toPath } from '@/lib/routes';
import EventsPage from '@/components/pages/EventsPage';

export default function Page() {
  const router = useRouter();
  const navigate = (view: string) => router.push(toPath(view));
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <EventsPage onNavigate={navigate} />
    </PublicLayout>
  );
}
