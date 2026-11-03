import { Suspense } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import SubmitClubSuccess from '@/components/clubs/SubmitClubSuccess';

export const metadata = { title: 'Club Submitted | HOOX', robots: { index: false } };

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <Suspense fallback={null}>
        <SubmitClubSuccess />
      </Suspense>
    </PublicLayout>
  );
}
