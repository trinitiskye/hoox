'use client';

import {
  Trophy, ArrowRight, CalendarDays, Users, Smartphone, BarChart3, Search, ShieldCheck, Mountain,
} from 'lucide-react';

interface SignUpPageProps {
  onNavigate: (view: string) => void;
}

/* ------------------------------------------------------------------ */
/* /register — "Join the HOOX Tournament Community" (Register mock).   */
/* ------------------------------------------------------------------ */

type Feature = { icon: React.ReactNode; title: string; body: string };

const ICON = 'h-[34px] w-[34px] text-white';

const DIRECTOR_FEATURES: Feature[] = [
  { icon: <CalendarDays className={ICON} strokeWidth={1.6} />, title: 'Easy Event Management', body: 'Create, configure, and manage tournaments in minutes.' },
  { icon: <Users className={ICON} strokeWidth={1.6} />, title: 'Real-Time Results', body: 'Live leaderboards and instant updates keep everyone engaged.' },
  { icon: <Smartphone className={ICON} strokeWidth={1.6} />, title: 'Angler Communication', body: 'Send announcements, weather alerts, and important updates.' },
  { icon: <BarChart3 className={ICON} strokeWidth={2.4} />, title: 'Tools for Growth', body: 'Build your brand, attract more anglers, and track tournament success.' },
];

const ANGLER_FEATURES: Feature[] = [
  { icon: <Search className={ICON} strokeWidth={2} />, title: 'Find Tournaments', body: 'Search and register for events near you or nationwide.' },
  { icon: <Trophy className={ICON} strokeWidth={1.6} />, title: 'Live Leaderboards', body: 'Follow results in real time from anywhere.' },
  { icon: <Smartphone className={ICON} strokeWidth={1.6} />, title: 'Easy Check-In & Weigh-In', body: 'Submit catches, track your progress, and stay informed.' },
  { icon: <Users className={ICON} strokeWidth={1.6} />, title: 'Connect with the Community', body: 'Join a growing network of anglers who share your passion.' },
];

function FishMark() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/home/live-fish.png" alt="" className="h-[52px] w-[72px] object-contain brightness-0 invert" />;
}

function AudienceCard({
  eyebrow, title, body, features, photo, accent, cta, onCta, mark, tint,
}: {
  eyebrow: string;
  title: string;
  body: string;
  features: Feature[];
  photo: string;
  accent: 'gold' | 'teal';
  cta: string;
  onCta: () => void;
  mark: React.ReactNode;
  tint: string;
}) {
  const btn =
    accent === 'gold'
      ? 'bg-gradient-to-b from-[#FFC23A] to-[#FEB010] text-[#02182F] shadow-[0_4px_14px_rgba(254,176,16,0.35)]'
      : 'bg-gradient-to-b from-[#2EE0E0] to-[#10C9CC] text-[#02182F] shadow-[0_4px_14px_rgba(16,201,204,0.35)]';
  return (
    <article className="relative overflow-hidden rounded-lg shadow-[0_8px_24px_rgba(5,30,60,0.25)]" style={{ background: tint }}>
      {/* Photo on the right, fading into the card colour */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        alt=""
        className="absolute inset-y-0 right-0 h-full w-full object-cover opacity-[0.18] sm:w-[50%] sm:opacity-100 sm:[-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_35%)] sm:[mask-image:linear-gradient(90deg,transparent_0%,#000_35%)]"
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(2,22,40,0.55) 0%, rgba(2,22,40,0.2) 45%, rgba(2,22,40,0) 60%)' }} />

      <div className="relative z-10 flex h-full flex-col px-6 pt-[30px] pb-[22px] sm:px-[28px]">
        <div className="flex items-center gap-5">
          <span className="flex-shrink-0">{mark}</span>
          <div>
            <p className="text-[14px] font-medium uppercase tracking-[0.16em] text-[#3FD6E0]">{eyebrow}</p>
            <h2 className="mt-1 font-montserrat text-[24px] sm:text-[28px] font-bold leading-tight text-white">{title}</h2>
          </div>
        </div>
        <p className="mt-4 max-w-[370px] text-[16px] leading-[22px] text-white/95">{body}</p>

        <ul className="mt-6 space-y-[18px]">
          {features.map((f) => (
            <li key={f.title} className="flex items-start gap-6">
              <span className="mt-0.5 flex w-[40px] flex-shrink-0 justify-center">{f.icon}</span>
              <span className="max-w-[270px]">
                <span className="block text-[15px] font-medium text-white">{f.title}</span>
                <span className="mt-0.5 block text-[13px] leading-[18px] text-white/90">{f.body}</span>
              </span>
            </li>
          ))}
        </ul>

        <button
          onClick={onCta}
          className={`mt-7 flex h-[46px] w-full max-w-[400px] items-center justify-center gap-5 rounded-md px-3 text-[16px] sm:text-[18px] font-semibold transition hover:brightness-105 ${btn}`}
        >
          {cta} <ArrowRight className="h-5 w-5" strokeWidth={2.25} />
        </button>
      </div>
    </article>
  );
}

