// Public angler profile — /anglers/<slug> (opened from leaderboard names).
// Server wrapper so the dynamic route runs on the Cloudflare edge runtime.

export const runtime = 'edge';

import AnglerProfileLoader from '@/components/angler/AnglerProfileLoader';

export default async function AnglerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AnglerProfileLoader slug={decodeURIComponent(slug)} />;
}
