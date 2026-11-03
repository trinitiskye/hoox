import PublicLayout from '@/components/layout/PublicLayout';
import FeatureClubPage from '@/components/clubs/FeatureClubPage';

export const metadata = {
  title: 'Feature your Club | HOOX',
  description: 'Put your fishing club at the top of the HOOX directory, on the Clubs page banner and the home page. Plans from $20.75/month.',
};

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <FeatureClubPage />
    </PublicLayout>
  );
}
