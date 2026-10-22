'use client';

import { ArrowRight } from 'lucide-react';
import type { HomeBanner } from '@/types';

interface RecommendedSectionProps {
  /** null while loading; [] hides the section */
  banners: HomeBanner[] | null;
  onNavigate: (view: string) => void;
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

export default function RecommendedSection({ banners, onNavigate }: RecommendedSectionProps) {
  if (banners !== null && banners.length === 0) return null;

  return (
    <section aria-labelledby="recommended-heading" className="rounded-lg bg-white px-3 sm:px-[12px] pt-[12px] pb-[12px] shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
      {/* Heading — same type as Upcoming Tournaments */}
      <div className="flex flex-wrap items-end justify-between gap-2 px-2 pb-[13px]">
        <div>
          <h2 id="recommended-heading" className="text-[28px] font-bold leading-tight text-hoox-ink">We recommend</h2>
          <p className="text-[16px] font-light text-[#869FE6]">Gear and services from our sponsors.</p>
        </div>
        <button
          onClick={() => onNavigate('sponsor')}
          className="mb-4 flex items-center gap-2 text-[17px] font-medium text-[#016F8C] hover:text-hoox-brand transition"
        >
          Advertise with HOOX <ArrowRight className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

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
