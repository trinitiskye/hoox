import PublicLayout from '@/components/layout/PublicLayout';
import ComingSoon from '@/components/common/ComingSoon';

export const metadata = { title: 'List an Activity | HOOX' };

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <ComingSoon
        title="List an Activity"
        description="Soon you’ll be able to list fishing activities, clinics and meetups on the HOOX event calendar."
        backHref="/events"
        backLabel="Browse events"
      />
    </PublicLayout>
  );
}
