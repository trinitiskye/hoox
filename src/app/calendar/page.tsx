import PublicLayout from '@/components/layout/PublicLayout';
import CalendarPage from '@/components/calendar/CalendarPage';

export const metadata = { title: 'Tournament Calendar | HOOX' };

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <CalendarPage />
    </PublicLayout>
  );
}
