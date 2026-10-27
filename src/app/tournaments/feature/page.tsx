import PublicLayout from '@/components/layout/PublicLayout';
import ComingSoon from '@/components/common/ComingSoon';

export const metadata = { title: 'Feature a Listing | HOOX' };

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <ComingSoon
        title="Feature a Listing"
        description="Soon you’ll be able to promote your tournament with featured placement across HOOX."
        backHref="/tournaments"
        backLabel="Browse tournaments"
      />
    </PublicLayout>
  );
}
