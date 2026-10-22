'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Trophy, CalendarDays, MapPin, ArrowRight, Users, Fish, LifeBuoy, Mail, Phone, Globe, ChevronRight,
  Navigation, ListChecks, Medal,
} from 'lucide-react';
import {
  EventDetail, formatDateRange, monthDay, mapsSearchUrl, mapsDirectionsUrl, mapsEmbedUrl, websiteHref, downloadIcs,
} from '@/lib/eventDetail';
import { BOARDS, RankBadge, Avatar } from '@/components/home/LeaderboardSection';

/* ------------------------------------------------------------------ */
/* Tournament / Event detail — matches the Event Detail mock.          */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'rules', label: 'Rules' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'species', label: 'Species' },
  { key: 'prizes', label: 'Prizes' },
  { key: 'location', label: 'Location' },
  { key: 'leaderboard', label: 'Leaderboard' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

const INK = 'text-[#0D1B4C]';
const CARD = 'rounded-lg bg-white shadow-[0_2px_10px_rgba(10,30,60,0.06)] border border-[#E8EEF4]';

function CardTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className={`flex items-center gap-3 border-b border-[#E6EDF3] pb-3 text-[16px] font-semibold ${INK}`}>
      <span className="text-[#157878]">{icon}</span>
      {children}
    </h3>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-[13px] text-[#7586A0]">{children}</p>;
}

/* ------------------------------ sections ----------------------------- */

function ScheduleCard({ e, wide = false }: { e: EventDetail; wide?: boolean }) {
  return (
    <section className={`${CARD} p-4`} aria-label="Event schedule">
      <CardTitle icon={<CalendarDays className="h-[20px] w-[20px]" strokeWidth={2} />}>Event Schedule</CardTitle>
      {e.schedule.length === 0 ? (
        <Empty>The schedule will be posted soon.</Empty>
      ) : (
        <ol className={wide ? 'grid gap-x-6 sm:grid-cols-2' : ''}>
          {e.schedule.map((s) => {
            const md = monthDay(s.date);
            return (
              <li key={s.date + s.title} className="flex items-center gap-[14px] border-b border-[#EEF2F6] py-[6px] last:border-0">
                <span className="flex h-[48px] w-[60px] flex-shrink-0 flex-col items-center justify-center rounded-md bg-[#E9F2F7]">
                  <span className="text-[10px] font-semibold leading-none tracking-wide text-[#2A6F86]">{md.month}</span>
                  <span className={`mt-[3px] text-[22px] font-bold leading-none ${INK}`}>{md.day}</span>
                </span>
                <span className="min-w-0">
                  <span className={`block text-[13px] font-medium leading-[16px] ${INK}`}>{s.title}</span>
                  {s.time && <span className="block text-[12px] leading-[16px] text-[#7586A0]">{s.time}</span>}
                  {s.place && (
                    <span className="mt-[1px] flex items-center gap-1 text-[11.5px] leading-[15px] text-[#6D85A2]">
                      <MapPin className={`h-[11px] w-[11px] ${INK}`} fill="currentColor" stroke="white" strokeWidth={1.5} />
                      {s.place}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function SpeciesCard({ e, wide = false }: { e: EventDetail; wide?: boolean }) {
  return (
    <section className={`${CARD} p-4`} aria-label="Target species">
      <CardTitle icon={/* eslint-disable-next-line @next/next/no-img-element */ <img src="/home/live-fish.png" alt="" className="h-[20px] w-[26px] object-contain" />}>Target Species</CardTitle>
      {e.species.length === 0 ? (
        <Empty>Target species will be posted soon.</Empty>
      ) : (
        <ul className={wide ? 'grid gap-x-6 sm:grid-cols-2' : ''}>
          {e.species.map((s, i) => (
            <li key={s.name} className="flex min-h-[44px] items-center gap-4 border-b border-[#EEF2F6] py-[4px] last:border-0">
              {s.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt="" className="h-[38px] w-[76px] flex-shrink-0 object-contain" />
              ) : (
                <span className="flex h-[38px] w-[76px] flex-shrink-0 items-center justify-center text-[#9DB3C6]">
                  <Fish className="h-7 w-7" strokeWidth={1.5} />
                </span>
              )}
              <span>
                <span className={`block text-[13px] ${INK} ${i === 0 ? 'font-semibold' : ''}`}>{s.name}</span>
                {s.note && <span className="block text-[11px] text-[#7586A0]">{s.note}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PrizesCard({ e }: { e: EventDetail }) {
  return (
    <section className={`${CARD} p-4`} aria-label="Prize payouts">
      <CardTitle icon={<Trophy className="h-[20px] w-[20px]" strokeWidth={2} fill="currentColor" />}>Prize Payouts</CardTitle>
      {e.payouts.length === 0 ? (
        <Empty>Prize payouts will be posted by the tournament director.</Empty>
      ) : (
        <>
          <dl>
            {e.payouts.map((p) => (
              <div key={p.place} className="flex items-center justify-between border-b border-[#EEF2F6] py-[2px] text-[12.5px] leading-[19px]">
                <dt className="text-[#2B466C]">{p.place}</dt>
                <dd className={`font-medium ${INK}`}>{p.amount}</dd>
              </div>
            ))}
          </dl>
          {e.payoutNote && <p className="mt-4 text-[11px] leading-[17px] text-[#8495AA]">{e.payoutNote}</p>}
        </>
      )}
    </section>
  );
}

function RulesCard({ e }: { e: EventDetail }) {
  return (
    <section className={`${CARD} p-4`} aria-label="Rules">
      <CardTitle icon={<ListChecks className="h-[20px] w-[20px]" strokeWidth={2} />}>Tournament Rules</CardTitle>
      {e.rules.length === 0 ? (
        <Empty>Official rules will be posted by the tournament director.</Empty>
      ) : (
        <ol className="mt-1 space-y-0">
          {e.rules.map((r, i) => (
            <li key={i} className="flex gap-3 border-b border-[#EEF2F6] py-[9px] text-[13.5px] text-[#2B466C] last:border-0">
              <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-[#E9F2F7] text-[11px] font-bold text-[#0E6E73]">{i + 1}</span>
              {r}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function LeaderboardCard({ e }: { e: EventDetail }) {
  const board = e.isDemo ? BOARDS.find((b) => b.id === 'lakefront-classic') : undefined;
  return (
    <section className={`${CARD} p-4`} aria-label="Leaderboard">
      <CardTitle icon={<Medal className="h-[20px] w-[20px]" strokeWidth={2} />}>Leaderboard</CardTitle>
      {!board ? (
        <Empty>Standings will appear here once the tournament starts.</Empty>
      ) : (
        <div role="table" aria-label={`${e.name} standings`} className="mt-1">
          <div role="row" className="grid grid-cols-[48px_minmax(0,1fr)_70px_50px_110px] border-b border-[#EDF1F5] py-2 text-[11px] font-semibold uppercase tracking-[0.02em] text-[#7A8BA3]">
            <span role="columnheader">Rank</span>
            <span role="columnheader" className="pl-[36px]">Angler</span>
            <span role="columnheader">Boat #</span>
            <span role="columnheader" className="text-center">Fish</span>
            <span role="columnheader" className="text-right">Total Weight</span>
          </div>
          {board.rows.map((row, i) => (
            <div role="row" key={row.angler} className="grid h-[38px] grid-cols-[48px_minmax(0,1fr)_70px_50px_110px] items-center border-b border-[#EEF2F6] text-[14px] last:border-0">
              <span role="cell"><RankBadge rank={i + 1} compact /></span>
              <span role="cell" className="flex min-w-0 items-center gap-3">
                <Avatar boardId={board.id} index={i} size={26} />
                <span className={`truncate ${INK}`}>{row.angler}</span>
              </span>
              <span role="cell" className="text-[13px] text-[#2A3B55]">{row.boat}</span>
              <span role="cell" className="text-center text-[13px] text-[#2A3B55]">{row.fish}</span>
              <span role="cell" className={`text-right text-[13px] font-medium ${INK}`}>{row.weight !== undefined ? `${row.weight.toFixed(2)} lb` : '-'}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MapView({ e, className }: { e: EventDetail; className: string }) {
  if (e.mapImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={e.mapImage} alt={`Map of ${e.locationName}`} className={`${className} w-full object-cover`} />;
  }
  if (!e.mapQuery) {
    return <div className={`${className} flex w-full items-center justify-center bg-[#E9F2F7] text-[13px] text-[#7586A0]`}>Location to be announced</div>;
  }
  return (
    <iframe
      title={`Map of ${e.locationName}`}
      src={mapsEmbedUrl(e.mapQuery)}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={`${className} w-full border-0`}
    />
  );
}

function LocationCard({ e, large = false }: { e: EventDetail; large?: boolean }) {
  return (
    <section className={`${CARD} p-[14px]`} aria-label="Event location">
      <div className="flex items-center justify-between">
        <h3 className={`text-[17px] font-bold ${INK}`}>Event Location</h3>
        {e.mapQuery && (
          <a href={mapsSearchUrl(e.mapQuery)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12.5px] font-semibold text-[#0B6068] hover:text-hoox-brand">
            View Larger Map <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </a>
        )}
      </div>
      <div className="mt-3 overflow-hidden rounded-md">
        <MapView e={e} className={large ? 'h-[380px]' : 'h-[170px]'} />
      </div>
      <div className="mt-[10px] flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <MapPin className={`mt-[2px] h-[22px] w-[22px] flex-shrink-0 ${INK}`} strokeWidth={2} />
          <div>
            <div className={`text-[14px] font-semibold ${INK}`}>{e.locationName}</div>
            {e.address && <div className="text-[12.5px] text-[#6586A8]">{e.address}</div>}
          </div>
        </div>
        {e.mapQuery && (
          <a
            href={mapsDirectionsUrl(e.mapQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[38px] flex-shrink-0 items-center gap-3 rounded-md border border-[#177E84] px-4 sm:px-[26px] text-[13px] font-medium text-[#076869] transition hover:bg-[#EEF9F8]"
          >
            <Navigation className="h-[17px] w-[17px]" strokeWidth={2} /> Get Directions
          </a>
        )}
      </div>
    </section>
  );
}

function RegistrationCard({ e, onRegister }: { e: EventDetail; onRegister: () => void }) {
  const reg = e.registration;
  const pct = reg.filled !== undefined && reg.total ? Math.min(100, Math.round((reg.filled / reg.total) * 100)) : undefined;
  const register = onRegister;
  return (
    <section className={`${CARD} px-5 pt-[14px] pb-[12px]`} aria-label="Registration">
      <div className="flex items-center justify-between gap-3">
        <span className={`flex items-center gap-3 text-[15px] font-semibold uppercase ${reg.open ? 'text-[#0A5E62]' : 'text-[#6B7A90]'}`}>
          <span className={`h-[10px] w-[10px] rounded-full ${reg.open ? 'bg-[#007C7C]' : 'bg-[#A5B2C2]'}`} />
          {reg.open ? 'Registration Open' : 'Registration Closed'}
        </span>
        {reg.filled !== undefined && reg.total ? (
          <span className="text-[12.5px] text-[#5C7796]">{reg.filled} of {reg.total} spots filled</span>
        ) : null}
      </div>
      {pct !== undefined && (
        <div className="mt-[11px] h-[10px] overflow-hidden rounded-full bg-[#D9E9F4]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Spots filled">
          <div className="h-full rounded-full bg-[#046B70]" style={{ width: `${pct}%` }} />
        </div>
      )}
      <button
        onClick={register}
        disabled={!reg.open}
        className="mt-[14px] flex h-[42px] w-full items-center justify-center gap-3 rounded-md bg-gradient-to-b from-[#F7C23C] to-[#F2AE24] text-[16px] font-semibold text-[#04112B] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {reg.open ? 'Register for This Event' : 'Registration Closed'} {reg.open && <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.25} />}
      </button>
      <dl className="mt-[4px] text-[13px]">
        {reg.closes && (
          <div className="flex items-center justify-between gap-3 border-b border-[#E9EEF3] py-[8px]">
            <dt className="text-[#365476]">Registration Closes</dt>
            <dd className="text-right text-[#2C446D]">{reg.closes}</dd>
          </div>
        )}
        {reg.fee && (
          <div className="flex items-start justify-between gap-3 pt-[8px]">
            <dt className="text-[#365476]">Entry Fee</dt>
            <dd className="text-right">
              <span className={`block text-[14px] font-bold ${INK}`}>{reg.fee}</span>
              {reg.feeNote && <span className="block text-[11.5px] text-[#758CA9]">{reg.feeNote}</span>}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

/* ------------------------------- page -------------------------------- */

export default function EventDetailPage({ e, onNavigate }: { e: EventDetail; onNavigate: (view: string) => void }) {
  const [tab, setTab] = useState<TabKey>('overview');
  const tabsRef = useRef<HTMLDivElement>(null);

  // Deep links: /tournaments/<id>#prizes
  useEffect(() => {
    const h = window.location.hash.replace('#', '') as TabKey;
    if (TABS.some((t) => t.key === h)) setTab(h);
  }, []);

  const choose = (k: TabKey, scroll = false) => {
    setTab(k);
    history.replaceState(null, '', k === 'overview' ? window.location.pathname : `#${k}`);
    if (scroll) tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const register = () => onNavigate('register-angler');
  const reg = e.registration;

  const stats = [
    e.prizePool && { icon: <Trophy className="h-[38px] w-[38px]" fill="currentColor" strokeWidth={1.25} />, value: e.prizePool, label: 'Total Prize Pool' },
    e.entries && { icon: <Users className="h-[38px] w-[38px]" fill="currentColor" strokeWidth={1.25} />, value: String(e.entries), label: 'Boat Entries' },
    // eslint-disable-next-line @next/next/no-img-element
    e.primarySpecies && { icon: <img src="/home/live-fish.png" alt="" className="h-[40px] w-[52px] object-contain" />, value: e.primarySpecies, label: 'Primary Species' },
    e.skillLevel && { icon: <LifeBuoy className="h-[38px] w-[38px]" strokeWidth={2} />, value: e.skillLevel, label: 'Welcome' },
  ].filter(Boolean) as { icon: React.ReactNode; value: string; label: string }[];

  return (
    <div className="font-roboto bg-hoox-mist">
      <div className="mx-auto max-w-[1440px] px-4 md:px-[22px] pt-[18px] pb-8">
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_458px]">
          {/* ============================ LEFT ============================ */}
          <div className="min-w-0 space-y-[15px]">
            {/* Hero + tabs */}
            <div className={`${CARD} overflow-hidden`}>
              <section aria-label={e.name} className="relative min-h-[345px] overflow-hidden bg-[#06263A]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={e.heroImage}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover md:left-auto md:right-0 md:w-[50%] md:[-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_22%)] md:[mask-image:linear-gradient(90deg,transparent_0%,#000_22%)]"
                />
                <div
                  className="absolute inset-0 hidden md:block"
                  style={{
                    background:
                      'radial-gradient(ellipse 45% 55% at 30% 20%, rgba(74,128,150,0.45) 0%, rgba(6,38,58,0) 70%), linear-gradient(90deg, rgba(3,26,42,0.95) 0%, rgba(8,44,66,0.75) 40%, rgba(8,44,66,0) 52%)',
                  }}
                />
                <div className="absolute inset-0 bg-[#031A2A]/75 md:hidden" />

                <div className="relative z-10 px-6 sm:px-9 pt-[22px] pb-[36px]">
                  <span className="inline-flex h-[30px] items-center gap-2.5 rounded-full border border-[#3FB3AE]/60 bg-[#04303F]/70 px-[14px] text-[12.5px] font-semibold uppercase tracking-[0.01em] text-white">
                    <Trophy className="h-4 w-4 text-[#F5B82C]" fill="currentColor" strokeWidth={1.5} /> {e.badge}
                  </span>
                  <h1 className="mt-[10px] text-[34px] sm:text-[48px] font-bold leading-[1.08] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">{e.name}</h1>

                  <div className="mt-[18px] flex flex-wrap items-center gap-x-8 gap-y-2 text-[16px] font-semibold text-white">
                    <span className="flex items-center gap-3">
                      <CalendarDays className="h-[22px] w-[22px]" strokeWidth={1.75} /> {formatDateRange(e.startDate, e.endDate)}
                    </span>
                    <span className="flex items-center gap-3">
                      <MapPin className="h-[22px] w-[22px]" strokeWidth={1.75} /> {e.locationName}
                      {e.mapQuery && (
                        <button onClick={() => choose('location', true)} className="ml-3 flex items-center gap-1.5 text-[13px] font-normal text-[#62D3D6] underline underline-offset-2 hover:text-white">
                          View on Map <ArrowRight className="h-4 w-4" strokeWidth={2} />
                        </button>
                      )}
                    </span>
                  </div>
                  <div className="mt-[13px] h-px w-full max-w-[360px] bg-white/15" />

                  <p className="mt-[14px] max-w-[400px] text-[15px] leading-[20px] text-white/95">{e.summary}</p>

                  <div className="mt-[22px] flex flex-wrap gap-3">
                    <button
                      onClick={register}
                      disabled={!reg.open}
                      className="flex h-[42px] items-center justify-center gap-4 rounded-md bg-gradient-to-b from-[#F7C23C] to-[#F2AE24] px-[30px] text-[16px] font-semibold text-[#0B1636] shadow-[0_3px_10px_rgba(0,0,0,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {reg.open ? 'Register Now' : 'Registration Closed'} {reg.open && <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.25} />}
                    </button>
                    <button
                      onClick={() => downloadIcs(e)}
                      className="flex h-[42px] items-center justify-center gap-3 rounded-md border border-white/80 px-[22px] text-[14px] font-medium text-white transition hover:bg-white/10"
                    >
                      <CalendarDays className="h-5 w-5" strokeWidth={1.75} /> Add to Calendar
                    </button>
                  </div>
                </div>
              </section>

              {/* Tabs */}
              <div ref={tabsRef} className="scroll-mt-24 overflow-x-auto px-3">
                <div role="tablist" aria-label="Event sections" className="flex h-[42px] min-w-max items-stretch gap-[18px] sm:gap-[30px]">
                  {TABS.map((t) => {
                    const active = tab === t.key;
                    return (
                      <button
                        key={t.key}
                        role="tab"
                        aria-selected={active}
                        onClick={() => choose(t.key)}
                        className={`relative px-3 text-[13.5px] transition ${active ? 'font-semibold text-[#076566]' : 'text-[#365A83] hover:text-[#076566]'}`}
                      >
                        {t.label}
                        {active && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t bg-[#0E7C7B]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* On phones/tablets the registration card follows the hero */}
            <div className="lg:hidden"><RegistrationCard e={e} onRegister={register} /></div>

            {/* Tab content */}
            {tab === 'overview' && (
              <>
                <section className={`${CARD} px-4 pt-[14px] pb-[12px]`} aria-labelledby="overview-heading">
                  <h2 id="overview-heading" className={`text-[22px] font-bold ${INK}`}>Event Overview</h2>
                  <p className="mt-1 max-w-[700px] text-[14.5px] leading-[20px] text-[#68819B]">{e.overview}</p>
                  {stats.length > 0 && (
                    <dl className="mt-[18px] grid grid-cols-1 gap-y-4 sm:grid-cols-2 md:flex md:justify-between">
                      {stats.map((s, i) => (
                        <div key={s.label} className={`flex items-center gap-[18px] px-4 md:flex-none md:pr-6 xl:pr-10 ${i > 0 ? 'md:border-l md:border-[#E0EDF5]' : ''} ${i === stats.length - 1 ? 'md:pr-4 xl:pr-6' : ''}`}>
                          <span className="flex-shrink-0 text-[#157878]">{s.icon}</span>
                          <span className="min-w-0">
                            <dd className={`text-[19px] font-bold leading-tight md:whitespace-nowrap ${INK}`}>{s.value}</dd>
                            <dt className="text-[15px] text-[#56728F]">{s.label}</dt>
                          </span>
                        </div>
                      ))}
                    </dl>
                  )}
                </section>
                <div className="grid grid-cols-1 gap-[6px] md:grid-cols-3">
                  <ScheduleCard e={e} />
                  <SpeciesCard e={e} />
                  <PrizesCard e={e} />
                </div>
              </>
            )}
            {tab === 'rules' && <RulesCard e={e} />}
            {tab === 'schedule' && <ScheduleCard e={e} wide />}
            {tab === 'species' && <SpeciesCard e={e} wide />}
            {tab === 'prizes' && <PrizesCard e={e} />}
            {tab === 'location' && <LocationCard e={e} large />}
            {tab === 'leaderboard' && <LeaderboardCard e={e} />}
          </div>

          {/* ============================ RIGHT =========================== */}
          <aside className="space-y-[11px]">
            {/* Registration */}
            <div className="hidden lg:block"><RegistrationCard e={e} onRegister={register} /></div>

            {/* Hosted by */}
            {e.host && (
              <section className={`${CARD} px-5 pt-[16px] pb-[16px]`} aria-label="Hosted by">
                <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#32547B]">Hosted by</div>
                <div className="mt-3 flex items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/home/live-fish.png" alt="" className="mt-1 h-[48px] w-[62px] flex-shrink-0 object-contain" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[15px] font-semibold ${INK}`}>{e.host.name}</span>
                      {e.host.website && (
                        <a href={websiteHref(e.host.website)} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${e.host.name}`} className={`${INK} hover:text-[#137ACC]`}>
                          <ChevronRight className="h-5 w-5" strokeWidth={2} />
                        </a>
                      )}
                    </div>
                    <ul className="mt-[10px] space-y-[6px] text-[12.5px]">
                      {e.host.email && (
                        <li className="flex items-center gap-3">
                          <Mail className={`h-[15px] w-[15px] ${INK}`} strokeWidth={1.75} />
                          <a href={`mailto:${e.host.email}`} className="truncate text-[#137ACC] hover:underline">{e.host.email}</a>
                        </li>
                      )}
                      {e.host.phone && (
                        <li className="flex items-center gap-3">
                          <Phone className={`h-[15px] w-[15px] ${INK}`} strokeWidth={1.75} />
                          <a href={`tel:${e.host.phone.replace(/[^\d+]/g, '')}`} className="text-[#137ACC] hover:underline">{e.host.phone}</a>
                        </li>
                      )}
                      {e.host.website && (
                        <li className="flex items-center gap-3">
                          <Globe className={`h-[15px] w-[15px] ${INK}`} strokeWidth={1.75} />
                          <a href={websiteHref(e.host.website)} target="_blank" rel="noopener noreferrer" className="truncate text-[#137ACC] hover:underline">{e.host.website}</a>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* Location */}
            {tab !== 'location' && <LocationCard e={e} />}

            {/* Presenting sponsor */}
            {e.sponsor && (
              <section aria-label={`Presenting sponsor: ${e.sponsor.name}`} className="relative min-h-[206px] overflow-hidden rounded-lg bg-[#032430] shadow-[0_2px_10px_rgba(10,30,60,0.12)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={e.sponsor.image}
                  alt=""
                  className="absolute inset-y-0 right-0 h-full w-[46%] object-cover [-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_30%)] [mask-image:linear-gradient(90deg,transparent_0%,#000_30%)]"
                />
                <div className="relative z-10 px-[18px] pt-[12px] pb-[18px]">
                  <span className="inline-block rounded-full bg-[#F7CF36] px-3 py-[3px] text-[10.5px] font-bold uppercase text-[#1E2126]">Presenting Sponsor</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.sponsor.logo} alt={e.sponsor.name} className="mt-[10px] w-[230px] max-w-[60%] h-auto" />
                  <p className="mt-[10px] max-w-[190px] text-[15px] font-semibold leading-[20px] text-white">{e.sponsor.tagline}</p>
                  <a
                    href={e.sponsor.url}
                    className="mt-[14px] inline-flex h-[34px] items-center gap-4 rounded-md bg-gradient-to-b from-[#F7C23C] to-[#F2AE24] px-[28px] text-[14px] font-semibold text-[#0B1636] transition hover:brightness-105"
                  >
                    Learn More <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                  </a>
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
