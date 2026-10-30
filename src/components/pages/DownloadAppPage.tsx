'use client';

/* ------------------------------------------------------------------ */
/* /download — the HOOX mobile app: what it does, how catch submission */
/* works, and links to the App Store and Google Play.                  */
/* ------------------------------------------------------------------ */

import { ArrowRight, Camera, Bell, WifiOff, Ticket, ShieldCheck, Trophy, MapPin, Smartphone, Check } from 'lucide-react';
import SubmissionIllustration from '@/components/home/SubmissionIllustration';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/navLinks';

interface DownloadAppPageProps {
  onNavigate: (view: string) => void;
}

const FEATURES = [
  { icon: Camera, title: 'Submit catches from the water', desc: 'Snap your fish on the measuring board with the tournament code on your hand. The photo, time and GPS location go straight to the judges.' },
  { icon: Trophy, title: 'Live leaderboards', desc: 'Watch the standings move during the event and see exactly where you rank.' },
  { icon: Bell, title: 'Push notifications', desc: 'Get alerts when your catch is approved, when you move up the board, and when results are final.' },
  { icon: WifiOff, title: 'Works with weak signal', desc: 'Catches you submit with no service are saved on your phone and sent as soon as you’re back in range.' },
  { icon: Ticket, title: 'Register and check in', desc: 'Find tournaments near you, register solo or as a team, and see your tournament code the moment it’s released.' },
  { icon: MapPin, title: 'Tournaments, series & clubs', desc: 'Search by location, species and date, browse the calendar, and find fishing clubs nearby.' },
];

const STEPS = [
  { title: 'Get the code', desc: 'The tournament director releases a code in the app right before the start.' },
  { title: 'Write it on your hand', desc: 'Write the code on the back of your hand with a black marker.' },
  { title: 'Photograph your catch', desc: 'Lay the fish on the measuring board, mouth against the stop, hand on the fish.' },
  { title: 'Submit and get ranked', desc: 'Judges verify the code and length, and the leaderboard updates live.' },
];

/** App Store / Google Play button. Shows "Coming soon" until a store URL is set. */
function StoreButton({ store, url }: { store: 'ios' | 'android'; url: string | null }) {
  const ios = store === 'ios';
  const glyph = ios ? (
    // Simple phone glyph (official store badges can replace these buttons at launch)
    <Smartphone className="h-7 w-7" strokeWidth={1.75} aria-hidden />
  ) : (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <path d="M4 3.5v17l9-8.5-9-8.5z" fill="#22B3B5" />
      <path d="M4 3.5l12.2 6.9L13 12 4 3.5z" fill="#3FD6D0" />
      <path d="M4 20.5l9-8.5 3.2 1.6L4 20.5z" fill="#1C8E90" />
      <path d="M16.2 10.4L20 12.5l-3.8 2.1L13 12l3.2-1.6z" fill="#EDBB66" />
    </svg>
  );
  const label = (
    <>
      {glyph}
      <span className="text-left leading-tight">
        <span className="block text-[11px] font-medium uppercase tracking-[0.04em] opacity-80">{url ? (ios ? 'Download on the' : 'Get it on') : 'Coming soon to'}</span>
        <span className="block font-montserrat text-[18px] font-bold">{ios ? 'App Store' : 'Google Play'}</span>
      </span>
    </>
  );
  const cls = 'flex h-[60px] w-[210px] items-center gap-3 rounded-lg border px-4 transition';
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`${cls} border-white/20 bg-black text-white hover:bg-[#111]`}>
      {label}
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  ) : (
    <span aria-disabled="true" className={`${cls} cursor-default border-white/25 bg-white/10 text-white`}>{label}</span>
  );
}

