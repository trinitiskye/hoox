// Full standings — /tournaments/<id>/leaderboard
// Server wrapper so the dynamic route runs on the Cloudflare edge runtime;
// data loads client-side in StandingsLoader.

export const runtime = 'edge';

import StandingsLoader from '@/components/event/StandingsPage';

export default async function TournamentStandingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StandingsLoader id={decodeURIComponent(id)} />;
}
