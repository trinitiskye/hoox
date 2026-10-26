import PublicLayout from '@/components/layout/PublicLayout';
import ComingSoon from '@/components/common/ComingSoon';

export const metadata = { title: 'Feature your Club | HOOX' };

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <ComingSoon
        title="Feature your Club"
        description="Soon you’ll be able to promote your club with featured placement across HOOX so more anglers can find and join it."
        backHref="/clubs"
        backLabel="Browse clubs"
      />
    </PublicLayout>
  );
}
