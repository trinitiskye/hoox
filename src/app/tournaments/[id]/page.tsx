// Tournament / Event detail page — /tournaments/<id>
// Server wrapper so the dynamic route can run on the Cloudflare edge runtime;
// all data loading happens client-side in EventDetailLoader.
// /tournaments/lakefront-classic shows the design demo event.

export const runtime = 'edge';

import EventDetailLoader from '@/components/event/EventDetailLoader';

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventDetailLoader id={decodeURIComponent(id)} />;
}
