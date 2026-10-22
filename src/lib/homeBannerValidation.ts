// Shared validation for "We recommend" banner writes (admin API routes).
import type { DbHomeBannerInsert } from './supabase';

function isHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Links may be absolute http(s) URLs or site-relative paths like /partner. */
function isLinkUrl(value: string) {
  return (value.startsWith('/') && !value.startsWith('//')) || isHttpUrl(value);
}

export function parseHomeBannerInput(
  body: Record<string, unknown>,
  partial: boolean
): { value: Partial<DbHomeBannerInsert>; error: string | null } {
  const out: Partial<DbHomeBannerInsert> = {};
  const str = (k: string) => (typeof body[k] === 'string' ? (body[k] as string).trim() : undefined);

  if (!partial || 'title' in body) {
    const title = str('title');
    if (!title) return { value: out, error: 'Advertiser name is required.' };
    if (title.length > 120) return { value: out, error: 'Advertiser name must be 120 characters or fewer.' };
    out.title = title;
  }

  if (!partial || 'imageUrl' in body) {
    const imageUrl = str('imageUrl');
    if (!imageUrl || !isHttpUrl(imageUrl)) return { value: out, error: 'A valid image URL is required.' };
    out.image_url = imageUrl;
  }

  if (!partial || 'linkUrl' in body) {
    const link = str('linkUrl') || '';
    if (link && !isLinkUrl(link)) {
      return { value: out, error: 'Link must start with https://, http://, or / for a page on this site.' };
    }
    out.link_url = link || null;
  }

  if ('openInNewTab' in body) out.open_in_new_tab = body.openInNewTab === true;
  else if (!partial) out.open_in_new_tab = true;

  if ('isActive' in body) out.is_active = body.isActive === true;
  else if (!partial) out.is_active = true;

  if ('sortOrder' in body) {
    const n = Number(body.sortOrder);
    if (!Number.isInteger(n)) return { value: out, error: 'Sort order must be a whole number.' };
    out.sort_order = n;
  }

  return { value: out, error: null };
}
