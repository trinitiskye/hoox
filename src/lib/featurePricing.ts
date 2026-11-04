// SERVER-ONLY: load and save admin-editable featured pricing per listing type.
// Key 'featured_pricing_<type>' in public.site_settings. Clubs fall back to the
// original 'club_feature_pricing' (single product → Featured listing) so
// prices saved before page-hero pricing existed carry over.

import { getSettingAdmin, upsertSettingAdmin } from './supabaseAdmin';
import { DEFAULT_TYPE_PRICING, parseTypePricing, type ListingType, type TypePricing } from './featured';

export const LEGACY_CLUB_KEY = 'club_feature_pricing';
export const pricingKey = (type: ListingType) => `featured_pricing_${type}`;

async function readSetting(key: string) {
  const { data, error } = await getSettingAdmin(key).catch(() => ({ data: null, error: 'unavailable' }));
  return !error ? data?.[0] ?? null : null;
}

export async function loadTypePricing(type: ListingType): Promise<{ pricing: TypePricing; saved: boolean; updatedAt: string | null }> {
  const row = (await readSetting(pricingKey(type))) ?? (type === 'club' ? await readSetting(LEGACY_CLUB_KEY) : null);
  if (row) {
    const { value } = parseTypePricing(row.value, type);
    if (value) return { pricing: value, saved: true, updatedAt: row.updated_at };
  }
  return { pricing: DEFAULT_TYPE_PRICING[type], saved: false, updatedAt: null };
}

export async function saveTypePricing(type: ListingType, pricing: TypePricing, userId: string) {
  return upsertSettingAdmin(pricingKey(type), pricing, userId);
}
