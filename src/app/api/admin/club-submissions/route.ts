// src/app/api/admin/club-submissions/route.ts
// Admin-only list of "Submit a Club" requests (newest first).

export const runtime = 'edge';

import { listClubSubmissionsAdmin } from '@/lib/supabaseAdmin';
import { getAuthenticatedAdmin } from '@/lib/serverSession';

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await listClubSubmissionsAdmin();
  if (error) return Response.json({ submissions: [], error }, { status: 500 });
  return Response.json({ submissions: data || [], error: null });
}
