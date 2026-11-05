// Tournament format (client + server safe): how anglers enter, how catches
// are judged, and what can be won.
//
//   Entry       individual, or team (min–max anglers). Team fee per team or per angler.
//   Judging     weight, length, or both (main measure ranks; the other breaks ties).
//               Optional fish limit: only the best N approved fish count.
//   Prizes      main prizes by place (1st, 2nd …)
//               side pots: optional buy-ins with their own fee and prize pool ("Big Fish")
//               bonus awards: free awards nobody pays into ("Youth Big Fish")
//
// Stored on public.tournaments (see supabase/migration_2026_11_teams_prizes.sql).
// The first version is deliberately simple so the focus group can shape it.

export const ENTRY_TYPES = ['individual', 'team'] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];
export const FEE_BASES = ['per_entry', 'per_angler'] as const;   // per_entry = per angler (individual) or per team (team)
export type FeeBasis = (typeof FEE_BASES)[number];
export const SCORING = ['weight', 'length', 'both'] as const;
export type Scoring = (typeof SCORING)[number];
export type Measure = 'weight' | 'length';

export const POT_RULES = ['heaviest_fish', 'longest_fish', 'species_heaviest', 'species_longest', 'best_total', 'director_pick'] as const;
export type PotRule = (typeof POT_RULES)[number];
export const POT_RULE_LABEL: Record<PotRule, string> = {
  heaviest_fish: 'Heaviest single fish',
  longest_fish: 'Longest single fish',
  species_heaviest: 'Heaviest fish of a species',
  species_longest: 'Longest fish of a species',
  best_total: 'Best total (same as the main leaderboard)',
  director_pick: 'Chosen by the director',
};

export interface PlacePrize { place: number; amount: number | null; description: string }

export interface SidePot {
  id: string;
  name: string;              // "Big Fish"
  kind: 'pot' | 'award';     // pot = optional buy-in; award = free, everyone eligible
  rule: PotRule;
  species: string | null;    // for species_* rules
  fee: number;               // buy-in (0 for awards)
  payout: 'fixed' | 'share'; // fixed prize, or a share of the fees collected
  amount: number | null;     // fixed prize amount
  description: string;       // e.g. "Trophy + $250 gift card"
  splits: number[];          // share payout: % of the pot by place, e.g. [70, 30]
  winnerId: string | null;   // director_pick: the entry chosen by the director
}

export interface TournamentFormat {
  entryType: EntryType;
  teamMin: number;
  teamMax: number;
  feeBasis: FeeBasis;
  scoring: Scoring;
  primaryMeasure: Measure;
  fishLimit: number | null;
  placePrizes: PlacePrize[];
  sidePots: SidePot[];
}

export const DEFAULT_FORMAT: TournamentFormat = {
  entryType: 'individual', teamMin: 1, teamMax: 1, feeBasis: 'per_entry',
  scoring: 'weight', primaryMeasure: 'weight', fishLimit: null, placePrizes: [], sidePots: [],
};

/** Columns on public.tournaments */
export interface DbFormatColumns {
  entry_type?: string | null;
  team_min?: number | null;
  team_max?: number | null;
  fee_basis?: string | null;
  scoring?: string | null;
  primary_measure?: string | null;
  fish_limit?: number | null;
  place_prizes?: unknown;
  side_pots?: unknown;
}

export const measuresFor = (s: Scoring): Measure[] => (s === 'both' ? ['weight', 'length'] : [s]);
export const unitOf = (m: Measure) => (m === 'weight' ? 'lb' : 'in');
export const isTeam = (f: Pick<TournamentFormat, 'entryType'>) => f.entryType === 'team';

/** Read the format from a tournament row, filling in defaults for older rows */
export function formatFromRow(t: DbFormatColumns): TournamentFormat {
  const entryType: EntryType = t.entry_type === 'team' ? 'team' : 'individual';
  const scoring: Scoring = (SCORING as readonly string[]).includes(String(t.scoring)) ? (t.scoring as Scoring) : 'weight';
  const primary: Measure = scoring === 'both' ? (t.primary_measure === 'length' ? 'length' : 'weight') : scoring;
  const parsed = parseFormat({
    entryType, teamMin: t.team_min, teamMax: t.team_max, feeBasis: t.fee_basis, scoring, primaryMeasure: primary,
    fishLimit: t.fish_limit, placePrizes: t.place_prizes ?? [], sidePots: t.side_pots ?? [],
  });
  return parsed.value ?? { ...DEFAULT_FORMAT, entryType, scoring, primaryMeasure: primary };
}

export function formatToRow(f: TournamentFormat): DbFormatColumns {
  return {
    entry_type: f.entryType, team_min: f.teamMin, team_max: f.teamMax, fee_basis: f.feeBasis,
    scoring: f.scoring, primary_measure: f.primaryMeasure, fish_limit: f.fishLimit,
    place_prizes: f.placePrizes, side_pots: f.sidePots,
  };
}

/* -------------------------------- validation ------------------------------ */

const slug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
const money = (v: unknown) => (v === '' || v === null || v === undefined ? null : Math.round(Number(v) * 100) / 100);

