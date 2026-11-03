import PublicLayout from '@/components/layout/PublicLayout';
import SubmitEventPage from '@/components/events/SubmitEventPage';

export const metadata = {
  title: 'Submit your Event | HOOX',
  description: 'List your fishing expo, trade show or boat show on HOOX, or request a featured hero or banner placement.',
};

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <SubmitEventPage />
    </PublicLayout>
  );
}
