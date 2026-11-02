'use client';

/* ------------------------------------------------------------------ */
/* /events/<id> — Fishing expo / trade show detail page               */
/* ------------------------------------------------------------------ */

import Link from 'next/link';
import {
  ArrowLeft, CalendarDays, MapPin, Ticket, Clock, Navigation, CheckCircle2, Store, ExternalLink, ArrowRight, Building2,
} from 'lucide-react';
import { INK, StatusChip, statusFor, fmtRange, day } from '@/components/listing/ListingUI';
import { EXPOS, expoById, admissionFrom, money, directionsUrl } from '@/lib/demoExpos';

const CARD = 'rounded-lg border border-[#E8EEF4] bg-white shadow-[0_2px_10px_rgba(10,30,60,0.06)]';
const weekday = (iso: string) => day(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export default function ExpoDetailPage({ id }: { id: string }) {
  const e = expoById(id);

  if (!e) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-20 text-center font-roboto">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F4F5] text-[#0E7C7B]">
          <Store className="h-7 w-7" strokeWidth={1.75} aria-hidden />
        </span>
        <h1 className={`mt-4 font-montserrat text-[28px] font-bold ${INK}`}>Event not found</h1>
        <p className="mt-2 text-[16px] text-[#536B84]">This show may have ended or moved. Browse upcoming expos and trade shows instead.</p>
        <Link href="/events" className="mt-6 inline-flex h-[44px] items-center gap-2 rounded-md bg-[#0E7C7B] px-6 text-[15px] font-semibold text-white hover:bg-[#0B6766]">
          View all shows <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const status = statusFor(e.start, e.end, new Date());
  const more = EXPOS.filter((x) => x.id !== e.id && statusFor(x.start, x.end, new Date()) !== 'Completed').slice(0, 3);

  return (
    <div className="font-roboto">
      <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-6 sm:px-6 lg:px-[42px] lg:pt-[28px]">
        <Link href="/events" className="inline-flex items-center gap-1.5 text-[15px] font-medium text-[#0E7C7B] hover:underline">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} /> All expos &amp; trade shows
        </Link>

        {/* Hero */}
        <section className="relative mt-4 overflow-hidden rounded-lg bg-[#0A2A47] shadow-[0_6px_20px_rgba(5,30,60,0.18)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={e.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-35 md:left-auto md:right-0 md:w-[60%] md:opacity-100 md:[-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_40%)] md:[mask-image:linear-gradient(90deg,transparent_0%,#000_40%)]"
          />
          <div className="relative z-10 px-6 py-8 sm:px-10 md:min-h-[340px] md:max-w-[680px] md:py-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#1E4F63] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.04em] text-[#3FD6D0]">{e.type}</span>
              <StatusChip status={status} />
            </div>
            <h1 className="mt-4 max-w-[680px] font-montserrat text-[30px] font-bold leading-tight text-white sm:text-[42px]">{e.name}</h1>
            <p className="mt-1 text-[17px] font-medium text-[#3FD6D0]">Hosted by {e.organizer}</p>
            <div className="mt-6 flex flex-col gap-3 text-[16px] text-white sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2">
              <span className="flex items-center gap-2.5"><CalendarDays className="h-5 w-5" strokeWidth={1.75} />{fmtRange(e.start, e.end)}</span>
              <span className="flex items-center gap-2.5"><MapPin className="h-5 w-5" strokeWidth={1.75} />{e.venue} · {e.city}, {e.state}</span>
              <span className="flex items-center gap-2.5"><Ticket className="h-5 w-5" strokeWidth={1.75} />{admissionFrom(e)}</span>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {e.website && (
                <a
                  href={e.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-[48px] items-center justify-center gap-3 rounded-md bg-[#22B3B5] px-7 text-[16px] font-semibold text-white shadow-[0_4px_12px_rgba(34,179,181,0.35)] transition hover:bg-[#1C9C9E]"
                >
                  Get tickets <ExternalLink className="h-4 w-4" strokeWidth={2} />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              )}
              <a
                href={directionsUrl(e)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[48px] items-center justify-center gap-2.5 rounded-md border border-white/70 px-7 text-[16px] font-medium text-white transition hover:bg-white/10"
              >
                <Navigation className="h-4 w-4" strokeWidth={2} /> Get directions
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Main column */}
          <div className="space-y-6">
            <section className={`${CARD} p-6 sm:p-8`}>
              <h2 className={`font-montserrat text-[22px] font-bold ${INK}`}>About this show</h2>
              <p className="mt-3 text-[16px] leading-[26px] text-[#2E3F5C]">{e.about}</p>
              {e.highlights.length > 0 && (
                <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {e.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2.5 text-[15px] leading-[22px] text-[#2E3F5C]">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0E7C7B]" strokeWidth={1.75} />
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={`${CARD} p-6 sm:p-8`}>
              <h2 className={`font-montserrat text-[22px] font-bold ${INK}`}>Show hours</h2>
              <ul className="mt-4 divide-y divide-[#EEF3F8]">
                {e.schedule.map((s) => (
                  <li key={s.date} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className={`flex items-center gap-2.5 text-[16px] font-semibold ${INK}`}>
                      <CalendarDays className="h-5 w-5 text-[#5F7896]" strokeWidth={1.75} />{weekday(s.date)}
                    </span>
                    <span className="flex items-center gap-2 pl-[30px] text-[15px] text-[#2E3F5C] sm:pl-0">
                      <Clock className="h-4 w-4 text-[#5F7896]" strokeWidth={1.75} />{s.open} – {s.close}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <section className={`${CARD} p-6`}>
              <h2 className={`font-montserrat text-[20px] font-bold ${INK}`}>Admission</h2>
              <ul className="mt-3 divide-y divide-[#EEF3F8]">
                {e.pricing.map((p) => (
                  <li key={p.label} className="flex items-center justify-between py-2.5 text-[15px]">
                    <span className="text-[#2E3F5C]">{p.label}</span>
                    <span className={`font-semibold ${p.price === 0 ? 'text-[#11764A]' : INK}`}>{money(p.price)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[13px] leading-[19px] text-[#5F7896]">Tickets are sold by the show organizer. Prices may change; check with the organizer before you go.</p>
            </section>

            <section className={`${CARD} p-6`}>
              <h2 className={`font-montserrat text-[20px] font-bold ${INK}`}>Location</h2>
              <p className={`mt-3 flex items-start gap-2.5 text-[16px] font-semibold ${INK}`}>
                <Building2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#5F7896]" strokeWidth={1.75} />{e.venue}
              </p>
              <p className="mt-1 pl-[30px] text-[15px] leading-[22px] text-[#2E3F5C]">
                {e.address}<br />{e.city}, {e.state}
              </p>
              <a
                href={directionsUrl(e)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex h-[42px] items-center justify-center gap-2 rounded-md border border-[#1FA3A6] text-[15px] font-semibold text-[#0E7C7B] transition hover:bg-[#EEF9F8]"
              >
                <Navigation className="h-4 w-4" strokeWidth={2} /> Get directions
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </section>

            {e.exhibitors && (
              <section className={`${CARD} flex items-center gap-4 p-6`}>
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#E6F4F5] text-[#0E7C7B]">
                  <Store className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                </span>
                <p className="text-[15px] leading-[21px] text-[#2E3F5C]">
                  <span className={`block font-montserrat text-[22px] font-bold ${INK}`}>{e.exhibitors}+</span>
                  exhibitors expected
                </p>
              </section>
            )}
          </aside>
        </div>

        {/* More shows */}
        {more.length > 0 && (
          <section className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <h2 className={`font-montserrat text-[24px] font-bold ${INK}`}>More shows</h2>
              <Link href="/events" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#0E7C7B] hover:underline">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-[26px] sm:grid-cols-2 lg:grid-cols-3">
              {more.map((x) => (
                <li key={x.id}>
                  <Link href={`/events/${x.id}`} className={`group flex h-full flex-col p-[7px] ${CARD} transition hover:shadow-[0_6px_18px_rgba(10,30,60,0.12)]`}>
                    <div className="aspect-[2.2/1] overflow-hidden rounded-md bg-[#E9F2F7]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={x.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    </div>
                    <div className="px-3 pb-3 pt-3.5">
                      <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#0E7C7B]">{x.type}</p>
                      <h3 className={`mt-1 font-montserrat text-[18px] font-bold leading-tight ${INK}`}>{x.name}</h3>
                      <p className="mt-2 flex items-center gap-2 text-[14px] text-[#2E3F5C]">
                        <CalendarDays className="h-4 w-4 text-[#5F7896]" strokeWidth={1.75} />{fmtRange(x.start, x.end)}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-[14px] text-[#5F7896]">
                        <MapPin className="h-4 w-4" strokeWidth={1.75} />{x.city}, {x.state}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