export default function SignUpPage({ onNavigate }: SignUpPageProps) {
  const trust = [
    { icon: <ShieldCheck className="h-[50px] w-[50px]" strokeWidth={1.5} />, text: ['Trusted by', 'Tournament Communities'] },
    { icon: <Mountain className="h-[50px] w-[50px]" strokeWidth={1.5} />, text: ['Built for the', 'Outdoors'] },
    { icon: <CalendarDays className="h-[50px] w-[50px]" strokeWidth={1.5} />, text: ['Events Nationwide'] },
    { icon: <Users className="h-[50px] w-[50px]" strokeWidth={1.5} />, text: ['A Growing Community', 'of Anglers and Directors'] },
  ];

  return (
    <div className="font-roboto relative overflow-hidden">
      {/* Soft lake backdrop */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/home/mountain-lake.jpg" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30 blur-[3px]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#EEF4FA]/95 via-[#E6EEF6]/80 to-[#D4E1EE]/70" />

      <div className="relative mx-auto max-w-[1440px] px-4 md:px-[26px] pt-[26px] pb-8">
        <header className="text-center">
          <h1 className="font-montserrat text-[28px] sm:text-[40px] font-bold leading-tight text-[#01024A]">Join the HOOX Tournament Community</h1>
          <p className="mx-auto mt-3 max-w-[840px] text-[17px] sm:text-[20px] leading-[1.25] text-[#0838B2]">
            Whether you run tournaments or love to compete, HOOX gives you the tools to make it easier, fairer and more exciting on the water.
          </p>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-[18px] lg:grid-cols-2">
          <AudienceCard
            eyebrow="For Tournament Directors"
            title="Run Better Tournaments"
            body="Save time, increase participation, and provide a world-class experience for your anglers with our all-in-one tournament platform."
            features={DIRECTOR_FEATURES}
            photo="/register/director.jpg"
            accent="gold"
            cta="Register as a Tournament Director"
            onCta={() => onNavigate('register-director')}
            mark={<Trophy className="h-[52px] w-[52px] text-white" fill="white" strokeWidth={1} />}
            tint="linear-gradient(160deg, #0B4A73 0%, #062C4C 45%, #031C31 100%)"
          />
          <AudienceCard
            eyebrow="For Anglers"
            title="Find. Compete. Catch More."
            body="Discover tournaments, compete with anglers across the country, and track your success — all in one place."
            features={ANGLER_FEATURES}
            photo="/register/angler.jpg"
            accent="teal"
            cta="Register as an Angler"
            onCta={() => onNavigate('register-angler')}
            mark={<FishMark />}
            tint="linear-gradient(160deg, #0A5878 0%, #01394F 45%, #002A3D 100%)"
          />
        </div>

        {/* Trust strip */}
        <ul className="mx-auto mt-6 grid max-w-[1260px] grid-cols-1 gap-y-5 sm:grid-cols-2 md:grid-cols-4">
          {trust.map((t, i) => (
            <li key={t.text.join(' ')} className={`flex items-center gap-5 px-4 text-[#04034B] sm:justify-center ${i > 0 ? 'md:border-l md:border-[#BEDDED]' : ''}`}>
              <span className="flex-shrink-0">{t.icon}</span>
              <span className="text-[16px] leading-[22px] text-[#0A2163]">
                {t.text.map((l) => <span key={l} className="block">{l}</span>)}
              </span>
            </li>
          ))}
        </ul>

        <section className="mt-9 text-center">
          <h2 className="font-montserrat text-[24px] sm:text-[30px] font-bold text-[#00005B]">Join Today and Be Part of Something Bigger</h2>
          <p className="mx-auto mt-2 max-w-[650px] text-[16px] leading-[22px] text-[#285192]">
            HOOX is more than a tournament app — it’s a community that’s passionate about fishing, competition, and the experiences we all love.
          </p>
          <svg viewBox="0 0 100 10" className="mx-auto mt-4 h-[10px] w-[96px]" aria-hidden>
            <path d="M0 6 C 20 0, 30 0, 50 5 S 80 10, 100 3" fill="none" stroke="#5BA1E8" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <p className="mt-5 text-[14px] text-[#285192]">
            Already have an account?{' '}
            <button onClick={() => onNavigate('login')} className="font-semibold text-[#0838B2] hover:underline">Log in</button>
          </p>
        </section>
      </div>
    </div>
  );
}
