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

export default function RecommendedSection({ banners }: RecommendedSectionProps) {
  if (banners !== null && banners.length === 0) return null;

  return (
    <section aria-label="Sponsored: We recommend" className="rounded-lg bg-white px-3 sm:px-[12px] pt-[12px] pb-[12px] shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-[13px]">
        {banners === null
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} aria-hidden className="aspect-[5/2] animate-pulse rounded-md bg-[#EEF2F6]" />
            ))
          : banners.map((b) => <BannerTile key={b.id} b={b} />)}
      </div>
    </section>
  );
}
