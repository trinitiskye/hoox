// Admin-only: every user with their private account fields (email, phone,
// address …). Public pages can only read users_public, which leaves those out.
// Password hashes are never returned.

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { supabaseAdminFetch } from '@/lib/supabaseAdmin';
import { dbUserToApp, type DbUser } from '@/lib/supabase';

export async function GET(request: Request) {
  if (!(await getAuthenticatedAdmin(request))) return Response.json({ users: [], error: 'Forbidden' }, { status: 403 });
  const { data, error } = await supabaseAdminFetch<DbUser[]>('users?select=*&order=created_at.desc&limit=10000');
  if (error) return Response.json({ users: [], error: 'Couldn’t load users.' }, { status: 500 });
  return Response.json({ users: (data || []).map(dbUserToApp), error: null }, { headers: { 'Cache-Control': 'no-store' } });
}