/** Validate a full format (or merge `input` over `base`). Returns cleaned values or an error. */
export function parseFormat(input: Record<string, unknown>, base: TournamentFormat = DEFAULT_FORMAT): { value: TournamentFormat | null; error: string | null } {
  const fail = (error: string) => ({ value: null, error });
  const get = <K extends keyof TournamentFormat>(k: K) => (k in input && input[k] !== undefined ? input[k] : base[k]) as unknown;

  const entryType = get('entryType') === 'team' ? 'team' : 'individual';
  let teamMin = Number(get('teamMin') ?? 1), teamMax = Number(get('teamMax') ?? 1);
  if (entryType === 'individual') { teamMin = 1; teamMax = 1; }
  else {
    if (!Number.isInteger(teamMin) || teamMin < 1 || teamMin > 20) return fail('Team size (minimum) must be 1–20 anglers.');
    if (!Number.isInteger(teamMax) || teamMax < teamMin || teamMax > 20) return fail('Team size (maximum) must be at least the minimum, up to 20.');
  }
  const feeBasis: FeeBasis = entryType === 'team' && get('feeBasis') === 'per_angler' ? 'per_angler' : 'per_entry';

  const scoringRaw = String(get('scoring'));
  if (!(SCORING as readonly string[]).includes(scoringRaw)) return fail('Choose how catches are judged: weight, length, or both.');
  const scoring = scoringRaw as Scoring;
  const primaryMeasure: Measure = scoring === 'both' ? (get('primaryMeasure') === 'length' ? 'length' : 'weight') : scoring;

  const fl = get('fishLimit');
  const fishLimit = fl === null || fl === '' || fl === undefined || Number(fl) === 0 ? null : Number(fl);
  if (fishLimit !== null && (!Number.isInteger(fishLimit) || fishLimit < 1 || fishLimit > 100)) return fail('Fish limit must be a whole number (or blank for no limit).');

  const pp = get('placePrizes');
  if (!Array.isArray(pp)) return fail('Place prizes must be a list.');
  const placePrizes: PlacePrize[] = [];
  for (const [i, raw] of pp.slice(0, 50).entries()) {
    const r = (raw || {}) as Record<string, unknown>;
    const amount = money(r.amount);
    if (amount !== null && (!Number.isFinite(amount) || amount < 0 || amount > 10_000_000)) return fail(`Place ${i + 1}: enter a valid prize amount.`);
    const description = typeof r.description === 'string' ? r.description.trim().slice(0, 160) : '';
    if (amount === null && !description) return fail(`Place ${i + 1}: enter an amount or a description.`);
    placePrizes.push({ place: i + 1, amount, description });
  }

  const sp = get('sidePots');
  if (!Array.isArray(sp)) return fail('Side pots must be a list.');
  const sidePots: SidePot[] = [];
  const ids = new Set<string>();
  for (const raw of sp.slice(0, 30)) {
    const r = (raw || {}) as Record<string, unknown>;
    const name = typeof r.name === 'string' ? r.name.trim().slice(0, 80) : '';
    if (!name) return fail('Every side pot or award needs a name.');
    const kind = r.kind === 'award' ? 'award' : 'pot';
    const rule = String(r.rule) as PotRule;
    if (!(POT_RULES as readonly string[]).includes(rule)) return fail(`${name}: choose how the winner is decided.`);
    const species = typeof r.species === 'string' && r.species.trim() ? r.species.trim().slice(0, 80) : null;
    if ((rule === 'species_heaviest' || rule === 'species_longest') && !species) return fail(`${name}: choose the species.`);
    if ((rule === 'heaviest_fish' || rule === 'species_heaviest') && !measuresFor(scoring).includes('weight')) return fail(`${name}: this tournament doesn’t weigh fish.`);
    if ((rule === 'longest_fish' || rule === 'species_longest') && !measuresFor(scoring).includes('length')) return fail(`${name}: this tournament doesn’t measure length.`);
    const fee = kind === 'award' ? 0 : money(r.fee) ?? 0;
    if (!Number.isFinite(fee) || fee < 0 || fee > 100_000) return fail(`${name}: enter a valid entry fee.`);
    const payout = r.payout === 'share' && kind === 'pot' ? 'share' : 'fixed';
    const amount = money(r.amount);
    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) return fail(`${name}: enter a valid prize amount.`);
    let splits = Array.isArray(r.splits) ? (r.splits as unknown[]).map(Number).filter((n) => Number.isFinite(n) && n > 0).slice(0, 10) : [];
    if (payout === 'share') {
      if (splits.length === 0) splits = [100];
      const total = splits.reduce((a, b) => a + b, 0);
      if (Math.abs(total - 100) > 0.01) return fail(`${name}: payout shares must add up to 100%.`);
    } else splits = [];
    const description = typeof r.description === 'string' ? r.description.trim().slice(0, 200) : '';
    if (payout === 'fixed' && amount === null && !description) return fail(`${name}: enter a prize amount or description.`);
    let id = slug(typeof r.id === 'string' && r.id ? r.id : name) || `pot_${sidePots.length + 1}`;
    while (ids.has(id)) id = `${id}_2`;
    ids.add(id);
    sidePots.push({ id, name, kind, rule, species, fee: kind === 'award' ? 0 : fee, payout, amount, description, splits, winnerId: typeof r.winnerId === 'string' && r.winnerId ? r.winnerId : null });
  }

  return { value: { entryType, teamMin, teamMax, feeBasis, scoring, primaryMeasure, fishLimit, placePrizes, sidePots }, error: null };
}

/** Pots an entrant can buy into (awards are automatic) */
export const buyInPots = (f: TournamentFormat) => f.sidePots.filter((p) => p.kind === 'pot');

/** Cost of an entry: main fee (× anglers when per angler) + chosen side pots */
export function entryCost(f: TournamentFormat, mainFee: number, anglers: number, potIds: string[]) {
  const main = f.feeBasis === 'per_angler' ? mainFee * Math.max(1, anglers) : mainFee;
  const pots = buyInPots(f).filter((p) => potIds.includes(p.id)).reduce((n, p) => n + p.fee, 0);
  return { main: Math.round(main * 100) / 100, pots: Math.round(pots * 100) / 100 };
}
