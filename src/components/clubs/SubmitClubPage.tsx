'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, LogOut, ShieldCheck, Users, MapPin, Megaphone, UserPlus, X, Fish, ClipboardList } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import ImagePicker, { loadImage, type Picked } from '@/components/ui/ImagePicker';
import { COUNTRIES, getStatesForCountry } from '@/lib/addressData';
import {
  CLUB_STYLES,
  CLUB_LEVELS,
  CLUB_ROLES,
  CLUB_SUBMIT_ROLES,
  IMAGE_TYPES,
  CLUB_LOGO_MAX_BYTES,
  CLUB_COVER_MAX_BYTES,
  CLUB_COVER_MIN_WIDTH,
  CLUB_ABOUT_MAX,
  PASSWORD_MIN,
  isEmail,
  type ClubSignupRole,
} from '@/lib/clubSubmission';
import type { User } from '@/types';

/* ------------------------------------------------------------------ */
/* /clubs/submit — sign in (or Google) at the top, club form below.    */
/* Only Anglers and Tournament Directors can list a club. If the email */
/* has no account, we ask before creating one with those credentials.  */
/* ------------------------------------------------------------------ */

const inputClass =
  'h-[48px] w-full rounded-md border border-[#D9E3EC] bg-white px-4 text-[15px] text-[#1F2D3D] placeholder:text-[#7D8BA0] shadow-[0_1px_3px_rgba(10,30,60,0.04)] focus:border-hoox-ui focus:outline-none focus:ring-2 focus:ring-hoox-ui/40';
const textareaClass = inputClass.replace('h-[48px]', 'min-h-[120px] py-3 leading-[22px]');
const labelClass = 'mb-1.5 block text-[14px] font-medium text-[#0D1B4C]';
const hintClass = 'mt-1.5 text-[13px] leading-[18px] text-[#6B7D93]';

const ROLE_LABEL: Record<string, string> = {
  angler: 'Angler', director: 'Tournament Director', admin: 'Admin', judge: 'Judge', sponsor: 'Partner',
};
const canSubmit = (u: User | null) => !!u && (CLUB_SUBMIT_ROLES as readonly string[]).includes(u.role);

function Req() { return <span className="text-[#B42318]"> *</span>; }
function Opt() { return <span className="font-normal text-[#7A8BA3]"> (optional)</span>; }

