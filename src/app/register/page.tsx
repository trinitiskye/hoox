'use client';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { toPath } from '@/lib/routes';
import SignUpPage from '@/components/pages/SignUpPage';

export default function Page() {
  const router = useRouter();
  const navigate = (view: string) => router.push(toPath(view));
  return (
    <PublicLayout bgClassName="bg-[#D4E1EE]">
      <SignUpPage onNavigate={navigate} />
    </PublicLayout>
  );
}
