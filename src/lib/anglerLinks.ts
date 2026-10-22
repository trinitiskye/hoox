// Shared helpers for angler profile URLs (kept separate to avoid import cycles).

export function anglerSlug(name: string) {
  return name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function anglerHref(name: string) {
  return `/anglers/${anglerSlug(name)}`;
}
