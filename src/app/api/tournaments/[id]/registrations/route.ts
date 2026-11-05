// POST /api/tournaments/:id/registrations — register for a tournament.
//   Anglers register themselves: {}.
//   The owning director or an admin can add an angler: { anglerId }.
// HOOX's cut is the platform fee per registration (Admin → Affiliate Management
// → Program settings → HOOX fee per registration), capped at the entry fee.
// No payment is taken online yet; the fee is recorded for reporting.

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { getUserByIdAdmin } from '@/lib/supabaseAdmin';
import { dbUserToApp, dbRegistrationToApp, type DbRegistration } from '@/lib/supabase';
import { loadAffiliateSettings } from '@/lib/affiliateServer';
import { getTournamentSrv, ownsEvent, registrationsFor, registrationProblem, anglerName, insertRow } from '@/lib/tournamentServer';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await getAuthenticatedUser(request);
  if (!caller) return Response.json({ error: 'Please sign in to register.' }, { status: 401 });
  const { id } = await params;
  const t = await getTournamentSrv(id);
  if (!t) return Response.json({ error: 'Tournament not found.' }, { status: 404 });

  let b: Record<string, unknown> = {};
  try { b = await request.json(); } catch { /* empty body is fine */ }

  // Who is being registered?
  let angler = caller;
  if (typeof b.anglerId === 'string' && b.anglerId && b.anglerId !== caller.id) {
    if (!ownsEvent(caller, t)) return Response.json({ error: 'Only the tournament director can register someone else.' }, { status: 403 });
    const { data } = await getUserByIdAdmin(b.anglerId);
    if (!data?.[0]) return Response.json({ error: 'Angler not found.' }, { status: 404 });
    angler = dbUserToApp(data[0]);
  }
  if (angler.role !== 'angler') return Response.json({ error: 'Only angler accounts can register for tournaments.' }, { status: 403 });
  if (angler.status !== 'active') return Response.json({ error: 'This account isn’t active.' }, { status: 403 });

  const regs = await registrationsFor(t.id);
  if (regs.some((r) => r.angler_id === angler.id)) return Response.json({ error: 'You’re already registered for this tournament.' }, { status: 409 });
  const closed = registrationProblem(t, regs.length);
  if (closed && !ownsEvent(caller, t)) return Response.json({ error: closed }, { status: 409 });

  const fee = Number(t.entry_fee ?? t.registration_fee ?? 0) || 0;
  const { settings } = await loadAffiliateSettings();
  const cut = Math.round(Math.min(fee, settings.fallbackFee) * 100) / 100;
  const { data, error } = await insertRow<DbRegistration>('registrations', {
    tournament_id: t.id, angler: anglerName(angler), angler_id: angler.id,
    fee, app_owner_cut: cut, director_receives: Math.round((fee - cut) * 100) / 100,
  });
  if (error || !data?.[0]) {
    return Response.json({ error: /duplicate|unique/i.test(error || '') ? 'You’re already registered for this tournament.' : 'Couldn’t save the registration.' }, { status: 500 });
  }
  return Response.json({ registration: dbRegistrationToApp(data[0]), error: null });
}
