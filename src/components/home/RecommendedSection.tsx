'use client';

import type { HomeBanner } from '@/types';
import { BANNER_PLACEHOLDER_IMAGE } from '@/lib/supabase';

interface RecommendedSectionProps {
  /** null while loading; [] hides the section */
  banners: HomeBanner[] | null;
  /** Kept for compatibility; the section no longer has a header link. */
  onNavigate?: (view: string) => void;
}

function isExternal(url: string) {
  return /^https?:\/\//i.test(url);
}

function BannerTile({ b }: { b: HomeBanner }) {
  const src = b.imageUrl || BANNER_PLACEHOLDER_IMAGE;
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={b.title}
      loading="lazy"
      className="h-full w-full object-contain"
      onError={(ev) => {
        // Broken or missing artwork falls back to the "Advertise with us!" placeholder
        const el = ev.currentTarget;
        if (!el.src.endsWith(BANNER_PLACEHOLDER_IMAGE)) el.src = BANNER_PLACEHOLDER_IMAGE;
      }}
    />
  );
  const cls =
    'group block aspect-[5/2] overflow-hidden rounded-md border border-hoox-line bg-[#F7F9FB] transition hover:-translate-y-0.5 hover:border-hoox-ui hover:shadow-md';

  if (!b.linkUrl) return <div className={cls}>{img}</div>;

  // Every banner opens in a new browser tab/window.
  return (
    <a
      href={b.linkUrl}
      target="_blank"
      rel={isExternal(b.linkUrl) ? 'noopener noreferrer sponsored' : 'noopener'}
      className={cls}
    >
      {img}
      <span className="sr-only">{b.title} (opens in a new tab)</span>
    </a>
  );
}

/** The section is a single row; only the first six active banners are shown. */
export const MAX_HOME_BANNERS = 6;

export default function RecommendedSection({ banners }: RecommendedSectionProps) {
  if (banners !== null && banners.length === 0) return null;
  const shown = banners ? banners.slice(0, MAX_HOME_BANNERS) : null;

  return (
    <section aria-label="Sponsored: We recommend" className="rounded-lg bg-white px-3 sm:px-[12px] pt-[12px] pb-[12px] shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
      {/* One row: six across on desktop; on smaller screens the same row scrolls sideways */}
      <div className="relative -mx-3 flex snap-x snap-mandatory gap-[13px] overflow-x-auto px-3 pb-1 sm:-mx-[12px] sm:px-[12px] xl:mx-0 xl:grid xl:grid-cols-6 xl:overflow-visible xl:px-0 xl:pb-0 [scrollbar-width:thin]">
        {shown === null
          ? Array.from({ length: MAX_HOME_BANNERS }).map((_, i) => (
              <div key={i} aria-hidden className="aspect-[5/2] w-[46%] flex-shrink-0 snap-start animate-pulse rounded-md bg-[#EEF2F6] sm:w-[31%] xl:w-auto" />
            ))
          : shown.map((b) => (
              <div key={b.id} className="w-[46%] flex-shrink-0 snap-start sm:w-[31%] xl:w-auto">
                <BannerTile b={b} />
              </div>
            ))}
      </div>
    </section>
  );
}
