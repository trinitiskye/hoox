import PublicLayout from '@/components/layout/PublicLayout';
import AffiliateProgramPage from '@/components/pages/AffiliateProgramPage';

export const metadata = {
  title: 'Affiliate Program | HOOX',
  description: 'Refer tournament directors to HOOX and earn a share of every angler registration.',
};

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <AffiliateProgramPage />
    </PublicLayout>
  );
}
