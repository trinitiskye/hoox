import PublicLayout from '@/components/layout/PublicLayout';
import ComingSoon from '@/components/common/ComingSoon';

export const metadata = { title: 'Contact Us | HOOX' };

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <ComingSoon
        title="Contact Us"
        description="A contact form for anglers, directors, sponsors and advertisers is on the way."
        backHref="/"
        backLabel="Back to home"
      />
    </PublicLayout>
  );
}
