'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, CheckCircle2, Megaphone, Search, Send } from 'lucide-react';
import ImagePicker, { loadImage, type Picked } from '@/components/ui/ImagePicker';
import { COUNTRIES, getStatesForCountry } from '@/lib/addressData';
import {
  EVENT_TYPES,
  FISHING_FOCUS,
  PROMO_PACKAGES,
  IMAGE_TYPES,
  LOGO_MAX_BYTES,
  HERO_MAX_BYTES,
  HERO_MIN_WIDTH,
  HERO_MIN_HEIGHT,
} from '@/lib/eventSubmission';

/* ------------------------------------------------------------------ */
/* Styles (match the director / angler registration forms)            */
/* ------------------------------------------------------------------ */
const inputClass =
  'h-[48px] w-full rounded-md border border-[#D9E3EC] bg-white px-4 text-[15px] text-[#1F2D3D] placeholder:text-[#7D8BA0] shadow-[0_1px_3px_rgba(10,30,60,0.04)] focus:border-hoox-ui focus:outline-none focus:ring-2 focus:ring-hoox-ui/40 disabled:bg-[#F5F8FB]';
const textareaClass = inputClass.replace('h-[48px]', 'min-h-[120px] py-3 leading-[22px]');
const labelClass = 'mb-1.5 block text-[14px] font-medium text-[#0D1B4C]';
const hintClass = 'mt-1.5 text-[13px] leading-[18px] text-[#6B7D93]';

function Req() {
  return <span className="text-[#B42318]"> *</span>;
}
function Opt() {
  return <span className="font-normal text-[#7A8BA3]"> (optional)</span>;
}

/** Numbered form section (divider above every section after the first) */
function Section({ n, title, intro, children }: { n: number; title: string; intro?: string; children: React.ReactNode }) {
  const id = `evt-section-${n}`;
  return (
    <fieldset aria-labelledby={id} className={n > 1 ? 'border-t border-[#EDF1F5] pt-6' : ''}>
      <h2 id={id} className="flex items-center gap-3 font-montserrat text-[18px] font-bold text-[#0D1B4C]">
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#0E7C7B] text-[13px] text-white">{n}</span>
        {title}
      </h2>
      {intro && <p className="mt-1.5 pl-10 text-[14px] text-[#5F6F86]">{intro}</p>}
      <div className="mt-4">{children}</div>
    </fieldset>
  );
}

/* ------------------------------------------------------------------ */
/* Form state                                                          */
/* ------------------------------------------------------------------ */
const EMPTY = {
  contactName: '', contactTitle: '', contactEmail: '', contactPhone: '', organization: '', organizationWebsite: '',
  eventName: '', eventType: '', startDate: '', endDate: '', dailyHours: '',
  venueName: '', address: '', city: '', state: '', zip: '', country: 'US',
  shortDescription: '', longDescription: '', ticketUrl: '', ticketPrice: '', expectedAttendance: '', exhibitorCount: '', socialLinks: '',
  heroAltText: '',
  preferredStart: '', preferredEnd: '', promoCode: '', billingName: '', billingEmail: '', notes: '',
  website_url: '', // honeypot
};
type FormState = typeof EMPTY;
type TextKey = keyof FormState;

