// Expo / trade show detail page — /events/<id>
// Server wrapper so the dynamic route runs on the Cloudflare edge runtime.

export const runtime = 'edge';

import PublicLayout from '@/components/layout/PublicLayout';
import ExpoDetailPage from '@/components/events/ExpoDetailPage';

export default async function EventDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <ExpoDetailPage id={decodeURIComponent(id)} />
    </PublicLayout>
  );
}
