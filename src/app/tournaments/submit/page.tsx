import PublicLayout from '@/components/layout/PublicLayout';
import ComingSoon from '@/components/common/ComingSoon';

export const metadata = { title: 'List your Tournament | HOOX' };

export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <ComingSoon
        title="List your Tournament"
        description="Soon tournament directors will be able to list their tournaments on HOOX so anglers can find and register for them."
        backHref="/tournaments"
        backLabel="Browse tournaments"
      />
    </PublicLayout>
  );
}
