import PublicLayout from '@/components/layout/PublicLayout';
import SubmitTicketPage from '@/components/support/SubmitTicketPage';

export const metadata = {
  title: 'Submit a Ticket | HOOX',
  description: 'Send a support ticket to the HOOX team about your account, tournaments, catch submissions, clubs, events or advertising.',
};

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <SubmitTicketPage />
    </PublicLayout>
  );
}
