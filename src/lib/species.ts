// Fish species master list — shared types and validation.
// Managed in Admin → Tournaments → Fish Species; stored in public.fish_species.

export const SPECIES_CATEGORIES = ['freshwater', 'saltwater', 'both'] as const;
export type SpeciesCategory = (typeof SPECIES_CATEGORIES)[number];
export const CATEGORY_LABEL: Record<SpeciesCategory, string> = {
  freshwater: 'Freshwater',
  saltwater: 'Saltwater',
  both: 'Fresh & salt',
};

export interface DbFishSpecies {
  id: string;
  name: string;
  category: SpeciesCategory;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const SPECIES_NAME_MAX = 60;

/** Trim, collapse spaces, and validate a species name. */
export function cleanSpeciesName(raw: unknown): { name: string | null; error: string | null } {
  const name = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim() : '';
  if (!name) return { name: null, error: 'Enter a species name.' };
  if (name.length > SPECIES_NAME_MAX) return { name: null, error: `Keep names under ${SPECIES_NAME_MAX} characters.` };
  if (!/^[\p{L}\p{N} .,'’()&/-]+$/u.test(name)) return { name: null, error: 'Use letters, numbers, spaces and basic punctuation only.' };
  return { name, error: null };
}

export const sortSpecies = <T extends { name: string }>(list: T[]) =>
  [...list].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
