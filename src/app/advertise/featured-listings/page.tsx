import PublicLayout from '@/components/layout/PublicLayout';
import ComingSoon from '@/components/common/ComingSoon';

export const metadata = { title: 'Featured Listings | HOOX' };

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <ComingSoon
        title="Featured Listings"
        description="Soon you’ll be able to give your tournament, event or club featured placement across HOOX."
        backHref="/"
        backLabel="Back to home"
      />
    </PublicLayout>
  );
}
