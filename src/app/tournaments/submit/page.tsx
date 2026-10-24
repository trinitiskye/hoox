import PublicLayout from '@/components/layout/PublicLayout';
import ComingSoon from '@/components/common/ComingSoon';

export const metadata = { title: 'Submit a Tournament | HOOX' };

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <ComingSoon
        title="Submit a Tournament"
        description="Soon tournament directors will be able to submit their tournaments to HOOX so anglers can find and register for them."
        backHref="/tournaments"
        backLabel="Browse tournaments"
      />
    </PublicLayout>
  );
}
