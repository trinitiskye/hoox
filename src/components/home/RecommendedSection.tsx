'use client';

import type { HomeBanner } from '@/types';

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
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={b.imageUrl} alt={b.title} loading="lazy" className="h-full w-full object-contain" />
  );
  const cls =
    'group block aspect-[5/2] overflow-hidden rounded-md border border-hoox-line bg-[#F7F9FB] transition hover:-translate-y-0.5 hover:border-hoox-ui hover:shadow-md';

  if (!b.linkUrl) return <div className={cls}>{img}</div>;

  const external = isExternal(b.linkUrl);
  return (
    <a
      href={b.linkUrl}
      className={cls}
      {...(b.openInNewTab ? { target: '_blank', rel: external ? 'noopener noreferrer sponsored' : 'noopener' } : external ? { rel: 'sponsored' } : {})}
    >
      {img}
      <span className="sr-only">{b.title}{b.openInNewTab ? ' (opens in a new tab)' : ''}</span>
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
