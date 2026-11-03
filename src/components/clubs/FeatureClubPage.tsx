'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Check, CheckCircle2, ChevronDown, Eye, EyeOff, Home, LayoutList, LogOut, Megaphone,
  Search, Sparkles, Star, Users, CalendarCheck, ClipboardCheck, Rocket,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { loginUser } from '@/lib/auth';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { CLUBS, ClubCard } from '@/components/pages/ClubsPage';
import { CLUB_SUBMIT_ROLES } from '@/lib/clubSubmission';
import { FEATURE_PERKS, FEATURE_PLANS, planById, type FeaturePlanId, type MyClub } from '@/lib/clubFeature';
import type { User } from '@/types';

/* ------------------------------------------------------------------ */
/* /clubs/feature — "Feature your Club" marketing page + request form. */
/* Prices and perks come from src/lib/clubFeature.ts.                  */
/* ------------------------------------------------------------------ */

const INK = 'text-[#0D1B4C]';
const inputClass =
  'h-[48px] w-full rounded-md border border-[#D9E3EC] bg-white px-4 text-[15px] text-[#1F2D3D] placeholder:text-[#7D8BA0] shadow-[0_1px_3px_rgba(10,30,60,0.04)] focus:border-hoox-ui focus:outline-none focus:ring-2 focus:ring-hoox-ui/40';
const labelClass = 'mb-1.5 block text-[14px] font-medium text-[#0D1B4C]';
const hintClass = 'mt-1.5 text-[13px] leading-[18px] text-[#6B7D93]';
const ROLE_LABEL: Record<string, string> = { angler: 'Angler', director: 'Tournament Director', admin: 'Admin', judge: 'Judge', sponsor: 'Partner' };
const canRequest = (u: User | null) => !!u && (CLUB_SUBMIT_ROLES as readonly string[]).includes(u.role);
const money = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);
const lowestPerMonth = Math.min(...FEATURE_PLANS.map((p) => p.perMonth));

const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/* Sample card for the hero preview: the demo featured club */
const SAMPLE = CLUBS.find((c) => c.featured) ?? CLUBS[0];

const BENEFITS = [
  { icon: LayoutList, title: 'Top of the directory', text: 'Featured clubs appear before every other club in the Clubs directory, search and filters.' },
  { icon: Star, title: 'Featured badge', text: 'A Featured tag on your club card tells anglers your club is active and worth a look.' },
  { icon: Megaphone, title: 'Clubs page hero banner', text: 'Your cover photo, logo and story in the large banner at the top of the Clubs page.' },
  { icon: Home, title: 'Home page spotlight', text: 'A spot in the Featured Clubs row on the HOOX home page, the first page anglers see.' },
  { icon: Users, title: 'Reach active anglers', text: 'HOOX anglers are already registering for tournaments and looking for people to fish with.' },
  { icon: CalendarCheck, title: 'Flexible terms', text: 'Feature for a month, a season or a full year. No long contracts, no setup fees.' },
];

const STEPS = [
  { icon: ClipboardCheck, title: 'Sign in & choose a plan', text: 'Pick your club and a plan below. It takes about a minute.' },
  { icon: Search, title: 'We review & invoice', text: 'We confirm your dates and email an invoice. Nothing is charged online.' },
  { icon: Rocket, title: 'Your club goes live', text: 'Once paid, your club is featured across HOOX for the length of your plan.' },
];

const FAQ = [
  { q: 'Does my club need to be listed on HOOX first?', a: 'Yes. Featuring promotes a club that’s already in the HOOX directory. If yours isn’t listed yet, submit it first. It’s free, and you can request featuring at the same time.' },
  { q: 'Who can request a featured listing?', a: 'Anyone with an Angler or Tournament Director account, usually a club officer or organizer. You can only feature clubs you submitted, or tell us which club in the notes.' },
  { q: 'When does featuring start?', a: 'On the start date you choose, or as soon as your invoice is paid. Your plan runs for one month, three months or a year from that date.' },
  { q: 'How do I pay?', a: 'After we review your request, we email you an invoice. You won’t be charged until you approve it.' },
  { q: 'Can I renew or upgrade?', a: 'Yes. Send a new request anytime from this page, or reply to your invoice email. Annual plans keep the same rate when you renew.' },
];

/* ============================== page =============================== */

