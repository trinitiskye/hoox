// src/app/api/auth/change-password/route.ts
//
// Replaces the old client-side changePassword() in src/lib/auth.ts, which
// had a real vulnerability: it took an `isAdminOverride` boolean straight
// from the caller and, when true, skipped the current-password check
// entirely — since that function ran in the browser, anyone could open
// devtools and call changePassword({ userId: '<any id>', newPassword: 'x',
// isAdminOverride: true }) to reset any account's password without ever
// knowing the original one. This route re-derives "is this caller actually
// an admin?" itself from the signed session cookie and a fresh database
// lookup — it never trusts a client-supplied admin flag.

export const runtime = 'edge';

import { getUserByIdAdmin, updateUserAdmin } from '@/lib/supabaseAdmin';
import { hashPassword, verifyPassword } from '@/lib/passwordHash';
import { getAuthenticatedUser } from '@/lib/serverSession';

export async function POST(request: Request) {
  const caller = await getAuthenticatedUser(request);
  if (!caller) {
    return Response.json({ success: false, error: 'You must be signed in to change a password.' }, { status: 401 });
  }

  let body: { userId?: string; currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }

  const { userId, currentPassword, newPassword } = body;
  if (!userId || !newPassword) {
    return Response.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return Response.json({ success: false, error: 'New password must be at least 6 characters.' });
  }

  const isOwnAccount = userId === caller.id;
  const isAdminOverride = !isOwnAccount;

  // An admin override is only honored if the CALLER's own session says
  // they're an admin right now — never based on anything the client sent.
  if (isAdminOverride && caller.role !== 'admin') {
    return Response.json({ success: false, error: 'You do not have permission to change this password.' }, { status: 403 });
  }

  if (!isAdminOverride) {
    if (!currentPassword) {
      return Response.json({ success: false, error: 'Current password is required.' });
    }
    const { data } = await getUserByIdAdmin(userId);
    if (!data?.[0]) return Response.json({ success: false, error: 'User not found.' });
    if (!verifyPassword(currentPassword, data[0].password_hash || '')) {
      return Response.json({ success: false, error: 'Current password is incorrect.' });
    }
  }

  const { error } = await updateUserAdmin(userId, { password_hash: hashPassword(newPassword) });
  if (error) return Response.json({ success: false, error });

  return Response.json({ success: true, error: null });
}
