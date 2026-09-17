// src/app/api/admin/users/[id]/route.ts
//
// Replaces the direct anon-key updateUser()/deleteUser() calls that used to
// run straight from the browser in AdminDashboard.tsx (doAction, doDelete,
// saveEdit). Those calls only "worked" because the Supabase anon key had
// wide-open update/delete policies — meaning any visitor, not just a logged
// -in admin, could hit the same REST endpoints directly. Every handler here
// re-checks the CALLER's session server-side (via the signed httpOnly
// cookie + a fresh database lookup) before touching anything, using the
// service-role client which bypasses RLS entirely.

export const runtime = 'edge';

import { updateUserAdmin, deleteUserAdmin } from '@/lib/supabaseAdmin';
import { dbUserToApp } from '@/lib/supabase';
import { getAuthenticatedAdmin } from '@/lib/serverSession';
import type { DbUserInsert } from '@/lib/supabase';

const STATUS_ACTIONS: Record<string, DbUserInsert['status']> = {
  approve: 'active',
  pause: 'paused',
  unpause: 'active',
  ban: 'banned',
  unban: 'active',
};

// POST { action: 'approve' | 'pause' | 'unpause' | 'ban' | 'unban' }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const status = body.action ? STATUS_ACTIONS[body.action] : undefined;
  if (!status) return Response.json({ error: 'Unknown action.' }, { status: 400 });

  const { data, error } = await updateUserAdmin(id, { status });
  if (error || !data?.[0]) return Response.json({ error: error || 'Update failed.' }, { status: 500 });

  return Response.json({ user: dbUserToApp(data[0]), error: null });
}

// PATCH — edit a user's profile fields (name, email, role, org, address, etc.)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  let body: Partial<DbUserInsert>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const allowedFields: (keyof DbUserInsert)[] = [
    'name', 'email', 'role', 'organization', 'phone', 'address', 'city', 'state', 'zip', 'website',
    'profile_avatar', 'profile_display_name', 'profile_organization', 'profile_address',
    'profile_city', 'profile_state', 'profile_zip', 'profile_country', 'profile_email',
    'profile_phone', 'profile_website', 'profile_club_affiliations', 'profile_sponsors',
  ];
  const updates: Partial<DbUserInsert> = {};
  for (const field of allowedFields) {
    if (field in body) (updates as Record<string, unknown>)[field] = body[field];
  }

  const { data, error } = await updateUserAdmin(id, updates);
  if (error || !data?.[0]) return Response.json({ error: error || 'Update failed.' }, { status: 500 });

  return Response.json({ user: dbUserToApp(data[0]), error: null });
}

// DELETE — permanently remove a user account
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { error } = await deleteUserAdmin(id);
  if (error) return Response.json({ error }, { status: 500 });

  return Response.json({ ok: true, error: null });
}
