import PublicLayout from '@/components/layout/PublicLayout';
import EventCalendarPage from '@/components/calendar/EventCalendarPage';

export const metadata = {
  title: 'Event Calendar | HOOX',
  description: 'Month-by-month calendar of fishing expos, boat shows, trade shows and festivals on HOOX.',
};

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <EventCalendarPage />
    </PublicLayout>
  );
}
