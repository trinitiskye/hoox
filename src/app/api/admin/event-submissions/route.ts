// src/app/api/admin/event-submissions/route.ts
// Admin-only list of "Submit your Event" requests (newest first).

export const runtime = 'edge';

import { listEventSubmissionsAdmin } from '@/lib/supabaseAdmin';
import { getAuthenticatedAdmin } from '@/lib/serverSession';

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await listEventSubmissionsAdmin();
  if (error) return Response.json({ submissions: [], error }, { status: 500 });
  return Response.json({ submissions: data || [], error: null });
}
