// Shared validation for hero slide writes (used by the admin API routes).
import type { DbHeroSlideInsert } from './supabase';

const POSITIONS = ['bottom-left', 'bottom-center', 'bottom-right'] as const;

function isHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Button links may be absolute http(s) URLs or site-relative paths like /tournaments. */
function isLinkUrl(value: string) {
  return (value.startsWith('/') && !value.startsWith('//')) || isHttpUrl(value);
}

/**
 * Validates and normalizes a create (partial=false) or update (partial=true)
 * payload. Only whitelisted fields are copied through.
 */
export function parseHeroSlideInput(
  body: Record<string, unknown>,
  partial: boolean
): { value: Partial<DbHeroSlideInsert>; error: string | null } {
  const out: Partial<DbHeroSlideInsert> = {};
  const str = (k: string) => (typeof body[k] === 'string' ? (body[k] as string).trim() : undefined);

  if (!partial || 'title' in body) {
    const title = str('title');
    if (!title) return { value: out, error: 'Title is required.' };
    if (title.length > 120) return { value: out, error: 'Title must be 120 characters or fewer.' };
    out.title = title;
  }

  if (!partial || 'imageUrl' in body) {
    const imageUrl = str('imageUrl');
    if (!imageUrl || !isHttpUrl(imageUrl)) return { value: out, error: 'A valid image URL is required.' };
    out.image_url = imageUrl;
  }

  if (!partial || 'buttonLabel' in body || 'buttonUrl' in body) {
    const label = str('buttonLabel') || '';
    const url = str('buttonUrl') || '';
    if ((label && !url) || (!label && url)) {
      return { value: out, error: 'Add both a button label and a button link, or leave both empty.' };
    }
    if (url && !isLinkUrl(url)) {
      return { value: out, error: 'Button link must start with https://, http://, or / for a page on this site.' };
    }
    if (label.length > 40) return { value: out, error: 'Button label must be 40 characters or fewer.' };
    out.button_label = label || null;
    out.button_url = url || null;
  }

  if ('openInNewTab' in body) out.open_in_new_tab = body.openInNewTab === true;
  else if (!partial) out.open_in_new_tab = true;

  if ('buttonPosition' in body) {
    const pos = body.buttonPosition as (typeof POSITIONS)[number];
    if (!POSITIONS.includes(pos)) return { value: out, error: 'Unknown button position.' };
    out.button_position = pos;
  } else if (!partial) out.button_position = 'bottom-left';

  if ('isActive' in body) out.is_active = body.isActive === true;
  else if (!partial) out.is_active = true;

  if ('sortOrder' in body) {
    const n = Number(body.sortOrder);
    if (!Number.isInteger(n)) return { value: out, error: 'Sort order must be a whole number.' };
    out.sort_order = n;
  }

  return { value: out, error: null };
}
