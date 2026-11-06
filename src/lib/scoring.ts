// Tournament scoring (pure, client + server safe).
//
// Entries are individual anglers or teams. Only APPROVED catches count.
//   Main leaderboard: each entry's best N fish (fish limit) by the main
//   measure; ranked by total, then (judged by both) the other measure's total,
//   then biggest fish. Ties share a place (1, 2, 2, 4).
//   Place prizes go to those places.
//   Side pots / bonus awards: winners by their rule among eligible entries
//   (pots: entries that bought in; awards: everyone).

import { measuresFor, unitOf, buyInPots, type TournamentFormat, type SidePot, type Measure } from './tournamentFormat';

export interface ScoreRegistration { id: string; angler: string; angler_id: string | null; team_id?: string | null; side_pots?: string[] | null }
export interface ScoreTeam { id: string; name: string; captain_id: string }
export interface ScoreMember { team_id: string; user_id: string | null; name: string | null; status: string }
export interface ScoreSubmission {
  id: string; angler: string; angler_id: string | null; team_id?: string | null; species: string;
  size: number; weight_lb?: number | null; length_in?: number | null; status: string; catch_date?: string; catch_time?: string;
}

export interface EntryStanding {
  entryId: string;          // registration id
  name: string;             // angler or team name
  members: string[];        // team member names (empty for individuals)
  rank: number | null;      // null = no approved catch yet
  fish: number;             // approved fish counted (after the fish limit)
  caught: number;           // all approved fish
  total: number;            // main measure total
  secondaryTotal: number | null;
  bigFish: number | null;   // biggest single fish by the main measure
  prize: string | null;
}
export interface PotWinner { entryId: string; name: string; value: number | null; place: number; prize: string | null }
export interface PotResult {
  pot: SidePot;
  entrants: number;
  collected: number;        // fees paid into the pot
  leaders: PotWinner[];     // current leaders / winners, best first
  measure: Measure | null;
}
export interface Scoreboard {
  measures: Measure[];
  primary: Measure;
  unit: string;
  fishLimit: number | null;
  entries: EntryStanding[];
  pots: PotResult[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const fmtMoney = (n: number) => `$${n.toLocaleString('en-US', Number.isInteger(n) ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** A catch's weight / length, falling back to the single legacy "size" column */
export function measureOf(s: ScoreSubmission, m: Measure, f: TournamentFormat): number | null {
  const v = m === 'weight' ? s.weight_lb : s.length_in;
  if (v !== null && v !== undefined && Number.isFinite(Number(v))) return Number(v);
  // Older catches only have "size": it's the main measure
  return f.primaryMeasure === m && Number.isFinite(Number(s.size)) ? Number(s.size) : null;
}

export function computeScoreboard(
  f: TournamentFormat,
  regs: ScoreRegistration[],
  subs: ScoreSubmission[],
  teams: ScoreTeam[] = [],
  members: ScoreMember[] = [],
): Scoreboard {
  const measures = measuresFor(f.scoring);
  const primary = f.primaryMeasure;
  const secondary = measures.find((m) => m !== primary) ?? null;
  const approved = subs.filter((s) => s.status === 'approved');
  const teamById = new Map(teams.map((t) => [t.id, t]));

  // Which entry does each catch belong to?
  const byAngler = new Map<string, string>(); // angler_id → registration id
  const byName = new Map<string, string>();   // legacy rows without ids
  const byTeam = new Map<string, string>();   // team_id → registration id
  regs.forEach((r) => {
    if (r.team_id) byTeam.set(r.team_id, r.id);
    if (r.angler_id) byAngler.set(r.angler_id, r.id);
    byName.set(r.angler.toLowerCase(), r.id);
  });
  members.filter((m) => m.status === 'accepted' && m.user_id).forEach((m) => { const reg = byTeam.get(m.team_id); if (reg) byAngler.set(m.user_id!, reg); });
  const entryOf = (s: ScoreSubmission) => (s.team_id && byTeam.get(s.team_id)) || (s.angler_id && byAngler.get(s.angler_id)) || byName.get(s.angler.toLowerCase()) || null;

  const catches = new Map<string, ScoreSubmission[]>();
  approved.forEach((s) => { const e = entryOf(s); if (e) catches.set(e, [...(catches.get(e) ?? []), s]); });

  const entries: EntryStanding[] = regs.map((r) => {
    const team = r.team_id ? teamById.get(r.team_id) : undefined;
    const all = (catches.get(r.id) ?? []).filter((s) => measureOf(s, primary, f) !== null)
      .sort((a, b) => measureOf(b, primary, f)! - measureOf(a, primary, f)!);
    const counted = f.fishLimit ? all.slice(0, f.fishLimit) : all;
    return {
      entryId: r.id,
      name: team?.name || r.angler,
      members: team ? members.filter((m) => m.team_id === team.id && m.status === 'accepted').map((m) => m.name || 'Teammate') : [],
      rank: null,
      fish: counted.length,
      caught: all.length,
      total: round2(counted.reduce((n, s) => n + measureOf(s, primary, f)!, 0)),
      secondaryTotal: secondary ? round2(counted.reduce((n, s) => n + (measureOf(s, secondary, f) ?? 0), 0)) : null,
      bigFish: all.length ? measureOf(all[0], primary, f) : null,
      prize: null,
    };
  });

  // Rank: total → other measure → big fish; ties share a place
  const cmp = (a: EntryStanding, b: EntryStanding) => (b.total - a.total) || ((b.secondaryTotal ?? 0) - (a.secondaryTotal ?? 0)) || ((b.bigFish ?? 0) - (a.bigFish ?? 0));
  const scored = entries.filter((e) => e.fish > 0).sort((a, b) => cmp(a, b) || a.name.localeCompare(b.name));
  scored.forEach((e, i) => { e.rank = i > 0 && cmp(scored[i - 1], e) === 0 ? scored[i - 1].rank : i + 1; });
  scored.forEach((e) => {
    const p = f.placePrizes.find((x) => e.rank !== null && e.rank >= x.place && e.rank <= (x.toPlace ?? x.place));
    if (p) e.prize = [p.amount !== null ? fmtMoney(p.amount) : '', p.description].filter(Boolean).join(' · ');
  });
  const unscored = entries.filter((e) => e.fish === 0).sort((a, b) => a.name.localeCompare(b.name));

  // Side pots and bonus awards
  const regById = new Map(regs.map((r) => [r.id, r]));
  const standingById = new Map(entries.map((e) => [e.entryId, e]));
  const pots: PotResult[] = f.sidePots.map((pot) => {
    const eligible = pot.kind === 'award' ? regs : regs.filter((r) => (r.side_pots ?? []).includes(pot.id));
    const collected = pot.kind === 'pot' ? round2(eligible.length * pot.fee) : 0;
    const places = pot.payout === 'share' ? Math.max(1, pot.splits.length) : 1;
    const prizeFor = (place: number) => {
      if (pot.payout === 'share') { const pct = pot.splits[place - 1]; return pct ? fmtMoney(round2(collected * pct / 100)) : null; }
      return place === 1 ? [pot.amount !== null ? fmtMoney(pot.amount) : '', pot.description].filter(Boolean).join(' · ') || null : null;
    };
    let measure: Measure | null = null;
    let ranked: { entryId: string; value: number | null }[] = [];

    if (pot.rule === 'director_pick') {
      ranked = pot.winnerId && regById.has(pot.winnerId) && eligible.some((r) => r.id === pot.winnerId) ? [{ entryId: pot.winnerId, value: null }] : [];
    } else if (pot.rule === 'best_total') {
      measure = primary;
      ranked = scored.filter((e) => eligible.some((r) => r.id === e.entryId)).map((e) => ({ entryId: e.entryId, value: e.total }));
    } else {
      measure = pot.rule.endsWith('heaviest') || pot.rule === 'heaviest_fish' ? 'weight' : 'length';
      const species = pot.species?.toLowerCase();
      ranked = eligible.map((r) => {
        const best = (catches.get(r.id) ?? [])
          .filter((s) => !species || s.species.toLowerCase() === species)
          .map((s) => measureOf(s, measure!, f)).filter((v): v is number => v !== null)
          .sort((a, b) => b - a)[0];
        return { entryId: r.id, value: best ?? null };
      }).filter((x) => x.value !== null).sort((a, b) => b.value! - a.value!);
    }

    const leaders: PotWinner[] = [];
    ranked.slice(0, Math.max(places, 3)).forEach((x, i) => {
      const place = i > 0 && ranked[i - 1].value === x.value && x.value !== null ? leaders[i - 1].place : i + 1;
      leaders.push({ entryId: x.entryId, name: standingById.get(x.entryId)?.name ?? '', value: x.value, place, prize: place <= places ? prizeFor(place) : null });
    });
    return { pot, entrants: eligible.length, collected, leaders, measure };
  });

  return { measures, primary, unit: unitOf(primary), fishLimit: f.fishLimit, entries: [...scored, ...unscored], pots };
}

/** Total paid into buy-in pots (for reports) */
export const potFeesOf = (f: TournamentFormat, potIds: string[]) => round2(buyInPots(f).filter((p) => potIds.includes(p.id)).reduce((n, p) => n + p.fee, 0));