const SHORT_MAX = 160;

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function SubmitEventPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [focus, setFocus] = useState<string[]>([]);
  const [packages, setPackages] = useState<string[]>(['basic_listing']);
  const [logo, setLogo] = useState<Picked>(null);
  const [hero, setHero] = useState<Picked>(null);
  const [logoError, setLogoError] = useState('');
  const [heroError, setHeroError] = useState('');
  const [agreedRights, setAgreedRights] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const states = getStatesForCountry(form.country);
  const country = COUNTRIES.find((c) => c.code === form.country);
  const stateLabel = country?.stateLabel || 'State / Province';

  // Release object URLs when previews change or the page unmounts
  useEffect(() => () => { if (logo) URL.revokeObjectURL(logo.preview); }, [logo]);
  useEffect(() => () => { if (hero) URL.revokeObjectURL(hero.preview); }, [hero]);

  const set = (k: TextKey) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const pickImage = async (
    file: File | undefined,
    kind: 'logo' | 'hero',
  ) => {
    const setErr = kind === 'logo' ? setLogoError : setHeroError;
    const setPicked = kind === 'logo' ? setLogo : setHero;
    setErr('');
    if (!file) return;
    if (!IMAGE_TYPES[file.type]) { setErr('Use a JPG, PNG, or WebP image.'); return; }
    const max = kind === 'logo' ? LOGO_MAX_BYTES : HERO_MAX_BYTES;
    if (file.size > max) { setErr(`File must be ${max / 1024 / 1024} MB or smaller.`); return; }
    try {
      const { preview, width, height } = await loadImage(file);
      if (kind === 'hero') {
        const off = Math.abs(width / height - 16 / 9) / (16 / 9);
        if (width < HERO_MIN_WIDTH || height < HERO_MIN_HEIGHT) {
          URL.revokeObjectURL(preview);
          setErr(`Image must be at least ${HERO_MIN_WIDTH} × ${HERO_MIN_HEIGHT} px. Yours is ${width} × ${height}.`);
          return;
        }
        if (off > 0.02) {
          URL.revokeObjectURL(preview);
          setErr(`Image must be 16:9 (for example 1920 × 1080). Yours is ${width} × ${height}.`);
          return;
        }
      }
      setPicked({ file, preview, width, height });
    } catch {
      setErr('That image couldn’t be read. Try exporting it again as JPG or PNG.');
    }
  };

  const showError = (msg: string) => {
    setError(msg);
    requestAnimationFrame(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  const validate = (): string => {
    const required: [TextKey, string][] = [
      ['contactName', 'Contact name'], ['contactEmail', 'Email'], ['organization', 'Organization'],
      ['eventName', 'Event name'], ['eventType', 'Event type'], ['startDate', 'Start date'], ['endDate', 'End date'],
      ['venueName', 'Venue name'], ['city', 'City'], ['state', stateLabel], ['shortDescription', 'Short description'],
    ];
    const missing = required.filter(([k]) => !form[k].trim()).map(([, l]) => l);
    if (missing.length) return `Please fill in: ${missing.join(', ')}.`;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) return 'Please enter a valid email address.';
    if (form.endDate < form.startDate) return 'End date can’t be before the start date.';
    if (form.preferredStart && form.preferredEnd && form.preferredEnd < form.preferredStart) return 'Preferred run end can’t be before its start.';
    if (packages.length === 0) return 'Choose at least one promotion option.';
    if (hero && !form.heroAltText.trim()) return 'Please describe your hero image (used as alt text).';
    if (!agreedRights) return 'Please confirm you have the rights to the images you submitted.';
    if (!agreedTerms) return 'Please accept the HOOX listing and advertising guidelines.';
    return '';
  };

  const handleSubmit = async () => {
    setError('');
    const problem = validate();
    if (problem) { showError(problem); return; }

    const body = new FormData();
    (Object.keys(form) as TextKey[]).forEach((k) => body.append(k, form[k]));
    focus.forEach((f) => body.append('fishingFocus', f));
    packages.forEach((p) => body.append('packages', p));
    body.append('agreedRights', String(agreedRights));
    body.append('agreedTerms', String(agreedTerms));
    body.append('marketingOptIn', String(optIn));
    if (logo) body.append('logo', logo.file);
    if (hero) body.append('heroImage', hero.file);

    setLoading(true);
    try {
      const res = await fetch('/api/event-submissions', { method: 'POST', body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) { showError(json.error || 'Something went wrong. Please try again.'); return; }
      setDone(true);
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch {
      showError('We couldn’t reach HOOX. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm(EMPTY); setFocus([]); setPackages(['basic_listing']); setLogo(null); setHero(null);
    setAgreedRights(false); setAgreedTerms(false); setOptIn(false); setDone(false);
  };

  const field = (
    k: TextKey,
    label: string,
    opts: { type?: string; placeholder?: string; required?: boolean; auto?: string; hint?: string; wide?: boolean; max?: number } = {},
  ) => (
    <div className={opts.wide ? 'sm:col-span-2' : ''}>
      <label htmlFor={`evt-${k}`} className={labelClass}>{label}{opts.required ? <Req /> : <Opt />}</label>
      <input
        id={`evt-${k}`}
        type={opts.type || 'text'}
        value={form[k]}
        onChange={set(k)}
        placeholder={opts.placeholder}
        autoComplete={opts.auto || 'off'}
        maxLength={opts.max}
        required={opts.required}
        className={inputClass}
      />
      {opts.hint && <p className={hintClass}>{opts.hint}</p>}
    </div>
  );

  const STEPS = [
    { icon: Send, title: 'Send your request', text: 'Tell us about your show and choose how you’d like to be featured.' },
    { icon: Search, title: 'We review it', text: 'Our team checks the details and replies by email with options and pricing.' },
    { icon: Megaphone, title: 'Go live on HOOX', text: 'Your event appears on Events, the calendar, and any placements you book.' },
  ];

  return (
    <div className="font-roboto" ref={topRef}>
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-start gap-6 px-4 pb-12 pt-8 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:px-[42px] lg:pt-[34px]">
        {/* Why list on HOOX */}
        <aside className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#0A2A47] via-[#0B3552] to-[#0E5A6E] px-6 py-8 text-white shadow-[0_6px_20px_rgba(5,30,60,0.18)] sm:px-8 lg:sticky lg:top-[100px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E4F63] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.03em] text-[#3FD6D0]">
            <CalendarDays className="h-3.5 w-3.5" strokeWidth={2.25} /> For Event Organizers
          </span>
          <h1 className="mt-4 font-montserrat text-[30px] font-bold leading-[1.15] sm:text-[36px]">Submit your event</h1>
          <p className="mt-3 text-[16px] leading-[25px] text-white/90">
            Put your expo, trade show or boat show in front of anglers and tournament directors who are planning their season.
          </p>
          <ol className="mt-6 space-y-4">
            {STEPS.map((s) => (
              <li key={s.title} className="flex items-start gap-3.5">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#3FD6D0]">
                  <s.icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold">{s.title}</span>
                  <span className="block text-[14px] leading-[20px] text-white/80">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-8 border-t border-white/15 pt-5 text-[14px] text-white/80">
            Basic listings are free. Nothing is billed until you approve a quote.
          </p>
        </aside>

        {/* Form / confirmation */}
        <section aria-label="Event submission form" className="rounded-lg border border-[#E8EEF4] bg-white p-5 shadow-[0_2px_10px_rgba(10,30,60,0.06)] sm:p-8">
          {done ? (
            <div className="flex flex-col items-center py-10 text-center" role="status">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E6F4F5] text-[#0E7C7B]">
                <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} aria-hidden />
              </span>
              <h2 className="mt-5 font-montserrat text-[26px] font-bold text-[#0D1B4C]">Thanks, we’ve got it!</h2>
              <p className="mt-3 max-w-[480px] text-[16px] leading-[25px] text-[#536B84]">
                Your request for <strong className="text-[#0D1B4C]">{form.eventName}</strong> is in our review queue.
                We’ll email <strong className="text-[#0D1B4C]">{form.contactEmail}</strong> with next steps.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/events" className="flex h-[46px] items-center justify-center gap-2 rounded-md bg-[#0E7C7B] px-6 text-[15px] font-semibold text-white transition hover:bg-[#0B6766]">
                  Browse events <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
                <button type="button" onClick={reset} className="h-[46px] rounded-md border border-[#1FA3A6] px-6 text-[15px] font-medium text-[#0E7C7B] transition hover:bg-[#F1F9F9]">
                  Submit another event
                </button>
              </div>
            </div>
          ) : (
            <form noValidate onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
              {/* Honeypot — hidden from people and screen readers */}
              <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="evt-website_url">Leave this empty</label>
                <input id="evt-website_url" tabIndex={-1} autoComplete="off" value={form.website_url} onChange={set('website_url')} />
              </div>

              <Section n={1} title="Your contact information">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {field('contactName', 'Full name', { required: true, placeholder: 'Jane Smith', auto: 'name' })}
                  {field('contactTitle', 'Title', { placeholder: 'Show Manager', auto: 'organization-title' })}
                  {field('contactEmail', 'Email', { required: true, type: 'email', placeholder: 'jane@example.com', auto: 'email' })}
                  {field('contactPhone', 'Phone', { type: 'tel', placeholder: '(555) 123-4567', auto: 'tel' })}
                  {field('organization', 'Organization / company', { required: true, placeholder: 'Pacific Sportsman Shows', auto: 'organization' })}
                  {field('organizationWebsite', 'Website', { type: 'url', placeholder: 'www.example.com', auto: 'url' })}
                </div>
              </Section>

              <Section n={2} title="Event details">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {field('eventName', 'Event name', { required: true, placeholder: 'Sacramento Sportsman’s Expo 2027', wide: true, max: 160 })}
                  <div>
                    <label htmlFor="evt-eventType" className={labelClass}>Event type<Req /></label>
                    <select id="evt-eventType" value={form.eventType} onChange={set('eventType')} required className={inputClass}>
                      <option value="">Select a type…</option>
                      {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {field('dailyHours', 'Daily hours', { placeholder: 'Fri 12–8 PM, Sat 10–7, Sun 10–5' })}
                  {field('startDate', 'Start date', { required: true, type: 'date' })}
                  {field('endDate', 'End date', { required: true, type: 'date' })}
                  {field('ticketUrl', 'Ticket link', { type: 'url', placeholder: 'www.example.com/tickets' })}
                  {field('ticketPrice', 'Ticket price', { placeholder: '$15 adults, kids under 12 free' })}
                  {field('expectedAttendance', 'Expected attendance', { type: 'number', placeholder: '25000' })}
                  {field('exhibitorCount', 'Number of exhibitors', { type: 'number', placeholder: '300' })}

                  <div className="sm:col-span-2">
                    <label htmlFor="evt-shortDescription" className={labelClass}>Short description<Req /></label>
                    <input
                      id="evt-shortDescription"
                      value={form.shortDescription}
                      onChange={set('shortDescription')}
                      maxLength={SHORT_MAX}
                      required
                      placeholder="The West’s biggest fishing and boating show, with 300+ exhibitors and free seminars."
                      className={inputClass}
                    />
                    <p className={`${hintClass} flex justify-between`}>
                      <span>Shown on event cards.</span>
                      <span aria-live="polite">{form.shortDescription.length}/{SHORT_MAX}</span>
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="evt-longDescription" className={labelClass}>Full description<Opt /></label>
                    <textarea
                      id="evt-longDescription"
                      value={form.longDescription}
                      onChange={set('longDescription')}
                      maxLength={4000}
                      placeholder="Seminars, special guests, kids’ activities, parking, and anything else attendees should know."
                      className={textareaClass}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <span className={labelClass}>Fishing focus<Opt /></span>
                    <div className="flex flex-wrap gap-2">
                      {FISHING_FOCUS.map((f) => {
                        const on = focus.includes(f);
                        return (
                          <button
                            key={f}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggle(focus, setFocus, f)}
                            className={`h-9 rounded-full border px-4 text-[14px] transition ${on ? 'border-[#0E7C7B] bg-[#E3F4F4] font-medium text-[#0B6564]' : 'border-[#D9E3EC] bg-white text-[#3E5067] hover:border-[#9FB3C6]'}`}
                          >
                            {f}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {field('socialLinks', 'Social media', { placeholder: 'instagram.com/yourshow, facebook.com/yourshow', wide: true })}
                </div>
              </Section>

              <Section n={3} title="Location">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {field('venueName', 'Venue name', { required: true, placeholder: 'Cal Expo', wide: true })}
                  {field('address', 'Street address', { placeholder: '1600 Exposition Blvd', auto: 'street-address', wide: true })}
                  <div>
                    <label htmlFor="evt-country" className={labelClass}>Country<Req /></label>
                    <select
                      id="evt-country"
                      value={form.country}
                      onChange={(e) => setForm((f) => ({ ...f, country: e.target.value, state: '' }))}
                      className={inputClass}
                    >
                      {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="evt-state" className={labelClass}>{stateLabel}<Req /></label>
                    {states.length > 0 ? (
                      <select id="evt-state" value={form.state} onChange={set('state')} required className={inputClass}>
                        <option value="">Select…</option>
                        {states.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                      </select>
                    ) : (
                      <input id="evt-state" value={form.state} onChange={set('state')} required className={inputClass} />
                    )}
                  </div>
                  {field('city', 'City', { required: true, placeholder: 'Sacramento', auto: 'address-level2' })}
                  {field('zip', 'ZIP / postal code', { placeholder: '95815', auto: 'postal-code' })}
                </div>
              </Section>

              <Section n={4} title="Images" intro="Strong images get featured faster. You can also email them later.">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                  <ImagePicker
                    id="evt-logo"
                    label="Logo"
                    hint="PNG with a transparent background works best. Up to 2 MB."
                    picked={logo}
                    error={logoError}
                    aspect="aspect-square"
                    onPick={(f) => pickImage(f, 'logo')}
                    onClear={() => setLogo(null)}
                  />
                  <ImagePicker
                    id="evt-hero"
                    label="Hero image (16:9)"
                    hint={`At least ${HERO_MIN_WIDTH} × ${HERO_MIN_HEIGHT} px, up to 5 MB. Keep text and faces near the center so it crops well on phones.`}
                    picked={hero}
                    error={heroError}
                    aspect="aspect-video"
                    onPick={(f) => pickImage(f, 'hero')}
                    onClear={() => setHero(null)}
                  />
                </div>
                {hero && (
                  <div className="mt-4">
                    {field('heroAltText', 'Describe the image', { required: true, max: 250, placeholder: 'Anglers browsing bass boats on the show floor', hint: 'Used as alt text for people using screen readers.' })}
                  </div>
                )}
              </Section>

              <Section n={5} title="How would you like to be featured?" intro="Pick everything you’re interested in. We’ll reply with availability and pricing.">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {PROMO_PACKAGES.map((p) => {
                    const on = packages.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 transition ${on ? 'border-[#0E7C7B] bg-[#F1F9F9]' : 'border-[#D9E3EC] hover:border-[#9FB3C6]'}`}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(packages, setPackages, p.id)}
                          className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 accent-[#0E7C7B]"
                        />
                        <span>
                          <span className="block text-[15px] font-semibold text-[#0D1B4C]">{p.label}</span>
                          <span className="block text-[13px] leading-[18px] text-[#5F6F86]">{p.note}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {field('preferredStart', 'Preferred run start', { type: 'date' })}
                  {field('preferredEnd', 'Preferred run end', { type: 'date' })}
                  {field('billingName', 'Billing contact', { placeholder: 'If different from you' })}
                  {field('billingEmail', 'Billing email', { type: 'email', placeholder: 'billing@example.com' })}
                  {field('promoCode', 'Promo code', { placeholder: 'FOUNDING' })}
                  <div className="sm:col-span-2">
                    <label htmlFor="evt-notes" className={labelClass}>Anything else?<Opt /></label>
                    <textarea id="evt-notes" value={form.notes} onChange={set('notes')} maxLength={2000} className={textareaClass} placeholder="Budget, goals, special requests…" />
                  </div>
                </div>
              </Section>

              <Section n={6} title="Agreements">
                <div className="space-y-3 text-[14px] leading-[21px] text-[#3E5067]">
                  <label className="flex items-start gap-3">
                    <input type="checkbox" checked={agreedRights} onChange={(e) => setAgreedRights(e.target.checked)} className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 accent-[#0E7C7B]" />
                    <span>I own or have permission to use the logo, images and text I’m submitting, and HOOX may display them to promote this event.<Req /></span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)} className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 accent-[#0E7C7B]" />
                    <span>I understand HOOX reviews every submission and may edit, decline or remove listings that don’t fit its guidelines.<Req /></span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 accent-[#0E7C7B]" />
                    <span>Send me occasional HOOX updates for event organizers and advertisers.</span>
                  </label>
                </div>
              </Section>

              {error && (
                <div ref={errorRef} role="alert" className="rounded-md border border-[#F5C2BD] bg-[#FEF3F2] px-4 py-3 text-[14px] text-[#B42318]">{error}</div>
              )}

              <div className="border-t border-[#EDF1F5] pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-[50px] w-full items-center justify-center gap-3 rounded-md bg-[#0E7C7B] text-[16px] font-semibold text-white shadow-[0_4px_12px_rgba(14,124,123,0.25)] transition hover:bg-[#0B6766] disabled:opacity-60"
                >
                  {loading ? 'Sending…' : <>Submit event for review <ArrowRight className="h-5 w-5" strokeWidth={2} /></>}
                </button>
                <p className="mt-4 text-center text-[14px] text-[#536B84]">
                  Questions first? <Link href="/contact" className="font-semibold text-[#0E7C7B] hover:underline">Contact us</Link>
                </p>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
