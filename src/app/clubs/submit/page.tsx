import PublicLayout from '@/components/layout/PublicLayout';
import SubmitClubPage from '@/components/clubs/SubmitClubPage';

export const metadata = {
  title: 'Submit a Club | HOOX',
  description: 'List your fishing club in the HOOX directory. Anglers and Tournament Directors can submit clubs.',
};

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <SubmitClubPage />
    </PublicLayout>
  );
}
