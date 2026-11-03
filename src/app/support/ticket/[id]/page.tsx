import { Suspense } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import TicketViewPage from '@/components/support/TicketViewPage';

export const runtime = 'edge';
export const metadata = { title: 'Your Support Ticket | HOOX', robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <Suspense fallback={null}>
        <TicketViewPage id={id} />
      </Suspense>
    </PublicLayout>
  );
}