function Section({ n, title, intro, children }: { n: number; title: string; intro?: string; children: React.ReactNode }) {
  const id = `club-section-${n}`;
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

const EMPTY = {
  clubName: '', species: '', skillLevel: '', schedule: '', memberCount: '', membership: '', dues: '', about: '',
  country: 'US', state: '', city: '',
  website: '', contactEmail: '', contactPhone: '', socialLinks: '', clubRole: '',
  website_url: '', // honeypot
};
type FormState = typeof EMPTY;
type Key = keyof FormState;

export default function SubmitClubPage() {
  const router = useRouter();
  const { currentUser, login, logout, loading: authLoading } = useAuth();

  // Sign-in
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [credError, setCredError] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [googleNoAccount, setGoogleNoAccount] = useState(false);
  const [googleSignupRole, setGoogleSignupRole] = useState<ClubSignupRole | null>(null);

  // Club form
  const [form, setForm] = useState<FormState>(EMPTY);
  const [styles, setStyles] = useState<string[]>([]);
  const [logo, setLogo] = useState<Picked>(null);
  const [cover, setCover] = useState<Picked>(null);
  const [logoError, setLogoError] = useState('');
  const [coverError, setCoverError] = useState('');
  const [authorized, setAuthorized] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [askCreate, setAskCreate] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const signInRef = useRef<HTMLDivElement>(null);

  const signedIn = canSubmit(currentUser);
  const states = getStatesForCountry(form.country);
  const stateLabel = COUNTRIES.find((c) => c.code === form.country)?.stateLabel || 'State / Province';

  useEffect(() => () => { if (logo) URL.revokeObjectURL(logo.preview); }, [logo]);
  useEffect(() => () => { if (cover) URL.revokeObjectURL(cover.preview); }, [cover]);

  const set = (k: Key) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const showError = (msg: string, scrollTo: 'error' | 'signin' = 'error') => {
    setError(msg);
    requestAnimationFrame(() =>
      (scrollTo === 'signin' ? signInRef.current : errorRef.current)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    );
  };

  const pickImage = async (file: File | undefined, kind: 'logo' | 'cover') => {
    const setErr = kind === 'logo' ? setLogoError : setCoverError;
    const setPicked = kind === 'logo' ? setLogo : setCover;
    setErr('');
    if (!file) return;
    if (!IMAGE_TYPES[file.type]) { setErr('Use a JPG, PNG, or WebP image.'); return; }
    const max = kind === 'logo' ? CLUB_LOGO_MAX_BYTES : CLUB_COVER_MAX_BYTES;
    if (file.size > max) { setErr(`File must be ${max / 1024 / 1024} MB or smaller.`); return; }
    try {
      const img = await loadImage(file);
      if (kind === 'cover' && (img.width < CLUB_COVER_MIN_WIDTH || img.width < img.height)) {
        URL.revokeObjectURL(img.preview);
        setErr(`Use a landscape photo at least ${CLUB_COVER_MIN_WIDTH} px wide. Yours is ${img.width} × ${img.height}.`);
        return;
      }
      setPicked({ file, ...img });
    } catch {
      setErr('That image couldn’t be read. Try exporting it again as JPG or PNG.');
    }
  };

  const onGoogleUser = (u: User) => {
    setGoogleError(''); setGoogleNoAccount(false); setGoogleSignupRole(null);
    login(u);
    setError('');
  };
  const onGoogleError = (msg: string) => {
    if (/no hoox account/i.test(msg)) { setGoogleNoAccount(true); setGoogleError(''); return; }
    setGoogleError(msg);
  };

  const validate = (): { msg: string; where?: 'signin' } | null => {
    if (!signedIn) {
      if (!email.trim() || !password) return { msg: 'Sign in with Google, or enter your email and password at the top.', where: 'signin' };
      if (!isEmail(email.trim())) return { msg: 'Enter a valid email address.', where: 'signin' };
    }
    const missing: string[] = [];
    if (!form.clubName.trim()) missing.push('Club name');
    if (styles.length === 0) missing.push('Fishing style');
    if (!form.about.trim()) missing.push('About the club');
    if (!form.state.trim()) missing.push(stateLabel);
    if (!form.city.trim()) missing.push('City');
    if (missing.length) return { msg: `Please fill in: ${missing.join(', ')}.` };
    if (form.contactEmail.trim() && !isEmail(form.contactEmail.trim())) return { msg: 'Club contact email must be a valid email address.' };
    if (!authorized) return { msg: 'Please confirm you’re authorized to list this club.' };
    return null;
  };

  const submit = async (account?: { role: ClubSignupRole; name: string }) => {
    setError(''); setCredError('');
    const problem = validate();
    if (problem) { showError(problem.msg, problem.where); return; }

    const body = new FormData();
    (Object.keys(form) as Key[]).forEach((k) => body.append(k, form[k]));
    styles.forEach((s) => body.append('styles', s));
    body.append('agreedAuthorized', String(authorized));
    if (logo) body.append('logo', logo.file);
    if (cover) body.append('coverImage', cover.file);
    if (!signedIn) {
      body.append('email', email.trim());
      body.append('password', password);
    }
    if (account) {
      body.append('createAccount', 'true');
      body.append('accountRole', account.role);
      body.append('accountName', account.name);
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/club-submissions', { method: 'POST', body });
      const json = await res.json().catch(() => ({}));

      if (json.ok && json.user) {
        setAskCreate(false);
        login(json.user as User);
        const q = new URLSearchParams({ club: form.clubName.trim() });
        if (json.created) q.set('new', json.user.role);
        router.push(`/clubs/submit/success?${q.toString()}`);
        return;
      }

      switch (json.code) {
        case 'not_found':
          setAskCreate(true);
          return;
        case 'wrong_password':
        case 'invalid_credentials':
          setAskCreate(false);
          setCredError(json.error);
          showError(json.error, 'signin');
          return;
        case 'auth_required':
          // Local sign-in is stale (server session expired) — ask for credentials again.
          logout();
          showError('Your session expired. Please sign in again to submit your club.', 'signin');
          return;
        default:
          if (account && json.code === 'invalid') {
            // Shown inside the create-account dialog
            throw new Error(json.error);
          }
          setAskCreate(false);
          showError(json.error || 'Something went wrong. Please try again.');
      }
    } catch (e) {
      if (account && e instanceof Error && e.message) throw e;
      showError('We couldn’t reach HOOX. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (k: Key, label: string, o: { type?: string; placeholder?: string; required?: boolean; auto?: string; hint?: string; wide?: boolean; max?: number } = {}) => (
    <div className={o.wide ? 'sm:col-span-2' : ''}>
      <label htmlFor={`club-${k}`} className={labelClass}>{label}{o.required ? <Req /> : <Opt />}</label>
      <input
        id={`club-${k}`}
        type={o.type || 'text'}
        value={form[k]}
        onChange={set(k)}
        placeholder={o.placeholder}
        autoComplete={o.auto || 'off'}
        maxLength={o.max}
        required={o.required}
        className={inputClass}
      />
      {o.hint && <p className={hintClass}>{o.hint}</p>}
    </div>
  );

  const BENEFITS = [
    { icon: Users, title: 'Grow your membership', text: 'Anglers searching for a club near them find yours in the directory.' },
    { icon: MapPin, title: 'On the club map', text: 'Your club appears on the HOOX club map by location.' },
    { icon: Megaphone, title: 'Ready to be featured', text: 'Listed clubs can upgrade to featured placement anytime.' },
  ];

  return (
    <div className="font-roboto">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-start gap-6 px-4 pb-12 pt-8 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:px-[42px] lg:pt-[34px]">
        {/* Why list your club */}
        <aside className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#0A2A47] via-[#0B3552] to-[#0E5A6E] px-6 py-8 text-white shadow-[0_6px_20px_rgba(5,30,60,0.18)] sm:px-8 lg:sticky lg:top-[100px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E4F63] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.03em] text-[#3FD6D0]">
            <Fish className="h-3.5 w-3.5" strokeWidth={2.25} /> For Clubs
          </span>
          <h1 className="mt-4 font-montserrat text-[30px] font-bold leading-[1.15] sm:text-[36px]">Submit a club</h1>
          <p className="mt-3 text-[16px] leading-[25px] text-white/90">
            List your fishing club in the HOOX directory so anglers near you can find it and join.
          </p>
          <ul className="mt-6 space-y-4">
            {BENEFITS.map((b) => (
              <li key={b.title} className="flex items-start gap-3.5">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#3FD6D0]">
                  <b.icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold">{b.title}</span>
                  <span className="block text-[14px] leading-[20px] text-white/80">{b.text}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex items-start gap-3 rounded-md bg-white/10 p-4 text-[14px] leading-[20px] text-white/90">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#3FD6D0]" />
            <span>You need an <strong>Angler</strong> or <strong>Tournament Director</strong> account to list a club. New to HOOX? We’ll offer to create one when you submit.</span>
          </div>
        </aside>

        <section aria-label="Submit a club" className="rounded-lg border border-[#E8EEF4] bg-white p-5 shadow-[0_2px_10px_rgba(10,30,60,0.06)] sm:p-8">
          <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-6">
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="club-website_url">Leave this empty</label>
              <input id="club-website_url" tabIndex={-1} autoComplete="off" value={form.website_url} onChange={set('website_url')} />
            </div>

            {/* 1. Sign in */}
            <div ref={signInRef}>
              <Section n={1} title={signedIn ? 'Your account' : 'Sign in to your account'}>
                {authLoading ? (
                  <div className="h-[48px] animate-pulse rounded-md bg-[#F0F4F8]" />
                ) : signedIn && currentUser ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#CFE8E8] bg-[#F1F9F9] px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold text-[#0D1B4C]">{currentUser.name}</div>
                      <div className="truncate text-[13px] text-[#5F6F86]">{currentUser.email} · {ROLE_LABEL[currentUser.role] || currentUser.role}</div>
                    </div>
                    <button type="button" onClick={logout} className="flex items-center gap-1.5 text-[14px] font-medium text-[#0E7C7B] hover:underline">
                      <LogOut className="h-4 w-4" /> Not you? Sign out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentUser && !signedIn && (
                      <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#F7D9A8] bg-[#FFF8EC] px-4 py-3 text-[14px] text-[#7A4B00]">
                        <span>You’re signed in as a {ROLE_LABEL[currentUser.role] || currentUser.role}. Club listings need an Angler or Tournament Director account.</span>
                        <button type="button" onClick={logout} className="font-semibold underline">Use a different account</button>
                      </div>
                    )}

                    {googleSignupRole ? (
                      <div>
                        <GoogleSignInButton key={googleSignupRole} mode="signup" role={googleSignupRole} onUser={onGoogleUser} onError={onGoogleError} />
                        <p className="mt-2 text-center text-[13px] text-[#5F6F86]">
                          Creating a {ROLE_LABEL[googleSignupRole]} account with Google.{' '}
                          <button type="button" onClick={() => setGoogleSignupRole(null)} className="font-medium text-[#0E7C7B] hover:underline">Cancel</button>
                        </p>
                      </div>
                    ) : (
                      <GoogleSignInButton mode="signin" onUser={onGoogleUser} onError={onGoogleError} />
                    )}
                    {googleError && <p role="alert" className="text-center text-[13px] text-[#B42318]">{googleError}</p>}
                    {googleNoAccount && !googleSignupRole && (
                      <div role="status" className="rounded-md border border-[#D9E3EC] bg-[#F7FAFC] p-4 text-[14px] text-[#3E5067]">
                        <p>No HOOX account uses that Google email yet. Want to create one with Google?</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(['angler', 'director'] as ClubSignupRole[]).map((r) => (
                            <button key={r} type="button" onClick={() => setGoogleSignupRole(r)} className="rounded-md border border-[#1FA3A6] bg-white px-4 py-2 text-[14px] font-medium text-[#0E7C7B] hover:bg-[#F1F9F9]">
                              Create {ROLE_LABEL[r]} account
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[13px] font-medium text-[#7A8BA3]" aria-hidden>
                      <span className="h-px flex-1 bg-[#E3EAF1]" /> or use your email <span className="h-px flex-1 bg-[#E3EAF1]" />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="club-email" className={labelClass}>Email<Req /></label>
                        <input id="club-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setCredError(''); }} autoComplete="email" placeholder="you@example.com" className={inputClass} aria-invalid={!!credError} />
                      </div>
                      <div>
                        <label htmlFor="club-password" className={labelClass}>Password<Req /></label>
                        <div className="relative">
                          <input id="club-password" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setCredError(''); }} autoComplete="current-password" placeholder="Your HOOX password" className={`${inputClass} pr-11 ${credError ? 'border-[#F04438]' : ''}`} aria-invalid={!!credError} aria-describedby={credError ? 'club-cred-error' : undefined} />
                          <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#5F7896] hover:text-[#0D1B4C]">
                            {showPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    {credError ? (
                      <p id="club-cred-error" role="alert" className="text-[13px] text-[#B42318]">
                        {credError} <Link href="/forgot-password" className="font-semibold underline">Forgot password?</Link>
                      </p>
                    ) : (
                      <p className={hintClass}>
                        You’ll be signed in when you submit. New to HOOX? Enter the email and password you’d like to use.{' '}
                        <Link href="/forgot-password" className="font-medium text-[#0E7C7B] hover:underline">Forgot password?</Link>
                      </p>
                    )}
                  </div>
                )}
              </Section>
            </div>

            {/* 2. Club details */}
            <Section n={2} title="Club details">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {field('clubName', 'Club name', { required: true, placeholder: 'Sierra Foothills Bass Club', wide: true, max: 160 })}
                <div className="sm:col-span-2">
                  <span className={labelClass}>Fishing style<Req /></span>
                  <div className="flex flex-wrap gap-2">
                    {CLUB_STYLES.map((s) => {
                      const on = styles.includes(s);
                      return (
                        <button key={s} type="button" aria-pressed={on} onClick={() => setStyles(on ? styles.filter((x) => x !== s) : [...styles, s])}
                          className={`h-9 rounded-full border px-4 text-[14px] transition ${on ? 'border-[#0E7C7B] bg-[#E3F4F4] font-medium text-[#0B6564]' : 'border-[#D9E3EC] bg-white text-[#3E5067] hover:border-[#9FB3C6]'}`}>
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {field('species', 'Target species', { placeholder: 'Largemouth bass, trout, stripers', wide: true })}
                <div>
                  <label htmlFor="club-skillLevel" className={labelClass}>Skill level<Opt /></label>
                  <select id="club-skillLevel" value={form.skillLevel} onChange={set('skillLevel')} className={inputClass}>
                    <option value="">Select…</option>
                    {CLUB_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                {field('schedule', 'Meeting schedule', { placeholder: 'Monthly meetings, weekly outings' })}
                {field('memberCount', 'Number of members', { type: 'number', placeholder: '45' })}
                <div>
                  <span className={labelClass}>Membership<Opt /></span>
                  <div className="flex h-[48px] items-center gap-5">
                    {[['free', 'Free'], ['paid', 'Paid dues']].map(([v, l]) => (
                      <label key={v} className="flex items-center gap-2 text-[15px] text-[#1F2D3D]">
                        <input type="radio" name="membership" value={v} checked={form.membership === v} onChange={set('membership')} className="h-[18px] w-[18px] accent-[#0E7C7B]" /> {l}
                      </label>
                    ))}
                  </div>
                </div>
                {form.membership === 'paid' && field('dues', 'Dues', { placeholder: '$40 / year', wide: true })}
                <div className="sm:col-span-2">
                  <label htmlFor="club-about" className={labelClass}>About the club<Req /></label>
                  <textarea id="club-about" value={form.about} onChange={set('about')} maxLength={CLUB_ABOUT_MAX} required className={textareaClass}
                    placeholder="Who you are, where you fish, and what new members can expect." />
                  <p className={`${hintClass} flex justify-between`}><span>Shown on your club card and page.</span><span aria-live="polite">{form.about.length}/{CLUB_ABOUT_MAX}</span></p>
                </div>
              </div>
            </Section>

            {/* 3. Location */}
            <Section n={3} title="Location">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="club-country" className={labelClass}>Country<Req /></label>
                  <select id="club-country" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value, state: '' }))} className={inputClass}>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="club-state" className={labelClass}>{stateLabel}<Req /></label>
                  {states.length > 0 ? (
                    <select id="club-state" value={form.state} onChange={set('state')} required className={inputClass}>
                      <option value="">Select…</option>
                      {states.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                    </select>
                  ) : (
                    <input id="club-state" value={form.state} onChange={set('state')} required className={inputClass} />
                  )}
                </div>
                {field('city', 'City', { required: true, placeholder: 'Folsom', auto: 'address-level2' })}
              </div>
            </Section>

            {/* 4. Contact & links */}
            <Section n={4} title="Contact & links">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {field('website', 'Club website', { type: 'url', placeholder: 'www.yourclub.com' })}
                {field('contactEmail', 'Club contact email', { type: 'email', placeholder: 'info@yourclub.com', hint: 'Leave blank to use your account email.' })}
                {field('contactPhone', 'Phone', { type: 'tel', placeholder: '(555) 123-4567' })}
                <div>
                  <label htmlFor="club-clubRole" className={labelClass}>Your role in the club<Opt /></label>
                  <select id="club-clubRole" value={form.clubRole} onChange={set('clubRole')} className={inputClass}>
                    <option value="">Select…</option>
                    {CLUB_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                {field('socialLinks', 'Social media', { placeholder: 'facebook.com/yourclub, instagram.com/yourclub', wide: true })}
              </div>
            </Section>

            {/* 5. Images */}
            <Section n={5} title="Images" intro="Clubs with a logo and photo get far more clicks.">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <ImagePicker id="club-logo" label="Logo" hint="Square PNG or JPG, up to 2 MB." picked={logo} error={logoError} aspect="aspect-square"
                  onPick={(f) => pickImage(f, 'logo')} onClear={() => setLogo(null)} />
                <ImagePicker id="club-cover" label="Cover photo" hint={`Landscape, at least ${CLUB_COVER_MIN_WIDTH} px wide, up to 5 MB.`} picked={cover} error={coverError} aspect="aspect-video"
                  onPick={(f) => pickImage(f, 'cover')} onClear={() => setCover(null)} />
              </div>
            </Section>

            {/* 6. Agreement */}
            <Section n={6} title="Agreement">
              <label className="flex items-start gap-3 text-[14px] leading-[21px] text-[#3E5067]">
                <input type="checkbox" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 accent-[#0E7C7B]" />
                <span>I’m authorized to list this club, and I have permission to use the logo and photo I’m submitting. HOOX reviews every listing before it goes live.<Req /></span>
              </label>
            </Section>

            {error && (
              <div ref={errorRef} role="alert" className="rounded-md border border-[#F5C2BD] bg-[#FEF3F2] px-4 py-3 text-[14px] text-[#B42318]">{error}</div>
            )}

            <div className="border-t border-[#EDF1F5] pt-6">
              <button type="submit" disabled={submitting}
                className="flex h-[50px] w-full items-center justify-center gap-3 rounded-md bg-[#0E7C7B] text-[16px] font-semibold text-white shadow-[0_4px_12px_rgba(14,124,123,0.25)] transition hover:bg-[#0B6766] disabled:opacity-60">
                {submitting ? 'Submitting…' : <>{signedIn ? 'Submit club' : 'Sign in & submit club'} <ArrowRight className="h-5 w-5" strokeWidth={2} /></>}
              </button>
            </div>
          </form>
        </section>
      </div>

      {askCreate && (
        <CreateAccountDialog
          email={email.trim()}
          password={password}
          onCancel={() => setAskCreate(false)}
          onCreate={(role, name) => submit({ role, name })}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* "No account — create one with these credentials?"                   */
/* ------------------------------------------------------------------ */
function CreateAccountDialog({
  email, password, onCancel, onCreate,
}: {
  email: string;
  password: string;
  onCancel: () => void;
  onCreate: (role: ClubSignupRole, name: string) => Promise<void>;
}) {
  const [role, setRole] = useState<ClubSignupRole | null>(null);
  const [name, setName] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [busy, onCancel]);

  const go = async () => {
    setErr('');
    if (!role) { setErr('Choose an account type.'); return; }
    if (!name.trim()) { setErr('Enter your full name.'); return; }
    if (password.length < PASSWORD_MIN) { setErr(`Your password must be at least ${PASSWORD_MIN} characters. Close this and choose a longer one.`); return; }
    if (confirm !== password) { setErr('Passwords don’t match. Re-enter the password you typed above.'); return; }
    setBusy(true);
    try {
      await onCreate(role, name.trim());
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const OPTIONS: { r: ClubSignupRole; icon: typeof Fish; title: string; text: string }[] = [
    { r: 'angler', icon: Fish, title: 'Angler', text: 'Join tournaments, log catches, follow clubs.' },
    { r: 'director', icon: ClipboardList, title: 'Tournament Director', text: 'Run tournaments, series and clubs.' },
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-[#0A1A2E]/60 p-0 sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="create-acct-title" className="font-roboto max-h-[92vh] w-full max-w-[520px] overflow-y-auto rounded-t-xl bg-white p-6 shadow-2xl sm:rounded-xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E6F4F5] text-[#0E7C7B]"><UserPlus className="h-5 w-5" /></span>
            <h2 id="create-acct-title" className="font-montserrat text-[20px] font-bold text-[#0D1B4C]">Create a HOOX account?</h2>
          </div>
          <button type="button" onClick={onCancel} disabled={busy} aria-label="Close" className="rounded p-1 text-[#5F7896] hover:text-[#0D1B4C]"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-3 text-[15px] leading-[23px] text-[#3E5067]">
          No account uses <strong className="text-[#0D1B4C]">{email}</strong> yet. We can create one with the email and password you entered, then submit your club.
        </p>

        <fieldset className="mt-5">
          <legend className={labelClass}>Account type<Req /></legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {OPTIONS.map((o, i) => (
              <button key={o.r} ref={i === 0 ? firstRef : undefined} type="button" aria-pressed={role === o.r} onClick={() => setRole(o.r)}
                className={`flex items-start gap-3 rounded-md border p-3.5 text-left transition ${role === o.r ? 'border-[#0E7C7B] bg-[#F1F9F9] ring-1 ring-[#0E7C7B]' : 'border-[#D9E3EC] hover:border-[#9FB3C6]'}`}>
                <o.icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0E7C7B]" />
                <span>
                  <span className="block text-[15px] font-semibold text-[#0D1B4C]">{o.title}</span>
                  <span className="block text-[13px] leading-[18px] text-[#5F6F86]">{o.text}</span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="create-name" className={labelClass}>Full name<Req /></label>
            <input id="create-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Jane Smith" className={inputClass} />
          </div>
          <div>
            <label htmlFor="create-confirm" className={labelClass}>Confirm password<Req /></label>
            <input id="create-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" placeholder="Re-enter your password" className={inputClass}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } }} />
          </div>
        </div>

        {err && <div role="alert" className="mt-4 rounded-md border border-[#F5C2BD] bg-[#FEF3F2] px-4 py-3 text-[14px] text-[#B42318]">{err}</div>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={busy} className="h-[46px] rounded-md border border-[#D9E3EC] px-5 text-[15px] font-medium text-[#2E3F5C] hover:bg-[#F5F8FB]">
            No, use a different email
          </button>
          <button type="button" onClick={go} disabled={busy} className="flex h-[46px] items-center justify-center gap-2 rounded-md bg-[#0E7C7B] px-5 text-[15px] font-semibold text-white hover:bg-[#0B6766] disabled:opacity-60">
            {busy ? 'Creating account…' : 'Create account & submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
