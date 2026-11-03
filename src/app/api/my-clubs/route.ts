// src/app/api/my-clubs/route.ts
// The signed-in user's own submitted clubs (any status), for the
// "Which club?" picker on /clubs/feature.

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { listClubSubmissionsByUserAdmin } from '@/lib/supabaseAdmin';
import { isFeaturedNow, type MyClub } from '@/lib/clubFeature';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return Response.json({ clubs: [], error: 'Please sign in.' }, { status: 401 });

  const { data, error } = await listClubSubmissionsByUserAdmin(user.id);
  if (error) return Response.json({ clubs: [], error: 'Couldn’t load your clubs.' }, { status: 502 });

  const clubs: MyClub[] = (data || [])
    .filter((s) => s.status !== 'declined')
    .map((s) => ({
      id: s.id,
      name: s.club_name,
      city: s.city,
      state: s.state,
      status: s.status,
      featured: isFeaturedNow(s.featured, s.featured_until),
      featuredUntil: s.featured_until ?? null,
    }));
  return Response.json({ clubs, error: null }, { headers: { 'Cache-Control': 'no-store' } });
}
