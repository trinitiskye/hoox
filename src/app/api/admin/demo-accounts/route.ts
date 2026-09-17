// src/app/api/admin/demo-accounts/route.ts
//
// Replaces the old createAllDemoAccounts() in src/lib/auth.ts, which was an
// exported client function with no permission check of its own — it was
// only "protected" by being tucked behind a button on the admin dashboard,
// but any visitor could call it directly from the browser console on any
// page to (re)create the 4 demo accounts and reset their shared password
// back to a known value. This route requires a verified admin session.

export const runtime = 'edge';

import { getUserByEmailAdmin, createUserAdmin, updateUserAdmin } from '@/lib/supabaseAdmin';
import { hashPassword } from '@/lib/passwordHash';
import { getAuthenticatedAdmin } from '@/lib/serverSession';
import type { DbUserInsert } from '@/lib/supabase';

interface DemoAccountResult {
  email: string;
  role: string;
  status: 'created' | 'updated' | 'error';
  error?: string;
}

const ACCOUNTS: { email: string; name: string; role: DbUserInsert['role']; organization: string | null; message: string | null }[] = [
  { email: 'tournamentdirector@hoox.app', name: 'Demo Director', role: 'director', organization: 'HOOX Demo Club', message: null },
  { email: 'angler@hoox.app', name: 'Demo Angler', role: 'angler', organization: null, message: null },
  // connected to the demo director
  { email: 'judge@hoox.app', name: 'Demo Judge', role: 'judge', organization: null, message: 'tournamentdirector@hoox.app' },
  { email: 'partner@hoox.app', name: 'Demo Partner', role: 'sponsor', organization: 'Demo Sponsor Co.', message: null },
];

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const password = hashPassword('demo123');
  const results: DemoAccountResult[] = [];

  for (const account of ACCOUNTS) {
    const { data: existing } = await getUserByEmailAdmin(account.email);

    if (existing && existing.length > 0) {
      const { error } = await updateUserAdmin(existing[0].id, {
        role: account.role,
        status: 'active',
        password_hash: password,
        organization: account.organization,
        message: account.message,
      });
      results.push({ email: account.email, role: account.role, status: error ? 'error' : 'updated', error: error ?? undefined });
    } else {
      const { error } = await createUserAdmin({
        name: account.name,
        email: account.email,
        password_hash: password,
        role: account.role,
        status: 'active',
        organization: account.organization,
        message: account.message,
        address: null, city: null, state: null, zip: null,
        phone: null, website: null, avatar: null,
        banner_image: null, banner_start_date: null, banner_end_date: null,
        country: null,
      });
      results.push({ email: account.email, role: account.role, status: error ? 'error' : 'created', error: error ?? undefined });
    }
  }

  return Response.json({ results });
}
