'use client';

/* Public: Advertise with us → Affiliate Programs (/advertise/affiliates) */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ChevronDown, Handshake, Link2, Trophy, Wallet, Users, CalendarRange, BarChart3, Loader2, CheckCircle2 } from 'lucide-react';
import { formatMoney, PAYOUT_METHODS, PAYOUT_METHOD_LABEL, DEFAULT_AFFILIATE_SETTINGS } from '@/lib/affiliates';

const INK = 'text-[#0D1B4C]';
interface Program { rate: number; windowMonths: number; feePerRegistration: number; minPayout: number; cookieDays: number; acceptingApplications: boolean }
const FALLBACK: Program = { rate: DEFAULT_AFFILIATE_SETTINGS.defaultRate, windowMonths: DEFAULT_AFFILIATE_SETTINGS.windowMonths, feePerRegistration: DEFAULT_AFFILIATE_SETTINGS.fallbackFee, minPayout: DEFAULT_AFFILIATE_SETTINGS.minPayout, cookieDays: 60, acceptingApplications: true };
const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export default function AffiliateProgramPage() {
  const [p, setP] = useState<Program>(FALLBACK);
  useEffect(() => { fetch('/api/affiliates/program').then((r) => (r.ok ? r.json() : null)).then((j) => j && setP(j)).catch(() => {}); }, []);
  const perAngler = Math.round(p.feePerRegistration * p.rate) / 100;
  const term = p.windowMonths === 12 ? 'first year' : `first ${p.windowMonths} months`;

  const BENEFITS = [
    { icon: Wallet, title: `${p.rate}% of HOOX’s cut`, text: `Earn ${p.rate}% of the HOOX fee on every angler who registers for a tournament run by a director you referred.` },
    { icon: CalendarRange, title: `For their ${term}`, text: `Every tournament they run on HOOX in their ${term} earns you commission, not just the first one.` },
    { icon: Link2, title: 'Your own referral link', text: `Share it anywhere. Directors who sign up within ${p.cookieDays} days of clicking it are credited to you.` },
    { icon: BarChart3, title: 'Clear, regular payouts', text: `We pay by PayPal, Venmo, Zelle, check or bank transfer once your balance reaches ${formatMoney(p.minPayout)}.` },
    { icon: Users, title: 'Made for the fishing community', text: 'Perfect for club officers, guides, tackle shops, fishing media and anyone who knows tournament directors.' },
    { icon: Trophy, title: 'Help directors run better events', text: 'HOOX gives directors online registration, live leaderboards, digital catch submissions and results.' },
  ];
  const STEPS = [
    { icon: Handshake, title: 'Apply', text: 'Tell us a little about you and how you’ll introduce directors to HOOX. We review every application.' },
    { icon: Link2, title: 'Share your link', text: 'Once approved, you get a personal referral link. Send it to tournament directors you know.' },
    { icon: Wallet, title: 'Get paid', text: 'When their anglers register, you earn commission. We pay out your balance regularly.' },
  ];
  const FAQ = [
    { q: 'Who counts as a referral?', a: `A tournament director who creates a new HOOX director account after clicking your link (within ${p.cookieDays} days). Existing HOOX directors can’t be referred.` },
    { q: 'How much will I earn?', a: `HOOX’s fee is about ${formatMoney(p.feePerRegistration)} per angler registration. You earn ${p.rate}% of it, about ${formatMoney(perAngler)} per angler, on every registration for tournaments your referred directors run in their ${term}.` },
    { q: 'When do I get paid?', a: `We review balances regularly and pay once you’ve earned at least ${formatMoney(p.minPayout)}. Smaller balances roll over to the next payout.` },
    { q: 'Do directors or anglers pay more?', a: 'No. Your commission comes out of HOOX’s share. Directors and anglers pay exactly the same.' },
    { q: 'Can I refer myself?', a: 'No. Your own director account can’t be credited to your affiliate account.' },
  ];

  return (
    <div className="font-roboto">
      {/* ------------------------------ Hero ------------------------------ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A2A47] via-[#0B3552] to-[#0E5A6E] text-white">
        <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:px-[42px] lg:py-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E4F63] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.03em] text-[#3FD6D0]">
              <Handshake className="h-3.5 w-3.5" strokeWidth={2.25} /> HOOX Affiliate Program
            </span>
            <h1 className="mt-5 max-w-[680px] font-montserrat text-[36px] font-bold leading-[1.1] sm:text-[48px] lg:text-[56px]">
              Bring tournament directors to HOOX. Earn on every angler.
            </h1>
            <p className="mt-5 max-w-[580px] text-[17px] leading-[27px] text-white/90 sm:text-[19px] sm:leading-[29px]">
              Refer directors who list their tournaments on HOOX and earn {p.rate}% of HOOX’s cut on every angler registration for their {term}.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => scrollToId('apply')} className="flex h-[52px] items-center justify-center gap-3 rounded-md bg-[#22B3B5] px-7 text-[16px] font-semibold text-white shadow-[0_4px_12px_rgba(34,179,181,0.35)] transition hover:bg-[#1C9C9E]">
                Apply now <ArrowRight className="h-5 w-5" strokeWidth={2} />
              </button>
              <button type="button" onClick={() => scrollToId('how')} className="flex h-[52px] items-center justify-center rounded-md border border-white/40 px-7 text-[16px] font-semibold text-white transition hover:bg-white/10">How it works</button>
            </div>
            <p className="mt-5 text-[14px] text-white/75">Free to join · No sales targets · Paid by PayPal, Venmo, Zelle or check</p>
          </div>
          <Estimator perAngler={perAngler} term={term} />
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-[42px]">
        <section aria-labelledby="benefits-heading" className="py-14 sm:py-20">
          <div className="max-w-[640px]">
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#14889A]">Why join</p>
            <h2 id="benefits-heading" className={`mt-2 font-montserrat text-[28px] font-bold leading-tight sm:text-[36px] ${INK}`}>Recurring earnings from every tournament</h2>
          </div>
          <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <li key={b.title} className="rounded-lg border border-[#E8EEF4] bg-white p-6 shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#E6F4F5] text-[#0E7C7B]"><b.icon className="h-5 w-5" strokeWidth={2} /></span>
                <h3 className={`mt-4 font-montserrat text-[18px] font-bold ${INK}`}>{b.title}</h3>
                <p className="mt-2 text-[15px] leading-[23px] text-[#536B84]">{b.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="how" aria-labelledby="steps-heading" className="scroll-mt-[100px] border-t border-[#E3EAF1] py-14 sm:py-20">
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

        <section id="apply" aria-labelledby="apply-heading" className="scroll-mt-[100px] pb-14 sm:pb-20">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="rounded-lg bg-gradient-to-br from-[#0A2A47] via-[#0B3552] to-[#0E5A6E] px-6 py-8 text-white shadow-[0_6px_20px_rgba(5,30,60,0.18)] sm:px-8 lg:sticky lg:top-[100px]">
              <h2 id="apply-heading" className="font-montserrat text-[28px] font-bold leading-tight sm:text-[32px]">Apply to become an affiliate</h2>
              <p className="mt-3 text-[16px] leading-[25px] text-white/90">We review applications within a few business days and email you your referral link once you’re approved.</p>
              <ul className="mt-6 space-y-3 text-[15px] text-white/90">
                {[`${p.rate}% of HOOX’s cut on every registration`, `For each director’s ${term}`, `Payouts from ${formatMoney(p.minPayout)}`, 'No cost to you, directors or anglers'].map((t) => (
                  <li key={t} className="flex items-start gap-2.5"><Check className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-[#3FD6D0]" strokeWidth={2.5} />{t}</li>
                ))}
              </ul>
              <p className="mt-8 border-t border-white/15 pt-5 text-[14px] text-white/80">Are you a tournament director? <Link href="/register/director" className="font-semibold text-[#3FD6D0] hover:underline">Create your director account</Link>.</p>
            </div>
            <ApplyForm accepting={p.acceptingApplications} />
          </div>
        </section>

        <section aria-labelledby="faq-heading" className="border-t border-[#E3EAF1] py-14 sm:py-20">
          <h2 id="faq-heading" className={`text-center font-montserrat text-[28px] font-bold leading-tight sm:text-[36px] ${INK}`}>Questions</h2>
          <div className="mx-auto mt-8 max-w-[820px] divide-y divide-[#E3EAF1] rounded-lg border border-[#E8EEF4] bg-white shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-6 py-5">
                <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold ${INK}`}>{f.q}<ChevronDown className="h-5 w-5 flex-shrink-0 text-[#5F7896] transition group-open:rotate-180" /></summary>
                <p className="mt-3 text-[15px] leading-[24px] text-[#536B84]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* Earnings estimator in the hero */
function Estimator({ perAngler, term }: { perAngler: number; term: string }) {
  const [directors, setDirectors] = useState(3);
  const [events, setEvents] = useState(4);
  const [anglers, setAnglers] = useState(40);
  const total = Math.round(perAngler * directors * events * anglers * 100) / 100;
  const slider = (label: string, value: number, set: (n: number) => void, min: number, max: number, step = 1) => (
    <label className="block">
      <span className="flex justify-between text-[14px] text-white/85"><span>{label}</span><span className="font-semibold text-white">{value}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} className="mt-2 w-full accent-[#3FD6D0]" />
    </label>
  );
  return (
    <div className="rounded-xl bg-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm" aria-labelledby="est-title">
      <h2 id="est-title" className="font-montserrat text-[18px] font-bold">Estimate your earnings</h2>
      <div className="mt-5 space-y-5">
        {slider('Directors you refer', directors, setDirectors, 1, 25)}
        {slider('Tournaments each runs', events, setEvents, 1, 20)}
        {slider('Anglers per tournament', anglers, setAnglers, 10, 300, 10)}
      </div>
      <div className="mt-6 rounded-lg bg-[#0A2A47]/60 px-4 py-4">
        <p className="text-[13px] text-white/75">Estimated earnings for their {term}</p>
        <p className="font-montserrat text-[36px] font-bold leading-tight text-[#3FD6D0]" aria-live="polite">{formatMoney(total)}</p>
        <p className="text-[12.5px] text-white/70">{directors * events * anglers} registrations × about {formatMoney(perAngler)} each</p>
      </div>
    </div>
  );
}

function ApplyForm({ accepting }: { accepting: boolean }) {
  const [f, setF] = useState({ name: '', email: '', phone: '', organization: '', website: '', audience: '', payoutMethod: '', payoutDetails: '', company: '' });
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const input = 'h-[48px] w-full rounded-md border border-[#D9E3EC] bg-white px-4 text-[15px] text-[#1F2D3D] placeholder:text-[#7D8BA0] focus:border-[#22B3B5] focus:outline-none focus:ring-2 focus:ring-[#22B3B5]/40';
  const label = 'mb-1.5 block text-[14px] font-medium text-[#0D1B4C]';
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    if (!f.name.trim() || !f.email.trim()) { setErr('Enter your name and email.'); return; }
    if (!f.audience.trim()) { setErr('Tell us how you’ll introduce tournament directors to HOOX.'); return; }
    if (!agree) { setErr('Please agree to the program terms.'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/affiliates/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, agree }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j.error) throw new Error(j.error || 'Something went wrong. Please try again.');
      setDone(true);
    } catch (e2) { setErr((e2 as Error).message); } finally { setBusy(false); }
  };

  const card = 'rounded-lg border border-[#E8EEF4] bg-white p-6 shadow-[0_2px_10px_rgba(10,30,60,0.05)] sm:p-8';
  if (!accepting) return <div className={card}><h3 className={`font-montserrat text-[20px] font-bold ${INK}`}>Applications are closed for now</h3><p className="mt-2 text-[15px] text-[#536B84]">We’re not taking new affiliates at the moment. <Link href="/contact" className="font-semibold text-[#0E7C7B] hover:underline">Contact us</Link> and we’ll let you know when we reopen.</p></div>;
  if (done) return (
    <div className={`${card} text-center`} role="status">
      <CheckCircle2 className="mx-auto h-12 w-12 text-[#0E7C7B]" strokeWidth={1.75} />
      <h3 className={`mt-3 font-montserrat text-[24px] font-bold ${INK}`}>Thanks, we’ve got your application</h3>
      <p className="mx-auto mt-2 max-w-[440px] text-[15px] leading-[24px] text-[#536B84]">We’ll review it and email {f.email} with your referral link once you’re approved.</p>
      <Link href="/" className="mt-6 inline-flex h-[44px] items-center rounded-md border border-[#D3DEE8] px-5 text-[15px] font-semibold text-[#2E3F5C] hover:bg-[#F5F8FB]">Back to home</Link>
    </div>
  );
  return (
    <form onSubmit={submit} className={card} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label><span className={label}>Full name *</span><input className={input} value={f.name} onChange={set('name')} autoComplete="name" required /></label>
        <label><span className={label}>Email *</span><input type="email" className={input} value={f.email} onChange={set('email')} autoComplete="email" required /></label>
        <label><span className={label}>Phone</span><input type="tel" className={input} value={f.phone} onChange={set('phone')} autoComplete="tel" /></label>
        <label><span className={label}>Club, shop or company</span><input className={input} value={f.organization} onChange={set('organization')} autoComplete="organization" /></label>
        <label className="sm:col-span-2"><span className={label}>Website or social profile</span><input className={input} value={f.website} onChange={set('website')} placeholder="instagram.com/yourpage" /></label>
        <label className="sm:col-span-2"><span className={label}>How will you introduce tournament directors to HOOX? *</span>
          <textarea rows={4} className={`${input} h-auto py-3`} value={f.audience} onChange={set('audience')} placeholder="e.g. I’m secretary of a bass club and know directors of 6 local trails…" required />
        </label>
        <label><span className={label}>How should we pay you?</span>
          <select className={input} value={f.payoutMethod} onChange={set('payoutMethod')}>
            <option value="">Choose later</option>
            {PAYOUT_METHODS.map((m) => <option key={m} value={m}>{PAYOUT_METHOD_LABEL[m]}</option>)}
          </select>
        </label>
        <label><span className={label}>Payout details</span><input className={input} value={f.payoutDetails} onChange={set('payoutDetails')} placeholder="PayPal email or @venmo" /></label>
        {/* Honeypot for bots */}
        <label className="hidden" aria-hidden><span>Company</span><input tabIndex={-1} autoComplete="off" value={f.company} onChange={set('company')} /></label>
      </div>
      <label className="mt-5 flex items-start gap-2.5 text-[14px] leading-[21px] text-[#536B84]">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#0E7C7B]" />
        I agree to the HOOX affiliate terms: commission is paid only on registrations from directors I refer, self-referrals don’t count, and HOOX may end the program or an account at any time.
      </label>
      {err && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700" role="alert">{err}</p>}
      <button type="submit" disabled={busy} className="mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-md bg-[#22B3B5] text-[16px] font-semibold text-white shadow-[0_4px_12px_rgba(34,179,181,0.35)] transition hover:bg-[#1C9C9E] disabled:opacity-70">
        {busy ? <><Loader2 className="h-5 w-5 animate-spin" />Sending…</> : <>Submit application <ArrowRight className="h-5 w-5" strokeWidth={2} /></>}
      </button>
    </form>
  );
}
