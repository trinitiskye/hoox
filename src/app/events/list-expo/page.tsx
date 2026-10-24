import PublicLayout from '@/components/layout/PublicLayout';
import ComingSoon from '@/components/common/ComingSoon';

export const metadata = { title: 'List your Expo or Tradeshow | HOOX' };

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <ComingSoon
        title="List your Expo or Tradeshow"
        description="Soon you’ll be able to list your fishing expo, boat show or tradeshow on the HOOX event calendar."
        backHref="/events"
        backLabel="Browse events"
      />
    </PublicLayout>
  );
}
