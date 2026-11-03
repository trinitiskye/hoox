// Admin-only list of "Feature your Club" requests (newest first).
export const runtime = 'edge';

import { listClubFeatureRequestsAdmin } from '@/lib/supabaseAdmin';
import { getAuthenticatedAdmin } from '@/lib/serverSession';

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { data, error } = await listClubFeatureRequestsAdmin();
  if (error) return Response.json({ requests: [], error }, { status: 500 });
  return Response.json({ requests: data || [], error: null });
}
