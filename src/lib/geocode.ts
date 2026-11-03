// SERVER-ONLY: turn "City, State, Country" into map coordinates.
// Uses OpenStreetMap's free Nominatim service (no API key). Their usage
// policy asks for an identifying User-Agent and light, cached use, which
// fits here: we only look up a club once, when it's approved, and save it.

import { getStatesForCountry } from './addressData';

const UA = 'HOOX/1.0 (+https://hoox.app)';
const ENDPOINT = process.env.GEOCODE_URL || 'https://nominatim.openstreetmap.org/search';

export async function geocodePlace(city: string, state: string, country: string): Promise<{ lat: number; lng: number } | null> {
  const stateName = getStatesForCountry(country).find((s) => s.code === state)?.name || state;
  const attempts = [
    new URLSearchParams({ format: 'json', limit: '1', city, state: stateName, countrycodes: country.toLowerCase() }),
    new URLSearchParams({ format: 'json', limit: '1', q: [city, stateName, country].filter(Boolean).join(', ') }),
  ];
  for (const params of attempts) {
    try {
      const res = await fetch(`${ENDPOINT}?${params}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;
      const rows = (await res.json()) as { lat?: string; lon?: string }[];
      const lat = Number(rows?.[0]?.lat);
      const lng = Number(rows?.[0]?.lon);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    } catch {
      /* try the next form */
    }
  }
  return null;
}
