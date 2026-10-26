import PublicLayout from '@/components/layout/PublicLayout';
import ComingSoon from '@/components/common/ComingSoon';

export const metadata = { title: 'Affiliate Programs | HOOX' };

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <ComingSoon
        title="Affiliate Programs"
        description="Details on partnering with HOOX through our affiliate programs are on the way."
        backHref="/"
        backLabel="Back to home"
      />
    </PublicLayout>
  );
}
