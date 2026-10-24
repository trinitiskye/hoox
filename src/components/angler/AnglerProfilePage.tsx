'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Trophy, MapPin, UserPlus, UserCheck, ChevronRight, ArrowRight, Weight, Medal, BarChart3, User,
  Facebook, Instagram, Youtube, Link2, Star, Flag, Clock, CalendarCheck, Image as ImageIcon,
} from 'lucide-react';
import type { AnglerProfile, AnglerSponsor } from '@/lib/anglerProfile';

/* ------------------------------------------------------------------ */
/* Public angler profile — matches the Angler Profile mock.            */
/* ------------------------------------------------------------------ */

const INK = 'text-[#0D1B4C]';
const CARD = 'rounded-lg bg-white shadow-[0_2px_10px_rgba(10,30,60,0.06)] border border-[#E8EEF4]';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime()) ? iso : `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function fmtWeight(w: number) {
  return `${w.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lb`;
}

const TABS = [
  { key: 'results', label: 'Tournament Results' },
  { key: 'activity', label: 'Recent Activity' },
  { key: 'photos', label: 'Photos' },
  { key: 'sponsors', label: 'Sponsors' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

/* ------------------------------- pieces ------------------------------- */

function FishIcon({ className }: { className: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/home/live-fish.png" alt="" className={`${className} object-contain`} />;
}

function UsFlag() {
  return (
    <svg viewBox="0 0 24 16" className="h-[14px] w-[21px] flex-shrink-0 rounded-[1px] shadow-sm" aria-hidden>
      <rect width="24" height="16" fill="#B22234" />
      {[1, 3, 5, 7, 9, 11].map((i) => (
        <rect key={i} y={(i * 16) / 13} width="24" height={16 / 13} fill="#fff" />
      ))}
      <rect width="10.5" height={(16 * 7) / 13} fill="#3C3B6E" />
    </svg>
  );
}

function PlaceBadge({ place }: { place: number }) {
  const style =
    place === 1 ? 'bg-[#FBB533] text-[#3B2A08]' :
    place === 2 ? 'bg-[#C9D3DE] text-[#1F334E]' :
    place === 3 ? 'bg-[#D3762F] text-[#2A160A]' :
    place <= 5 ? 'bg-[#E6ECF0] text-[#0D1B4C]' : 'text-[#0D1B4C]';
  return (
    <span className={`inline-flex h-[24px] min-w-[24px] items-center justify-center rounded-full px-1 text-[13px] font-bold ${style}`}>
      {place}
    </span>
  );
}

function SponsorMark({ s, size = 'md' }: { s: AnglerSponsor; size?: 'md' | 'lg' }) {
  const big = size === 'lg';
  if (s.logo) {
    return (
      <span className="flex items-center justify-center rounded-md bg-[#0D1B4C] px-3 py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.logo} alt={s.name} className={big ? 'h-[44px] w-auto' : 'h-[30px] w-auto'} />
      </span>
    );
  }
  const base = `font-montserrat leading-none ${big ? 'text-[30px]' : 'text-[22px]'}`;
  const sub = `mt-1 block text-center font-montserrat font-semibold uppercase tracking-[0.18em] ${big ? 'text-[10px]' : 'text-[8px]'}`;
  switch (s.style) {
    case 'sonar':
      return <span className="text-center"><span className={`${base} font-extrabold tracking-[0.04em] text-[#1A5FD6]`}>SONARIX</span><span className={`${sub} text-[#1F334E]`}>{s.tagline}</span></span>;
    case 'volt':
      return <span className="text-center"><span className={`${base} font-extrabold tracking-[-0.02em] text-[#16A3A0]`}>voltwake</span><span className={`${sub} text-[#16A3A0]`}>{s.tagline}</span></span>;
    case 'amp':
      return <span className="text-center"><span className={`${base} font-black italic text-[#2F3D9E]`}>Amp<span className="text-[#E8A70F]">fin</span></span><span className={`${sub} text-[#2F3D9E]`}>{s.tagline}</span></span>;
    case 'stryk':
      return <span className="text-center"><span className={`${base} font-black italic tracking-[0.12em] text-[#111]`}>STRYKOR</span><span className={`${sub} text-[#111]`}>{s.tagline}</span></span>;
    case 'lodge':
      return <span className="text-center"><span className={`${base} whitespace-nowrap font-black italic text-[#3C7A2A] ${big ? '' : '!text-[17px]'}`}>LUNKER LODGE</span><span className={`${sub} text-[#3C7A2A]`}>{s.tagline}</span></span>;
    default:
      return <span className={`${base} font-extrabold ${INK}`}>{s.name}</span>;
  }
}

