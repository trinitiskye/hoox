'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { HeroSlide } from '@/types';

const AUTOPLAY_MS = 6000;

interface HeroCarouselProps {
  /** null while loading; [] when there are no active slides */
  slides: HeroSlide[] | null;
  /** Shown when there are no slides (e.g. before any are added in Admin) */
  fallback: React.ReactNode;
}

const BUTTON_POSITION: Record<HeroSlide['buttonPosition'], string> = {
  'bottom-left': 'left-5 sm:left-8 items-start',
  'bottom-center': 'left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'right-5 sm:right-8 items-end',
};

function isExternal(url: string) {
  return /^https?:\/\//i.test(url);
}

export default function HeroCarousel({ slides, fallback }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchX = useRef<number | null>(null);

  const count = slides?.length ?? 0;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  // Respect reduced-motion: no autoplay, no fade
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Keep index valid if the slide list changes
  useEffect(() => {
    if (index >= count && count > 0) setIndex(0);
  }, [count, index]);

  // Autoplay
  useEffect(() => {
    if (count < 2 || paused || reducedMotion) return;
    const t = window.setTimeout(() => {
      if (document.visibilityState === 'visible') go(index + 1);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [count, paused, reducedMotion, index, go]);

  // Loading: hold the space so the layout doesn't jump
  if (slides === null) {
    return (
      <div
        aria-hidden
        className="relative overflow-hidden rounded-lg bg-hoox-deep aspect-[1900/964] lg:aspect-auto lg:min-h-[482px] shadow-[0_2px_10px_rgba(10,30,60,0.12)] animate-pulse"
      />
    );
  }

  if (count === 0) return <>{fallback}</>;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured sponsors"
      className="group/hero relative overflow-hidden rounded-lg bg-hoox-deep aspect-[1900/964] lg:aspect-auto lg:h-full lg:min-h-[482px] shadow-[0_2px_10px_rgba(10,30,60,0.12)] focus:outline-none"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(index - 1);
        if (e.key === 'ArrowRight') go(index + 1);
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      {slides.map((s, i) => {
        const active = i === index;
        const external = s.buttonUrl ? isExternal(s.buttonUrl) : false;
        return (
          <div
            key={s.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${s.title}`}
            aria-hidden={!active}
            className={`absolute inset-0 ${reducedMotion ? '' : 'transition-opacity duration-700 ease-out'} ${
              active ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={s.imageUrl}
              alt={s.title}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {s.buttonLabel && s.buttonUrl && (
              <div className={`absolute bottom-9 sm:bottom-11 flex flex-col ${BUTTON_POSITION[s.buttonPosition]}`}>
                <a
                  href={s.buttonUrl}
                  tabIndex={active ? 0 : -1}
                  {...(s.openInNewTab ? { target: '_blank', rel: external ? 'noopener noreferrer sponsored' : 'noopener' } : {})}
                  className="inline-flex items-center gap-3 sm:gap-6 rounded-md bg-gradient-to-b from-[#F7AE2C] to-[#EE9A1A] px-4 sm:px-[30px] h-9 sm:h-[44px] text-[15px] sm:text-[19px] font-semibold text-[#11173A] shadow-[0_3px_10px_rgba(0,0,0,0.25)] hover:brightness-105 transition whitespace-nowrap"
                >
                  {s.buttonLabel}
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.25} />
                  {s.openInNewTab && <span className="sr-only">(opens in a new tab)</span>}
                </a>
              </div>
            )}
          </div>
        );
      })}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-[2] -translate-y-1/2 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 sm:opacity-0 sm:group-hover/hero:opacity-100 sm:group-focus-within/hero:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-[2] -translate-y-1/2 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 sm:opacity-0 sm:group-hover/hero:opacity-100 sm:group-focus-within/hero:opacity-100"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <div className="absolute bottom-3 left-1/2 z-[2] flex -translate-x-1/2 items-center gap-2" role="tablist" aria-label="Choose slide">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Go to slide ${i + 1}: ${s.title}`}
                onClick={() => go(i)}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
