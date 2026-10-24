'use client';

import Link from 'next/link';
import { Hourglass, ArrowLeft } from 'lucide-react';

/** Placeholder for pages linked from the main menu that aren't built yet. */
export default function ComingSoon({
  title,
  description,
  backHref,
  backLabel,
}: {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <section className="font-roboto mx-auto flex max-w-[720px] flex-col items-center px-4 py-20 text-center sm:py-28">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E6F4F5] text-[#0E7C7B]">
        <Hourglass className="h-8 w-8" strokeWidth={1.75} aria-hidden />
      </span>
      <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#14889A]">Coming soon</p>
      <h1 className="mt-2 font-montserrat text-[28px] font-bold leading-tight text-[#0D1B4C] sm:text-[34px]">{title}</h1>
      <p className="mt-4 max-w-[560px] text-[16px] leading-relaxed text-[#536B84]">{description}</p>
      <Link
        href={backHref}
        className="mt-8 inline-flex h-[42px] items-center gap-2 rounded-md border border-[#1FA3A6] bg-white px-5 text-[15px] font-medium text-[#0E7C7B] transition hover:bg-[#F1F9F9]"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden /> {backLabel}
      </Link>
    </section>
  );
}