export default function FeatureClubPage() {
  const [plan, setPlan] = useState<FeaturePlanId>('annual');

  const choosePlan = (id: FeaturePlanId) => {
    setPlan(id);
    scrollToId('request');
  };

  return (
    <div className="font-roboto">
      {/* ------------------------------ Hero ------------------------------ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A2A47] via-[#0B3552] to-[#0E5A6E] text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/clubs/demo/featured.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-right opacity-30 lg:opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A2A47] via-[#0A2A47]/90 to-[#0A2A47]/30" aria-hidden />
        <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:px-[42px] lg:py-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E4F63] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.03em] text-[#3FD6D0]">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} /> Feature your Club
            </span>
            <h1 className="mt-5 max-w-[680px] font-montserrat text-[36px] font-bold leading-[1.1] sm:text-[48px] lg:text-[56px]">
              Put your club in front of every angler on HOOX
            </h1>
            <p className="mt-5 max-w-[560px] text-[17px] leading-[27px] text-white/90 sm:text-[19px] sm:leading-[29px]">
              Featured clubs get the top spot in the directory, a banner on the Clubs page and a place on the home page, so the right anglers find you first.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => scrollToId('request')}
                className="flex h-[52px] items-center justify-center gap-3 rounded-md bg-[#22B3B5] px-7 text-[16px] font-semibold text-white shadow-[0_4px_12px_rgba(34,179,181,0.35)] transition hover:bg-[#1C9C9E]">
                Feature my club <ArrowRight className="h-5 w-5" strokeWidth={2} />
              </button>
              <button type="button" onClick={() => scrollToId('pricing')}
                className="flex h-[52px] items-center justify-center rounded-md border border-white/40 px-7 text-[16px] font-semibold text-white transition hover:bg-white/10">
                See pricing
              </button>
            </div>
            <p className="mt-5 text-[14px] text-white/75">Plans from {money(lowestPerMonth)}/month · No setup fees</p>
          </div>

          {/* Preview: what a featured club card looks like */}
          <div className="hidden justify-center lg:flex">
            <div className="w-full max-w-[340px] rotate-[1.5deg] rounded-xl bg-white/10 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm">
              <ul><ClubCard c={SAMPLE} onOpen={() => scrollToId('request')} showFeatured /></ul>
              <p className="mt-3 text-center text-[13px] font-medium text-white/80">How your club card looks when featured</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-[42px]">
        {/* --------------------------- Benefits --------------------------- */}
        <section aria-labelledby="benefits-heading" className="py-14 sm:py-20">
          <div className="max-w-[640px]">
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#14889A]">Why feature your club</p>
            <h2 id="benefits-heading" className={`mt-2 font-montserrat text-[28px] font-bold leading-tight sm:text-[36px] ${INK}`}>More visibility, more members</h2>
            <p className="mt-3 text-[17px] leading-[26px] text-[#536B84]">Every featured plan includes all of these.</p>
          </div>
          <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <li key={b.title} className="rounded-lg border border-[#E8EEF4] bg-white p-6 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#E6F4F5] text-[#0E7C7B]">
                  <b.icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <h3 className={`mt-4 font-montserrat text-[18px] font-bold ${INK}`}>{b.title}</h3>
                <p className="mt-2 text-[15px] leading-[23px] text-[#536B84]">{b.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------------------- Pricing --------------------------- */}
        <section id="pricing" aria-labelledby="pricing-heading" className="scroll-mt-[100px] border-t border-[#E3EAF1] py-14 sm:py-20">
          <div className="mx-auto max-w-[640px] text-center">
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#14889A]">Pricing</p>
            <h2 id="pricing-heading" className={`mt-2 font-montserrat text-[28px] font-bold leading-tight sm:text-[36px] ${INK}`}>Simple plans for every club</h2>
            <p className="mt-3 text-[17px] leading-[26px] text-[#536B84]">Same features on every plan. Longer plans cost less per month.</p>
          </div>
          <ul className="mx-auto mt-10 grid max-w-[1100px] grid-cols-1 gap-5 md:grid-cols-3">
            {FEATURE_PLANS.map((p) => {
              const best = p.id === 'annual';
              return (
                <li key={p.id}
                  className={`relative flex flex-col rounded-xl border bg-white p-7 shadow-[0_2px_10px_rgba(10,30,60,0.06)] ${best ? 'border-[#0E7C7B] ring-2 ring-[#0E7C7B] md:-translate-y-2' : 'border-[#E8EEF4]'}`}>
                  {p.badge && (
                    <span className={`absolute -top-3 left-7 rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-[0.03em] ${best ? 'bg-[#0E7C7B] text-white' : 'bg-[#E3F4F4] text-[#0B6564]'}`}>
                      {p.badge}
                    </span>
                  )}
                  <h3 className={`font-montserrat text-[20px] font-bold ${INK}`}>{p.name}</h3>
                  <p className="mt-4 flex items-baseline gap-1.5">
                    <span className={`font-montserrat text-[44px] font-bold leading-none ${INK}`}>{money(p.price)}</span>
                    <span className="text-[16px] text-[#5F7896]">/ {p.term}</span>
                  </p>
                  <p className="mt-2 h-5 text-[14px] text-[#5F7896]">{p.months > 1 ? `About ${money(p.perMonth)} / month` : 'Billed monthly'}</p>
                  <ul className="mb-8 mt-6 space-y-3 text-[15px] text-[#2E3F5C]">
                    {[...FEATURE_PERKS, ...p.extras].map((perk) => (
                      <li key={perk} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-[#0E7C7B]" strokeWidth={2.5} /> {perk}
                      </li>
                    ))}
                  </ul>
                  <button type="button" onClick={() => choosePlan(p.id)}
                    className={`mt-auto flex h-[48px] items-center justify-center gap-2 rounded-md text-[15px] font-semibold transition ${best ? 'bg-[#0E7C7B] text-white hover:bg-[#0B6766]' : 'border border-[#1FA3A6] text-[#0E7C7B] hover:bg-[#F1F9F9]'}`}>
                    Choose {p.name} <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-center text-[14px] text-[#6B7D93]">Prices in USD. Nothing is charged online. We confirm your dates and email an invoice after review.</p>
        </section>

        {/* -------------------------- How it works ------------------------- */}
        <section aria-labelledby="steps-heading" className="border-t border-[#E3EAF1] py-14 sm:py-20">
          <h2 id="steps-heading" className={`text-center font-montserrat text-[28px] font-bold leading-tight sm:text-[36px] ${INK}`}>How it works</h2>
          <ol className="mx-auto mt-10 grid max-w-[1100px] grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="text-center">
                <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0A2A47] text-[#3FD6D0]">
                  <s.icon className="h-6 w-6" strokeWidth={2} />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#22B3B5] text-[12px] font-bold text-white">{i + 1}</span>
                </span>
                <h3 className={`mt-4 font-montserrat text-[18px] font-bold ${INK}`}>{s.title}</h3>
                <p className="mx-auto mt-2 max-w-[300px] text-[15px] leading-[23px] text-[#536B84]">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------------------------- Request ---------------------------- */}
        <section id="request" aria-labelledby="request-heading" className="scroll-mt-[100px] pb-14 sm:pb-20">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="rounded-lg bg-gradient-to-br from-[#0A2A47] via-[#0B3552] to-[#0E5A6E] px-6 py-8 text-white shadow-[0_6px_20px_rgba(5,30,60,0.18)] sm:px-8 lg:sticky lg:top-[100px]">
              <h2 id="request-heading" className="font-montserrat text-[28px] font-bold leading-tight sm:text-[32px]">Request a featured listing</h2>
              <p className="mt-3 text-[16px] leading-[25px] text-white/90">Sign in to your HOOX account, choose your club and plan, and we’ll take it from there.</p>
              <ul className="mt-6 space-y-3 text-[15px] text-white/90">
                {['Angler or Tournament Director account required', 'Your club must be listed on HOOX', 'No charge until you approve your invoice'].map((t) => (
                  <li key={t} className="flex items-start gap-2.5"><Check className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-[#3FD6D0]" strokeWidth={2.5} />{t}</li>
                ))}
              </ul>
              <p className="mt-8 border-t border-white/15 pt-5 text-[14px] text-white/80">
                Club not on HOOX yet?{' '}
                <Link href="/clubs/submit" className="font-semibold text-[#3FD6D0] hover:underline">Submit your club</Link>{' '}
                first. It’s free.
              </p>
            </div>
            <RequestPanel plan={plan} setPlan={setPlan} />
          </div>
        </section>

        {/* ------------------------------ FAQ ------------------------------ */}
        <section aria-labelledby="faq-heading" className="border-t border-[#E3EAF1] py-14 sm:py-20">
          <h2 id="faq-heading" className={`text-center font-montserrat text-[28px] font-bold leading-tight sm:text-[36px] ${INK}`}>Questions</h2>
          <div className="mx-auto mt-8 max-w-[820px] divide-y divide-[#E3EAF1] rounded-lg border border-[#E8EEF4] bg-white shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-6 py-5">
                <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold ${INK}`}>
                  {f.q}
                  <ChevronDown className="h-5 w-5 flex-shrink-0 text-[#5F7896] transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-[15px] leading-[24px] text-[#536B84]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ====================== Sign in + request form ====================== */

function RequestPanel({ plan, setPlan }: { plan: FeaturePlanId; setPlan: (p: FeaturePlanId) => void }) {
  const { currentUser, login, logout, loading: authLoading } = useAuth();
  const allowed = canRequest(currentUser);

  // sign-in
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [noAccount, setNoAccount] = useState(false);

  // request
  const [clubs, setClubs] = useState<MyClub[] | null>(null);
  const [clubId, setClubId] = useState('');
  const [clubName, setClubName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [phone, setPhone] = useState('');
  const [promo, setPromo] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ club: string; plan: FeaturePlanId } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().slice(0, 10);

  const loadClubs = useCallback(async () => {
    setClubs(null);
    try {
      const res = await fetch('/api/my-clubs', { cache: 'no-store' });
      if (res.status === 401) {
        // Local sign-in is stale (server session expired)
        logout();
        setSignInError('Your session expired. Please sign in again.');
        return;
      }
      const j = await res.json();
      const list: MyClub[] = Array.isArray(j.clubs) ? j.clubs : [];
      setClubs(list);
      setClubId(list[0]?.id ?? 'other');
    } catch {
      setClubs([]);
      setClubId('other');
    }
  }, [logout]);

  useEffect(() => {
    if (!authLoading && allowed) loadClubs();
  }, [authLoading, allowed, loadClubs]);

  const onSignedIn = (u: User) => {
    setSignInError(''); setNoAccount(false);
    login(u);
  };

  const signIn = async () => {
    setSignInError(''); setNoAccount(false);
    if (!email.trim() || !password) { setSignInError('Enter your email and password.'); return; }
    setSigningIn(true);
    const { user, error: err, code } = await loginUser(email.trim(), password);
    setSigningIn(false);
    if (user) { onSignedIn(user); return; }
    if (code === 'not_found') { setNoAccount(true); return; }
    if (code === 'wrong_password') setSignInError('Incorrect password.');
    else if (code === 'account_paused') setSignInError('This account is paused. Please contact support.');
    else if (code === 'account_banned') setSignInError('This account is no longer active.');
    else setSignInError(err || 'Something went wrong. Please try again.');
  };

  const submit = async () => {
    setError('');
    if (clubId === 'other' && !clubName.trim()) { setError('Enter your club’s name.'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/club-feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubSubmissionId: clubId !== 'other' ? clubId : '',
          clubName: clubId === 'other' ? clubName.trim() : '',
          plan, startDate, contactPhone: phone, promoCode: promo, notes,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (j.ok) {
        const name = clubId === 'other' ? clubName.trim() : clubs?.find((c) => c.id === clubId)?.name || 'your club';
        setDone({ club: name, plan });
        requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        return;
      }
      if (j.code === 'auth_required') { logout(); setSignInError('Your session expired. Please sign in again.'); return; }
      setError(j.error || 'Something went wrong. Please try again.');
    } catch {
      setError('We couldn’t reach HOOX. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const chosen = planById(plan)!;

  return (
    <div ref={panelRef} className="scroll-mt-[100px] rounded-lg border border-[#E8EEF4] bg-white p-5 shadow-[0_2px_10px_rgba(10,30,60,0.06)] sm:p-8">
      {done ? (
        <div className="flex flex-col items-center py-8 text-center" role="status">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E6F4F5] text-[#0E7C7B]">
            <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} aria-hidden />
          </span>
          <h3 className={`mt-5 font-montserrat text-[26px] font-bold ${INK}`}>Request received!</h3>
          <p className="mt-3 max-w-[460px] text-[16px] leading-[25px] text-[#536B84]">
            Thanks{currentUser ? `, ${currentUser.name.split(' ')[0]}` : ''}. We’ll review your <strong className={INK}>{planById(done.plan)?.name}</strong> plan for{' '}
            <strong className={INK}>{done.club}</strong> and email {currentUser?.email || 'you'} with dates and an invoice.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/clubs" className="flex h-[46px] items-center justify-center gap-2 rounded-md bg-[#0E7C7B] px-6 text-[15px] font-semibold text-white hover:bg-[#0B6766]">
              Browse clubs <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <button type="button" onClick={() => { setDone(null); setNotes(''); setPromo(''); }} className="h-[46px] rounded-md border border-[#1FA3A6] px-6 text-[15px] font-medium text-[#0E7C7B] hover:bg-[#F1F9F9]">
              Feature another club
            </button>
          </div>
        </div>
      ) : authLoading ? (
        <div className="space-y-3"><div className="h-[48px] animate-pulse rounded-md bg-[#F0F4F8]" /><div className="h-[48px] animate-pulse rounded-md bg-[#F0F4F8]" /></div>
      ) : !allowed ? (
        /* ----------------------------- Sign in ----------------------------- */
        <div className="space-y-4">
          <h3 className={`font-montserrat text-[20px] font-bold ${INK}`}>Sign in to continue</h3>
          {currentUser && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#F7D9A8] bg-[#FFF8EC] px-4 py-3 text-[14px] text-[#7A4B00]">
              <span>You’re signed in as a {ROLE_LABEL[currentUser.role] || currentUser.role}. Featuring a club needs an Angler or Tournament Director account.</span>
              <button type="button" onClick={logout} className="font-semibold underline">Use a different account</button>
            </div>
          )}
          <GoogleSignInButton mode="signin" onUser={onSignedIn} onError={(m) => {
            if (/no hoox account/i.test(m)) setNoAccount(true); else setSignInError(m);
          }} />
          <div className="flex items-center gap-3 text-[13px] font-medium text-[#7A8BA3]" aria-hidden>
            <span className="h-px flex-1 bg-[#E3EAF1]" /> or sign in with email <span className="h-px flex-1 bg-[#E3EAF1]" />
          </div>
          <form noValidate onSubmit={(e) => { e.preventDefault(); signIn(); }} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="feat-email" className={labelClass}>Email</label>
                <input id="feat-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" className={inputClass} />
              </div>
              <div>
                <label htmlFor="feat-password" className={labelClass}>Password</label>
                <div className="relative">
                  <input id="feat-password" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Your HOOX password" className={`${inputClass} pr-11`} />
                  <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#5F7896] hover:text-[#0D1B4C]">
                    {showPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </div>
            </div>
            {signInError && <p role="alert" className="text-[14px] text-[#B42318]">{signInError} {/password/i.test(signInError) && <Link href="/forgot-password" className="font-semibold underline">Forgot password?</Link>}</p>}
            {noAccount && (
              <div role="status" className="rounded-md border border-[#D9E3EC] bg-[#F7FAFC] p-4 text-[14px] text-[#3E5067]">
                <p>No HOOX account uses that email yet. Create one, then list your club and come back to feature it.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/clubs/submit" className="rounded-md bg-[#0E7C7B] px-4 py-2 font-semibold text-white hover:bg-[#0B6766]">Submit a club & create account</Link>
                  <Link href="/register/angler" className="rounded-md border border-[#1FA3A6] bg-white px-4 py-2 font-medium text-[#0E7C7B] hover:bg-[#F1F9F9]">Angler account</Link>
                  <Link href="/register/director" className="rounded-md border border-[#1FA3A6] bg-white px-4 py-2 font-medium text-[#0E7C7B] hover:bg-[#F1F9F9]">Director account</Link>
                </div>
              </div>
            )}
            <button type="submit" disabled={signingIn} className="flex h-[50px] w-full items-center justify-center gap-3 rounded-md bg-[#0E7C7B] text-[16px] font-semibold text-white shadow-[0_4px_12px_rgba(14,124,123,0.25)] transition hover:bg-[#0B6766] disabled:opacity-60">
              {signingIn ? 'Signing in…' : <>Sign in <ArrowRight className="h-5 w-5" strokeWidth={2} /></>}
            </button>
          </form>
          <p className="text-center text-[14px] text-[#536B84]">
            New to HOOX? <Link href="/register/angler" className="font-semibold text-[#0E7C7B] hover:underline">Create an account</Link>
          </p>
        </div>
      ) : (
        /* ----------------------------- Request ----------------------------- */
        <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#CFE8E8] bg-[#F1F9F9] px-4 py-3">
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-[#0D1B4C]">{currentUser!.name}</div>
              <div className="truncate text-[13px] text-[#5F6F86]">{currentUser!.email} · {ROLE_LABEL[currentUser!.role] || currentUser!.role}</div>
            </div>
            <button type="button" onClick={logout} className="flex items-center gap-1.5 text-[14px] font-medium text-[#0E7C7B] hover:underline">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>

          <div>
            <label htmlFor="feat-club" className={labelClass}>Which club?<span className="text-[#B42318]"> *</span></label>
            {clubs === null ? (
              <div className="h-[48px] animate-pulse rounded-md bg-[#F0F4F8]" />
            ) : (
              <select id="feat-club" value={clubId} onChange={(e) => setClubId(e.target.value)} className={inputClass}>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city}, {c.state}){c.status !== 'approved' ? ' · pending review' : ''}{c.featured ? ' · featured now' : ''}
                  </option>
                ))}
                <option value="other">My club isn’t in this list</option>
              </select>
            )}
            {clubs && clubs.length === 0 && (
              <p className={hintClass}>You haven’t listed a club on HOOX yet. <Link href="/clubs/submit" className="font-semibold text-[#0E7C7B] hover:underline">Submit your club</Link> first, or enter its name below.</p>
            )}
            {clubId === 'other' && (
              <div className="mt-3">
                <label htmlFor="feat-clubName" className={labelClass}>Club name<span className="text-[#B42318]"> *</span></label>
                <input id="feat-clubName" value={clubName} onChange={(e) => setClubName(e.target.value)} maxLength={160} placeholder="Sierra Foothills Bass Club" className={inputClass} />
                <p className={hintClass}>If the club is listed under someone else’s account, tell us in the notes so we can confirm with them.</p>
              </div>
            )}
          </div>

          <fieldset>
            <legend className={labelClass}>Plan<span className="text-[#B42318]"> *</span></legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {FEATURE_PLANS.map((p) => (
                <label key={p.id} className={`flex cursor-pointer flex-col rounded-md border p-4 transition ${plan === p.id ? 'border-[#0E7C7B] bg-[#F1F9F9] ring-1 ring-[#0E7C7B]' : 'border-[#D9E3EC] hover:border-[#9FB3C6]'}`}>
                  <span className="flex items-center gap-2">
                    <input type="radio" name="plan" value={p.id} checked={plan === p.id} onChange={() => setPlan(p.id)} className="h-[18px] w-[18px] accent-[#0E7C7B]" />
                    <span className="text-[15px] font-semibold text-[#0D1B4C]">{p.name}</span>
                  </span>
                  <span className="mt-1 pl-[26px] text-[14px] text-[#5F6F86]">{money(p.price)} / {p.term}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="feat-start" className={labelClass}>Preferred start date <span className="font-normal text-[#7A8BA3]">(optional)</span></label>
              <input id="feat-start" type="date" min={today} value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
              <p className={hintClass}>Leave blank to start as soon as it’s approved.</p>
            </div>
            <div>
              <label htmlFor="feat-phone" className={labelClass}>Phone <span className="font-normal text-[#7A8BA3]">(optional)</span></label>
              <input id="feat-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="(555) 123-4567" className={inputClass} />
            </div>
            <div>
              <label htmlFor="feat-promo" className={labelClass}>Promo code <span className="font-normal text-[#7A8BA3]">(optional)</span></label>
              <input id="feat-promo" value={promo} onChange={(e) => setPromo(e.target.value)} maxLength={40} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="feat-notes" className={labelClass}>Anything else? <span className="font-normal text-[#7A8BA3]">(optional)</span></label>
              <textarea id="feat-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} placeholder="Membership drive dates, events you want to promote…"
                className={inputClass.replace('h-[48px]', 'min-h-[110px] py-3 leading-[22px]')} />
            </div>
          </div>

          {error && <div role="alert" className="rounded-md border border-[#F5C2BD] bg-[#FEF3F2] px-4 py-3 text-[14px] text-[#B42318]">{error}</div>}

          <div className="border-t border-[#EDF1F5] pt-6">
            <button type="submit" disabled={sending || clubs === null}
              className="flex h-[50px] w-full items-center justify-center gap-3 rounded-md bg-[#0E7C7B] text-[16px] font-semibold text-white shadow-[0_4px_12px_rgba(14,124,123,0.25)] transition hover:bg-[#0B6766] disabled:opacity-60">
              {sending ? 'Sending…' : <>Request {chosen.name} plan · {money(chosen.price)} <ArrowRight className="h-5 w-5" strokeWidth={2} /></>}
            </button>
            <p className="mt-3 text-center text-[13px] text-[#6B7D93]">You won’t be charged now. We’ll email an invoice after review.</p>
          </div>
        </form>
      )}
    </div>
  );
}
