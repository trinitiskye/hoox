import PublicLayout from '@/components/layout/PublicLayout';
import ComingSoon from '@/components/common/ComingSoon';

export const metadata = { title: 'FAQ | HOOX' };

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <ComingSoon
        title="FAQ"
        description="Answers to common questions about tournaments, registration, catch submissions and more are on the way."
        backHref="/"
        backLabel="Back to home"
      />
    </PublicLayout>
  );
}
