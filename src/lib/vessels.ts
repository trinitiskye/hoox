// Vessel types a tournament or series is fished from. Shown as tags on the
// Tournaments and Series pages and on the event page, and used by the
// "Vessel" filter. To add a type (e.g. 'Bank / Shore'), add it here.

export const VESSEL_TYPES = ['Kayak', 'Powerboat'] as const;
export type VesselType = (typeof VESSEL_TYPES)[number];

/** Keep only known vessel types, in the standard order, without duplicates */
export function cleanVessels(input: unknown): VesselType[] {
  if (!Array.isArray(input)) return [];
  const want = new Set(input.map((v) => String(v).trim().toLowerCase()));
  return VESSEL_TYPES.filter((v) => want.has(v.toLowerCase()));
}

/** Matches the Vessel filter ('all' matches everything) */
export const matchesVessel = (vessels: readonly string[] | undefined, filter: string) => filter === 'all' || !!vessels?.includes(filter);
