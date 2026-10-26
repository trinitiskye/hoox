import PublicLayout from '@/components/layout/PublicLayout';
import ComingSoon from '@/components/common/ComingSoon';

export const metadata = { title: 'Submit your Event | HOOX' };

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <ComingSoon
        title="Submit your Event"
        description="Soon you’ll be able to submit your fishing expo, trade show or activity to be listed on HOOX."
        backHref="/events"
        backLabel="Browse events"
      />
    </PublicLayout>
  );
}
