'use client';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import DownloadAppPage from '@/components/pages/DownloadAppPage';
import { toPath } from '@/lib/routes';

// /download — HOOX mobile app info and store links
export default function Page() {
  const router = useRouter();
  const navigate = (view: string) => router.push(toPath(view));
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <DownloadAppPage onNavigate={navigate} />
    </PublicLayout>
  );
}