/** Phone mockup showing the catch submission screen */
function PhoneMock() {
  return (
    <div className="relative mx-auto w-[260px] rounded-[38px] border-[10px] border-[#0B1622] bg-[#0B1622] shadow-[0_24px_50px_rgba(0,0,0,0.45)]">
      <div className="absolute left-1/2 top-0 z-10 h-[18px] w-[90px] -translate-x-1/2 rounded-b-xl bg-[#0B1622]" aria-hidden />
      <div className="overflow-hidden rounded-[28px] bg-[#F1F6FA]">
        <div className="bg-[#0A2A47] px-4 pb-3 pt-7 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#3FD6D0]">Lakefront Classic · Day 2</p>
          <p className="font-montserrat text-[15px] font-bold">Submit a catch</p>
        </div>
        <div className="p-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md">
            <SubmissionIllustration look="largemouth" code="HX-7Q2" inches={21.5} className="absolute inset-0 h-full w-full" />
          </div>
          <div className="mt-2.5 space-y-1.5 rounded-md bg-white p-2.5 text-[11.5px] shadow-sm">
            <p className="flex justify-between"><span className="text-[#5F7896]">Species</span><span className="font-semibold text-[#0D1B4C]">Largemouth Bass</span></p>
            <p className="flex justify-between"><span className="text-[#5F7896]">Length</span><span className="font-semibold text-[#0D1B4C]">21.5&quot;</span></p>
            <p className="flex justify-between"><span className="text-[#5F7896]">Code on hand</span><span className="font-semibold text-[#0E7C7B]">HX-7Q2 ✓</span></p>
          </div>
          <div className="mt-2.5 flex h-[36px] items-center justify-center rounded-md bg-[#22B3B5] text-[13px] font-semibold text-white">Submit catch</div>
          <div className="mt-2.5 flex items-center gap-2 rounded-md bg-[#E3F6EC] px-2.5 py-2 text-[11px] font-semibold text-[#11764A]">
            <Check className="h-3.5 w-3.5" strokeWidth={3} /> Last catch approved · You’re #3
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DownloadAppPage({ onNavigate }: DownloadAppPageProps) {
  const live = !!(APP_STORE_URL || PLAY_STORE_URL);
  return (
    <div className="font-roboto">
      <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-8 sm:px-6 lg:px-[42px] lg:pt-[34px]">
        {/* Hero */}
        <section aria-labelledby="app-hero-title" className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#0A2A47] via-[#0B3552] to-[#0E5A6E] shadow-[0_6px_20px_rgba(5,30,60,0.18)]">
          <div className="relative z-10 flex flex-col items-center gap-10 px-6 py-10 sm:px-10 lg:flex-row lg:justify-between lg:py-12">
            <div className="max-w-[600px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E4F63] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.03em] text-[#3FD6D0]">
                <Smartphone className="h-3.5 w-3.5" strokeWidth={2.25} /> HOOX for iPhone and Android
              </span>
              <h1 id="app-hero-title" className="mt-4 font-montserrat text-[32px] font-bold leading-[1.12] text-white sm:text-[44px]">
                Your tournament, in your pocket
              </h1>
              <p className="mt-4 text-[17px] leading-[26px] text-white/90">
                Register for tournaments, submit catches right from the boat, and follow live leaderboards. The HOOX app is built for anglers on the water and directors on the dock.
              </p>
              <ul className="mt-5 space-y-2">
                {['Catch submission with photo, time and GPS', 'Push alerts when your catch is approved', 'Saves catches offline until you have signal'].map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[15px] text-white">
                    <span className="mt-[3px] flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-[#22B3B5]"><Check className="h-3 w-3" strokeWidth={3} /></span>
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <StoreButton store="ios" url={APP_STORE_URL} />
                <StoreButton store="android" url={PLAY_STORE_URL} />
              </div>
              {!live && (
                <p className="mt-3 text-[14px] text-white/75">
                  The apps are on the way. Until then, everything works on <button onClick={() => onNavigate('home')} className="font-semibold text-[#3FD6D0] underline-offset-2 hover:underline">hoox.app</button> in your phone’s browser.
                </p>
              )}
            </div>
            <PhoneMock />
          </div>
        </section>

        {/* Features */}
        <section aria-labelledby="app-features-title" className="mt-10">
          <h2 id="app-features-title" className="font-montserrat text-[28px] font-bold leading-tight text-[#0D1B4C] sm:text-[34px]">What you can do in the app</h2>
          <ul className="mt-5 grid grid-cols-1 gap-[13px] sm:grid-cols-2 xl:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="rounded-lg border border-[#E8EEF4] bg-white p-5 shadow-[0_2px_10px_rgba(10,30,60,0.04)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#E6F4F5] text-[#0E7C7B]">
                  <f.icon className="h-[22px] w-[22px]" strokeWidth={2} />
                </span>
                <h3 className="mt-4 font-montserrat text-[17px] font-bold leading-tight text-[#0D1B4C]">{f.title}</h3>
                <p className="mt-2 text-[14px] leading-[21px] text-[#536B84]">{f.desc}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* How catch submission works */}
        <section aria-labelledby="app-steps-title" className="mt-10 rounded-lg bg-white px-4 py-6 shadow-[0_2px_10px_rgba(10,30,60,0.05)] sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F4F5] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.03em] text-[#0E7C7B]">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.25} /> Verified catches
          </span>
          <h2 id="app-steps-title" className="mt-3 font-montserrat text-[24px] font-bold leading-tight text-[#0D1B4C] sm:text-[28px]">How catch submission works</h2>
          <ol className="mt-5 grid grid-cols-1 gap-[13px] sm:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-lg border border-[#E8EEF4] bg-[#F7FAFC] p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0E7C7B] font-montserrat text-[16px] font-bold text-white">{i + 1}</span>
                <h3 className="mt-3 font-montserrat text-[17px] font-bold text-[#0D1B4C]">{s.title}</h3>
                <p className="mt-1.5 text-[14px] leading-[21px] text-[#536B84]">{s.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Call to action */}
        <section className="mt-12 flex flex-col items-start gap-6 rounded-lg bg-gradient-to-r from-[#0A2A47] to-[#0E5A6E] px-6 py-8 shadow-[0_6px_20px_rgba(5,30,60,0.18)] sm:px-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-montserrat text-[24px] font-bold leading-tight text-white sm:text-[28px]">New to HOOX?</h2>
            <p className="mt-2 max-w-[560px] text-[16px] leading-[24px] text-white/85">Create your free account now. It works on the web today and in the app when it launches.</p>
          </div>
          <button
            onClick={() => onNavigate('register')}
            className="flex h-[46px] items-center justify-center gap-3 rounded-md bg-[#22B3B5] px-7 text-[16px] font-semibold text-white shadow-[0_4px_12px_rgba(34,179,181,0.35)] transition hover:bg-[#1C9C9E]"
          >
            Get Hoox! <ArrowRight className="h-5 w-5" strokeWidth={2} />
          </button>
        </section>
      </div>
    </div>
  );
}
