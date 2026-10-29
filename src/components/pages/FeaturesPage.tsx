'use client';

/* ------------------------------------------------------------------ */
/* /features — what HOOX does for tournament directors, anglers and    */
/* promotional partners. Hero carousel, then a section per audience.   */
/* ------------------------------------------------------------------ */

import {
  ArrowRight, ClipboardList, CreditCard, ShieldCheck, Activity, UserCog, Banknote, Layers, Megaphone,
  Search, Ticket, Camera, Trophy, UserCircle, Users, CalendarDays, MapPin,
  GalleryHorizontal, Star, Handshake, Link2, LayoutGrid, Target, Fish,
} from 'lucide-react';
import FeaturesHero from '@/components/features/FeaturesHero';

interface FeaturesPageProps {
  onNavigate: (view: string) => void;
}

type Feature = { icon: typeof Trophy; title: string; desc: string };

const SECTIONS: { id: string; eyebrow: string; title: string; icon: typeof Trophy; cta: { label: string; view: string }; features: Feature[] }[] = [
  {
    id: 'directors', eyebrow: 'For Tournament Directors', title: 'Everything you need to run the event', icon: ClipboardList,
    cta: { label: 'Start a tournament', view: 'register-director' },
    features: [
      { icon: Layers, title: 'Tournaments & series', desc: 'Create single tournaments or multi-stop series with your rules, dates, species and locations.' },
      { icon: CreditCard, title: 'Registration & entry fees', desc: 'Anglers and teams register online and pay entry fees in one step. Track every boat entry.' },
      { icon: ShieldCheck, title: 'Catch verification', desc: 'Release a tournament code right before start. Judges check the code on each angler’s hand before approving.' },
      { icon: Activity, title: 'Live leaderboards', desc: 'Standings update the moment a catch is approved, on the web and for every angler in the field.' },
      { icon: UserCog, title: 'Judges & roles', desc: 'Invite judges and staff with their own access to review submissions and manage the event.' },
      { icon: Banknote, title: 'Results & payouts', desc: 'Final standings, big-fish winners and payouts calculated and published when the event ends.' },
      { icon: Megaphone, title: 'Listings & promotion', desc: 'List your tournament on HOOX and feature it on the home, search and calendar pages.' },
      { icon: Users, title: 'Angler updates', desc: 'Keep registered anglers informed with schedule changes, check-in times and results.' },
    ],
  },
  {
    id: 'anglers', eyebrow: 'For Anglers', title: 'Find events and compete from the water', icon: Fish,
    cta: { label: 'Join as an angler', view: 'register-angler' },
    features: [
      { icon: Search, title: 'Search tournaments & series', desc: 'Filter by state, species, status and dates, or search near you by ZIP code or your location.' },
      { icon: CalendarDays, title: 'Tournament calendar', desc: 'See every tournament and series event by day and plan your season.' },
      { icon: Ticket, title: 'Quick registration', desc: 'Register solo or as a team and pay your entry in minutes.' },
      { icon: Camera, title: 'Catch submissions', desc: 'Photograph your fish on the measuring board with the tournament code on your hand and submit it from your phone.' },
      { icon: Trophy, title: 'Live standings', desc: 'Watch the leaderboard move during the event and see where you rank.' },
      { icon: UserCircle, title: 'Angler profile', desc: 'Your results, wins and history in one public profile.' },
      { icon: MapPin, title: 'Fishing clubs', desc: 'Find clubs near you on the map and connect with anglers who fish the way you do.' },
      { icon: LayoutGrid, title: 'Winners Circle', desc: 'First-place catches featured on the home page for every event.' },
    ],
  },
  {
    id: 'partners', eyebrow: 'For Promotional Partners', title: 'Put your brand in front of anglers', icon: Handshake,
    cta: { label: 'Become a partner', view: 'sponsor' },
    features: [
      { icon: GalleryHorizontal, title: 'Hero & banner ads', desc: 'Home page hero carousel, “We recommend” banners and the 250 × 250 menu placement.' },
      { icon: Star, title: 'Featured listings', desc: 'Feature a tournament, series or club at the top of the pages anglers browse.' },
      { icon: Handshake, title: 'Sponsorships', desc: '“Presented by” credit on tournaments and series, with a link to your site.' },
      { icon: Link2, title: 'Affiliate programs', desc: 'Earn and reward referrals with partner links and offers for anglers.' },
      { icon: Target, title: 'Reach the right anglers', desc: 'Place your brand on the events, species and regions that match your products.' },
      { icon: Activity, title: 'Campaign reporting', desc: 'See impressions and clicks for each placement.' },
    ],
  },
];

export default function FeaturesPage({ onNavigate }: FeaturesPageProps) {
  return (
    <div className="font-roboto">
      <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-8 sm:px-6 lg:px-[42px] lg:pt-[34px]">
        <FeaturesHero />

        <h1 className="mt-10 font-montserrat text-[34px] font-bold leading-tight text-[#0D1B4C] sm:text-[46px]">App Features</h1>

        {SECTIONS.map((sec) => (
          <section key={sec.id} id={sec.id} aria-labelledby={`${sec.id}-title`} className="mt-8 scroll-mt-24 rounded-lg bg-white px-4 py-6 shadow-[0_2px_10px_rgba(10,30,60,0.05)] sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F4F5] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.03em] text-[#0E7C7B]">
                  <sec.icon className="h-3.5 w-3.5" strokeWidth={2.25} /> {sec.eyebrow}
                </span>
                <h2 id={`${sec.id}-title`} className="mt-3 font-montserrat text-[24px] font-bold leading-tight text-[#0D1B4C] sm:text-[28px]">{sec.title}</h2>
              </div>
              <button
                onClick={() => onNavigate(sec.cta.view)}
                className="flex items-center gap-2 text-[17px] font-medium text-[#016F8C] transition hover:text-hoox-brand"
              >
                {sec.cta.label} <ArrowRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <ul className="mt-5 grid grid-cols-1 gap-[13px] sm:grid-cols-2 xl:grid-cols-4">
              {sec.features.map((f) => (
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
        ))}

        {/* Call to action */}
        <section className="mt-12 flex flex-col items-start gap-6 rounded-lg bg-gradient-to-r from-[#0A2A47] to-[#0E5A6E] px-6 py-8 shadow-[0_6px_20px_rgba(5,30,60,0.18)] sm:px-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-montserrat text-[24px] font-bold leading-tight text-white sm:text-[28px]">Ready to get hooked?</h2>
            <p className="mt-2 max-w-[560px] text-[16px] leading-[24px] text-white/85">
              Create a free HOOX account as a tournament director, angler or partner.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              onClick={() => onNavigate('register')}
              className="flex h-[46px] items-center justify-center gap-3 rounded-md bg-[#22B3B5] px-7 text-[16px] font-semibold text-white shadow-[0_4px_12px_rgba(34,179,181,0.35)] transition hover:bg-[#1C9C9E]"
            >
              Get Hoox! <ArrowRight className="h-5 w-5" strokeWidth={2} />
            </button>
            <button onClick={() => onNavigate('login')} className="h-[46px] rounded-md border border-white/70 px-7 text-[16px] font-medium text-white transition hover:bg-white/10">
              Log In
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
