// POST /api/tournaments/:id/registrations — enter a tournament.
//
// Individual tournaments: the signed-in angler registers themselves.
//   { sidePots?: string[] }
// Team tournaments: the signed-in angler registers as captain of a new team.
//   { teamName?, invites?: string[] (teammates' emails), sidePots?: string[] }
// The owning director or an admin can enter an angler: { anglerId, … }.
//
// Fees: main fee (per angler, or per team when the director sets that) +
// chosen side pots. HOOX's cut is the platform fee per registration (or per
// angler) from Admin → Affiliate Management → Program settings, capped at the
// fee. No money is collected online yet; amounts are recorded for reporting.

export const runtime = 'edge';

import { getAuthenticatedUser } from '@/lib/serverSession';
import { getUserByIdAdmin } from '@/lib/supabaseAdmin';
import { dbUserToApp, dbRegistrationToApp, type DbRegistration } from '@/lib/supabase';
import { loadAffiliateSettings } from '@/lib/affiliateServer';
import { formatFromRow, buyInPots, entryCost } from '@/lib/tournamentFormat';
import { getTournamentSrv, ownsEvent, registrationsFor, registrationProblem, anglerName, insertRow, deleteRow } from '@/lib/tournamentServer';
import { entryFor, inviteToTeam, type DbReg, type DbTeam } from '@/lib/teamServer';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await getAuthenticatedUser(request);
  if (!caller) return Response.json({ error: 'Please sign in to register.' }, { status: 401 });
  const { id } = await params;
  const t = await getTournamentSrv(id);
  if (!t) return Response.json({ error: 'Tournament not found.' }, { status: 404 });
  const f = formatFromRow(t);

  let b: Record<string, unknown> = {};
  try { b = await request.json(); } catch { /* empty body is fine */ }

  // Who is entering?
  let angler = caller;
  const byDirector = typeof b.anglerId === 'string' && b.anglerId && b.anglerId !== caller.id;
  if (byDirector) {
    if (!ownsEvent(caller, t)) return Response.json({ error: 'Only the tournament director can register someone else.' }, { status: 403 });
    const { data } = await getUserByIdAdmin(b.anglerId as string);
    if (!data?.[0]) return Response.json({ error: 'Angler not found.' }, { status: 404 });
    angler = dbUserToApp(data[0]);
  }
  if (angler.role !== 'angler') return Response.json({ error: 'Only angler accounts can register for tournaments.' }, { status: 403 });
  if (angler.status !== 'active') return Response.json({ error: 'This account isn’t active.' }, { status: 403 });

  const regs = (await registrationsFor(t.id)) as DbReg[];
  if (await entryFor(t, angler.id, regs)) return Response.json({ error: 'You’re already entered in this tournament.' }, { status: 409 });
  const closed = registrationProblem(t, regs.length);
  if (closed && !ownsEvent(caller, t)) return Response.json({ error: closed }, { status: 409 });

  // Side pots
  const wanted = Array.isArray(b.sidePots) ? (b.sidePots as unknown[]).map(String) : [];
  const potIds = buyInPots(f).filter((p) => wanted.includes(p.id)).map((p) => p.id);
  if (wanted.length !== potIds.length) return Response.json({ error: 'One of those side pots isn’t offered in this tournament.' }, { status: 400 });

  const fee = Number(t.entry_fee ?? t.registration_fee ?? 0) || 0;
  const { settings } = await loadAffiliateSettings();
  const cost = entryCost(f, fee, 1, potIds);
  const cutEach = Math.min(fee, settings.fallbackFee);
  const cut = Math.round(cutEach * 100) / 100; // one angler (or one team) to start; per-angler teams grow as teammates accept

  // Individual entry ---------------------------------------------------------
  if (f.entryType === 'individual') {
    const { data, error } = await insertRow<DbRegistration>('registrations', {
      tournament_id: t.id, angler: anglerName(angler), angler_id: angler.id,
      fee: cost.main, app_owner_cut: cut, director_receives: Math.round((cost.main - cut) * 100) / 100,
      side_pots: potIds, side_pot_fees: cost.pots,
    });
    if (error || !data?.[0]) return Response.json({ error: /duplicate|unique/i.test(error || '') ? 'You’re already registered for this tournament.' : 'Couldn’t save the registration.' }, { status: 500 });
    return Response.json({ registration: dbRegistrationToApp(data[0]), sidePots: potIds, cost, error: null });
  }

  // Team entry: captain + team + invites --------------------------------------
  const teamName = (typeof b.teamName === 'string' ? b.teamName.trim().slice(0, 80) : '') || `${anglerName(angler)}’s Team`;
  if (regs.some((r) => r.team_id && r.angler.toLowerCase() === teamName.toLowerCase())) return Response.json({ error: 'Another team already uses that name in this tournament.' }, { status: 409 });
  const invites = Array.isArray(b.invites) ? [...new Set((b.invites as unknown[]).map((e) => String(e).trim().toLowerCase()).filter(Boolean))] : [];
  if (invites.length > f.teamMax - 1) return Response.json({ error: `Teams can have up to ${f.teamMax} anglers, including you.` }, { status: 400 });

  const { data: teams, error: teamErr } = await insertRow<DbTeam>('teams', { tournament_id: t.id, name: teamName, captain_id: angler.id });
  const team = teams?.[0];
  if (teamErr || !team) return Response.json({ error: 'Couldn’t create the team.' }, { status: 500 });
  const now = new Date().toISOString();
  const { error: capErr } = await insertRow('team_members', {
    team_id: team.id, tournament_id: t.id, user_id: angler.id, email: angler.email.toLowerCase(), name: anglerName(angler),
    role: 'captain', status: 'accepted', invited_by: angler.id, invited_at: now, responded_at: now,
  });
  const { data, error } = capErr ? { data: null, error: capErr } : await insertRow<DbRegistration>('registrations', {
    tournament_id: t.id, angler: teamName, angler_id: angler.id, team_id: team.id,
    fee: cost.main, app_owner_cut: cut, director_receives: Math.round((cost.main - cut) * 100) / 100,
    side_pots: potIds, side_pot_fees: cost.pots,
  });
  if (error || !data?.[0]) { await deleteRow('teams', team.id); return Response.json({ error: 'Couldn’t save the registration.' }, { status: 500 }); }

  const inviteResults = [];
  for (const email of invites) {
    const r = await inviteToTeam(t, team, email, angler);
    inviteResults.push({ email, ok: !!r.member, error: r.error });
  }
  return Response.json({
    registration: dbRegistrationToApp(data[0]), team: { id: team.id, name: team.name }, invites: inviteResults,
    sidePots: potIds, cost, error: null,
  });
}
