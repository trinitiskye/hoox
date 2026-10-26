import PublicLayout from '@/components/layout/PublicLayout';
import ComingSoon from '@/components/common/ComingSoon';

export const metadata = { title: 'Activities | HOOX' };

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <ComingSoon
        title="Activities"
        description="Soon you’ll be able to find fishing activities, clinics and meetups near you on HOOX."
        backHref="/events"
        backLabel="Browse events"
      />
    </PublicLayout>
  );
}
