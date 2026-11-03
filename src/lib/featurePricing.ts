// SERVER-ONLY: load and save the admin-editable "Feature your Club" pricing.
// Falls back to DEFAULT_FEATURE_PRICING when nothing is saved yet, or when
// the site_settings table doesn't exist (migration not run).

import { getSettingAdmin, upsertSettingAdmin } from './supabaseAdmin';
import { DEFAULT_FEATURE_PRICING, parseFeaturePricing, type FeaturePricing } from './clubFeature';

export const PRICING_KEY = 'club_feature_pricing';

export async function loadFeaturePricing(): Promise<{ pricing: FeaturePricing; saved: boolean; updatedAt: string | null }> {
  const { data, error } = await getSettingAdmin(PRICING_KEY).catch(() => ({ data: null, error: 'unavailable' }));
  const row = !error ? data?.[0] : undefined;
  if (row) {
    const { value } = parseFeaturePricing(row.value);
    if (value) return { pricing: value, saved: true, updatedAt: row.updated_at };
  }
  return { pricing: DEFAULT_FEATURE_PRICING, saved: false, updatedAt: null };
}

export async function saveFeaturePricing(pricing: FeaturePricing, userId: string) {
  return upsertSettingAdmin(PRICING_KEY, pricing, userId);
}
