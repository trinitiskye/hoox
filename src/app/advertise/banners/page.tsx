import PublicLayout from '@/components/layout/PublicLayout';
import ComingSoon from '@/components/common/ComingSoon';

export const metadata = { title: 'Digital Banner Advertising | HOOX' };

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <ComingSoon
        title="Digital Banner Advertising"
        description="Soon you’ll be able to place banner ads on HOOX and reach anglers, directors and fishing fans."
        backHref="/"
        backLabel="Back to home"
      />
    </PublicLayout>
  );
}