function useFollow(slug: string) {
  const key = `hoox_follow_${slug}`;
  const [following, setFollowing] = useState(false);
  useEffect(() => {
    try {
      setFollowing(localStorage.getItem(key) === '1');
    } catch {
      /* storage unavailable */
    }
  }, [key]);
  const toggle = () => {
    setFollowing((f) => {
      try {
        if (f) localStorage.removeItem(key);
        else localStorage.setItem(key, '1');
      } catch {
        /* ignore */
      }
      return !f;
    });
  };
  return { following, toggle };
}

/* -------------------------------- page -------------------------------- */

export default function AnglerProfilePage({ a }: { a: AnglerProfile }) {
  const [tab, setTab] = useState<TabKey>('results');
  const { following, toggle } = useFollow(a.slug);

  useEffect(() => {
    const h = window.location.hash.replace('#', '') as TabKey;
    if (TABS.some((t) => t.key === h)) setTab(h);
  }, []);
  const choose = (k: TabKey) => {
    setTab(k);
    history.replaceState(null, '', k === 'results' ? window.location.pathname : `#${k}`);
  };

  const s = a.stats;
  const stats = [
    { icon: <Trophy className="h-[34px] w-[34px] text-[#F2A51A]" fill="#F6C24A" strokeWidth={1.25} />, value: String(s.tournaments), label: 'Tournaments Fished' },
    { icon: <FishIcon className="h-[34px] w-[44px]" />, value: String(s.fish), label: 'Total Fish Caught' },
    { icon: <Weight className="h-[34px] w-[34px] text-[#017B7F]" fill="#017B7F" strokeWidth={1.25} />, value: fmtWeight(s.weight), label: 'Total Weight' },
    { icon: <Medal className="h-[34px] w-[34px] text-[#F2A51A]" strokeWidth={1.75} />, value: String(s.top5), label: 'Top 5 Finishes' },
    { icon: <Medal className="h-[34px] w-[34px] text-[#F2A51A]" strokeWidth={1.75} />, value: String(s.top10), label: 'Top 10 Finishes' },
    { icon: <BarChart3 className="h-[34px] w-[34px] text-[#017B7F]" strokeWidth={2.5} />, value: String(s.wins), label: 'Tournament Wins' },
  ];

  const FollowButton = ({ big = false }: { big?: boolean }) =>
    big ? (
      <button
        onClick={toggle}
        aria-pressed={following}
        className={`flex h-[48px] w-full items-center justify-center gap-3 rounded-md text-[17px] font-medium transition ${
          following ? 'border border-[#017379] bg-white text-[#017379] hover:bg-[#EEF9F8]' : 'bg-[#017379] text-white hover:bg-[#015E63]'
        }`}
      >
        {following ? <UserCheck className="h-5 w-5" strokeWidth={2} /> : <UserPlus className="h-5 w-5" strokeWidth={2} />}
        {following ? 'Following' : 'Follow Angler'}
      </button>
    ) : (
      <button
        onClick={toggle}
        aria-pressed={following}
        className={`flex h-[38px] items-center gap-3 rounded-md border px-[26px] text-[14px] font-medium transition ${
          following ? 'border-[#3FB3AE] bg-[#3FB3AE]/20 text-white' : 'border-[#3FB3AE] bg-[#04303F]/40 text-white hover:bg-[#3FB3AE]/20'
        }`}
      >
        {following ? <UserCheck className="h-[18px] w-[18px]" strokeWidth={2} /> : <UserPlus className="h-[18px] w-[18px]" strokeWidth={2} />}
        {following ? 'Following' : 'Follow Angler'}
      </button>
    );

  const avatar = (cls: string, px: number) =>
    a.avatar ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={a.avatar} alt={a.name} className={`${cls} object-cover`} />
    ) : a.name ? (
      // No profile photo yet: show initials (the leaderboard thumbnails are too small to enlarge)
      <span className={`${cls} flex items-center justify-center bg-gradient-to-br from-[#0E7490] to-[#003E7E] font-montserrat font-bold text-white`} style={{ fontSize: px * 0.36 }} aria-label={a.name} role="img">
        {a.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
      </span>
    ) : (
      <span className={`${cls} flex items-center justify-center bg-[#DDE6EE] text-[#6B8DE0]`}>
        <User className="h-1/2 w-1/2" />
      </span>
    );

  const socialIcon = { facebook: Facebook, instagram: Instagram, youtube: Youtube, website: Link2 };

  /* ----------------------------- sections ----------------------------- */

  const ResultsTable = (
    <section className={`${CARD} px-4 pt-[14px] pb-4`} aria-labelledby="results-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="results-heading" className={`text-[19px] font-bold ${INK}`}>Recent Tournament Results</h2>
        {a.results.length > 0 && (
          <button onClick={() => choose('activity')} className="flex items-center gap-2 text-[13px] font-semibold text-[#0B5F63] hover:text-hoox-brand">
            View All Results <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
      </div>
      {a.results.length === 0 ? (
        <p className="py-8 text-center text-[14px] text-[#7586A0]">No completed tournament results yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-md border border-[#E3EAF1]">
          <table className="w-full min-w-[560px] text-left text-[14px]">
            <thead className="bg-[#F5F8FA] text-[11px] font-semibold uppercase tracking-[0.03em] text-[#416184]">
              <tr>
                <th className="px-3 py-[9px]">Date</th>
                <th className="px-3 py-[9px]">Tournament</th>
                <th className="px-3 py-[9px]">Location</th>
                <th className="px-3 py-[9px]">Place</th>
                <th className="px-3 py-[9px] text-center">Fish</th>
                <th className="px-3 py-[9px]">Total Weight</th>
              </tr>
            </thead>
            <tbody>
              {a.results.map((r) => (
                <tr key={r.date + r.tournament} className="border-t border-[#EDF1F5]">
                  <td className="whitespace-nowrap px-3 py-[7px] text-[#445B7A]">{fmtDate(r.date)}</td>
                  <td className="px-3 py-[7px]">
                    {r.tournamentId ? (
                      <a href={`/tournaments/${r.tournamentId}`} className="font-medium text-[#1048A5] hover:underline">{r.tournament}</a>
                    ) : (
                      <span className={`font-medium ${INK}`}>{r.tournament}</span>
                    )}
                  </td>
                  <td className="px-3 py-[7px] text-[#536B84]">{r.location}</td>
                  <td className="px-3 py-[7px]"><PlaceBadge place={r.place} /></td>
                  <td className="px-3 py-[7px] text-center text-[#536B84]">{r.fish}</td>
                  <td className={`whitespace-nowrap px-3 py-[7px] font-medium ${INK}`}>{fmtWeight(r.weight)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const Highlights = (
    <section className={`${CARD} px-[18px] pt-[14px] pb-5`} aria-labelledby="highlights-heading">
      <h2 id="highlights-heading" className={`text-[19px] font-bold ${INK}`}>Career Highlights</h2>
      <ul className="mt-4 grid grid-cols-1 gap-y-[18px] gap-x-6 text-[13.5px] text-[#1E385F] sm:grid-cols-2">
        <li className="flex items-center gap-3"><Trophy className="h-[22px] w-[22px] text-[#F2A51A]" fill="#F6C24A" strokeWidth={1.25} /><span><b className={INK}>{s.wins}</b> Tournament {s.wins === 1 ? 'Win' : 'Wins'}</span></li>
        <li className="flex items-center gap-3"><Medal className="h-[22px] w-[22px] text-[#F2A51A]" strokeWidth={1.75} /><span><b className={INK}>{s.top10}</b> Top 10 {s.top10 === 1 ? 'Finish' : 'Finishes'}</span></li>
        <li className="flex items-center gap-3"><FishIcon className="h-[22px] w-[28px]" /><span><b className={INK}>{s.fish}</b> Total Fish Caught</span></li>
        <li className="flex items-center gap-3"><Weight className="h-[22px] w-[22px] text-[#017B7F]" fill="#017B7F" strokeWidth={1.25} /><span><b className={INK}>{fmtWeight(s.weight)}</b> Total Weight</span></li>
        {a.awards.map((w) => (
          <li key={w} className="flex items-center gap-3 sm:col-span-2"><Star className="h-[22px] w-[22px] text-[#F2A51A]" fill="#F6C24A" strokeWidth={1.25} />{w}</li>
        ))}
      </ul>
    </section>
  );

  const SponsorsCard = (
    <section className={`${CARD} px-[18px] pt-[14px] pb-5`} aria-labelledby="sponsors-heading">
      <div className="flex items-center justify-between">
        <h2 id="sponsors-heading" className={`text-[19px] font-bold ${INK}`}>Sponsors</h2>
        {a.sponsors.length > 0 && (
          <button onClick={() => choose('sponsors')} className="flex items-center gap-2 text-[13px] font-semibold text-[#0B5F63] hover:text-hoox-brand">
            View All Sponsors <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
      </div>
      {a.sponsors.length === 0 ? (
        <p className="py-6 text-center text-[14px] text-[#7586A0]">No sponsors listed yet.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 items-center gap-x-4 gap-y-6 sm:grid-cols-3">
          {a.sponsors.slice(0, 6).map((sp) => (
            <li key={sp.name} className="flex justify-center"><SponsorMark s={sp} /></li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="font-roboto bg-hoox-mist">
      <div className="mx-auto max-w-[1440px] px-4 md:px-[21px] pt-[12px] pb-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-[10px] flex items-center gap-2 text-[13px]">
          <Link href="/#leaderboards" className="font-medium text-[#335478] hover:underline">Anglers</Link>
          <ChevronRight className="h-3.5 w-3.5 text-[#5F728D]" strokeWidth={2} />
          <span className="text-[#5F728D]" aria-current="page">{a.name}</span>
        </nav>

        {/* Hero */}
        <section aria-label={a.name} className="relative min-h-[240px] overflow-hidden rounded-lg bg-[#05283A] shadow-[0_2px_10px_rgba(10,30,60,0.12)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/anglers/demo/hero.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[35%_center] md:left-auto md:right-0 md:w-[58%] md:object-left md:[-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_18%)] md:[mask-image:linear-gradient(90deg,transparent_0%,#000_18%)]"
          />
          <div className="absolute inset-0 hidden md:block" style={{ background: 'linear-gradient(90deg, rgba(3,30,46,0.97) 0%, rgba(5,40,58,0.9) 40%, rgba(5,40,58,0) 50%)' }} />
          <div className="absolute inset-0 bg-[#031A2A]/75 md:hidden" />

          <div className="relative z-10 flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:gap-6 sm:px-[30px] sm:py-[32px]">
            {avatar('h-[120px] w-[120px] sm:h-[164px] sm:w-[164px] flex-shrink-0 rounded-full border-[4px] border-white shadow-lg', 156)}
            <div className="min-w-0">
              <h1 className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[30px] sm:text-[38px] font-bold leading-tight text-white">
                {a.name}
                {a.isPro && <span className="rounded-full bg-[#F8B539] px-[10px] py-[2px] text-[12px] font-bold text-[#0F212D]">PRO</span>}
              </h1>
              {(a.city || a.country) && (
                <p className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-[15px] font-medium text-white">
                  {a.city && <span className="flex items-center gap-2.5"><MapPin className="h-[19px] w-[19px]" strokeWidth={1.75} />{a.city}</span>}
                  {a.country === 'United States' && <span className="flex items-center gap-2.5"><UsFlag />{a.country}</span>}
                </p>
              )}
              {a.tagline && (
                <p className="mt-3 max-w-[470px] text-[13.5px] leading-[20px] text-white/95">
                  {a.tagline.map((l) => <span key={l} className="block">{l}</span>)}
                </p>
              )}
              <div className="mt-[14px]"><FollowButton /></div>
            </div>
          </div>

          {a.quote && (
            <figure className="absolute bottom-[18px] right-[18px] z-10 hidden w-[215px] rounded-md bg-[#203744]/80 px-4 py-[14px] backdrop-blur-sm lg:block">
              <blockquote className="text-[14px] font-semibold italic leading-[20px] text-white">“{a.quote}”</blockquote>
              <figcaption className="mt-2 text-right text-[12px] text-white/90">— {a.name}</figcaption>
            </figure>
          )}
        </section>

        {/* Stat strip */}
        <dl className={`${CARD} mt-[14px] grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6`}>
          {stats.map((st, i) => (
            <div
              key={st.label}
              className={`flex items-center gap-4 px-6 py-[18px] ${i > 0 ? 'xl:border-l xl:border-[#EAF1F7]' : ''} ${i % 2 === 1 ? 'border-l border-[#EAF1F7] sm:border-l-0' : ''} ${i >= 2 ? 'border-t border-[#EAF1F7] xl:border-t-0' : ''} ${i % 3 !== 0 ? 'sm:border-l sm:border-[#EAF1F7]' : ''} ${i >= 3 ? 'sm:border-t sm:border-[#EAF1F7] xl:border-t-0' : 'sm:border-t-0'}`}
            >
              <span className="flex-shrink-0">{st.icon}</span>
              <span className="min-w-0">
                <dd className={`whitespace-nowrap text-[20px] font-bold leading-tight ${INK}`}>{st.value}</dd>
                <dt className="text-[13px] text-[#5B7593]">{st.label}</dt>
              </span>
            </div>
          ))}
        </dl>

        {/* Body */}
        <div className="mt-[18px] grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[380px_minmax(0,1fr)]">
          {/* About */}
          <aside className={`${CARD} px-[18px] pt-[16px] pb-[18px]`} aria-labelledby="about-heading">
            <h2 id="about-heading" className={`text-[21px] font-bold ${INK}`}>About {a.firstName}</h2>
            <p className="mt-3 text-[14.5px] leading-[21px] text-[#687E97]">
              {a.about || `${a.firstName} hasn’t added a bio yet.`}
            </p>
            {(a.city || a.country || a.team || a.social.length > 0) && (
              <ul className="mt-5 space-y-[13px] border-t border-[#E6EDF3] pt-5 text-[14px]">
                {a.city && <li className="flex items-center gap-4 text-[#263F5A]"><MapPin className={`h-[20px] w-[20px] ${INK}`} fill="currentColor" stroke="white" strokeWidth={1.5} />{a.city}</li>}
                {a.country === 'United States' && <li className="flex items-center gap-4 text-[#263F5A]"><UsFlag />{a.country}</li>}
                {a.team && <li className="flex items-center gap-4 text-[#263F5A]"><User className={`h-[20px] w-[20px] ${INK}`} fill="currentColor" strokeWidth={1.5} />Team: {a.team}</li>}
                {a.social.map((so) => {
                  const Icon = socialIcon[so.kind];
                  return (
                    <li key={so.kind} className="flex items-center gap-4 text-[#1953B0]">
                      <Icon className={`h-[20px] w-[20px] ${INK}`} strokeWidth={1.75} />
                      {/* Demo profile: handles are illustrative, so they aren't linked to real accounts */}
                      <span>{so.label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-6"><FollowButton big /></div>
          </aside>

          {/* Tabs + content */}
          <div className="min-w-0 space-y-[14px]">
            <div className={`${CARD} overflow-x-auto px-3`}>
              <div role="tablist" aria-label="Profile sections" className="flex h-[42px] min-w-max items-stretch gap-[18px] sm:gap-[30px]">
                {TABS.map((t) => {
                  const active = tab === t.key;
                  return (
                    <button
                      key={t.key}
                      role="tab"
                      aria-selected={active}
                      onClick={() => choose(t.key)}
                      className={`relative px-4 text-[14px] transition ${active ? 'font-semibold text-[#095B5E]' : 'text-[#496988] hover:text-[#095B5E]'}`}
                    >
                      {t.label}
                      {active && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t bg-[#076067]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {tab === 'results' && (
              <>
                {ResultsTable}
                <div className="grid grid-cols-1 gap-[14px] xl:grid-cols-2">
                  {Highlights}
                  {SponsorsCard}
                </div>
              </>
            )}

            {tab === 'activity' && (
              <section className={`${CARD} px-4 pt-[14px] pb-4`} aria-labelledby="activity-heading">
                <h2 id="activity-heading" className={`text-[19px] font-bold ${INK}`}>Recent Activity</h2>
                {a.activity.length === 0 ? (
                  <p className="py-8 text-center text-[14px] text-[#7586A0]">No activity yet.</p>
                ) : (
                  <ol className="mt-3">
                    {a.activity.map((ev, i) => {
                      const Icon = ev.kind === 'result' ? Flag : ev.kind === 'live' ? Clock : CalendarCheck;
                      return (
                        <li key={i} className="flex items-start gap-4 border-b border-[#EEF2F6] py-3 last:border-0">
                          <span className={`mt-[1px] flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full ${ev.kind === 'live' ? 'bg-[#E0F4F2] text-[#017379]' : 'bg-[#E9F2F7] text-[#2A6F86]'}`}>
                            <Icon className="h-[17px] w-[17px]" strokeWidth={2} />
                          </span>
                          <span className="min-w-0">
                            <span className={`block text-[14px] ${INK}`}>
                              {ev.tournamentId ? <a href={`/tournaments/${ev.tournamentId}`} className="hover:text-[#1048A5] hover:underline">{ev.text}</a> : ev.text}
                            </span>
                            <span className="block text-[12.5px] text-[#7586A0]">{fmtDate(ev.date)}{ev.kind === 'live' ? ' · Live' : ''}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            )}

            {tab === 'photos' && (
              <section className={`${CARD} px-4 pt-[14px] pb-4`} aria-labelledby="photos-heading">
                <h2 id="photos-heading" className={`text-[19px] font-bold ${INK}`}>Photos</h2>
                {a.photos.length === 0 ? (
                  <div className="py-10 text-center text-[14px] text-[#7586A0]">
                    <ImageIcon className="mx-auto mb-2 h-8 w-8 text-[#B7D9EB]" />
                    No photos yet.
                  </div>
                ) : (
                  <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                    {a.photos.map((p) => (
                      <li key={p} className="aspect-[4/3] overflow-hidden rounded-md bg-[#E9F2F7]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p} alt="" loading="lazy" className="h-full w-full object-cover transition hover:scale-[1.03]" />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {tab === 'sponsors' && (
              <section className={`${CARD} px-4 pt-[14px] pb-5`} aria-labelledby="all-sponsors-heading">
                <h2 id="all-sponsors-heading" className={`text-[19px] font-bold ${INK}`}>Sponsors</h2>
                {a.sponsors.length === 0 ? (
                  <p className="py-8 text-center text-[14px] text-[#7586A0]">No sponsors listed yet.</p>
                ) : (
                  <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {a.sponsors.map((sp) => (
                      <li key={sp.name} className="flex flex-col items-center justify-center gap-3 rounded-md border border-[#E3EAF1] px-4 py-6">
                        <SponsorMark s={sp} size="lg" />
                        {sp.tagline && <span className="text-[12.5px] text-[#7586A0]">{sp.tagline}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

