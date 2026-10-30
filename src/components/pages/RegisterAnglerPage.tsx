'use client';

import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Fish, Search, Ticket, Camera, Trophy } from 'lucide-react';
import { registerAngler } from '@/lib/auth';
import { User } from '@/types';
import AddressSelector, { AddressValue } from '@/components/ui/AddressSelector';

interface RegisterAnglerPageProps {
  onNavigate: (view: string) => void;
  onLogin: (user: User) => void;
}

/** Numbered form section (divider above every section after the first) */
function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  const id = `ang-section-${n}`;
  return (
    <fieldset aria-labelledby={id} className={n > 1 ? 'border-t border-[#EDF1F5] pt-6' : ''}>
      <h2 id={id} className="flex items-center gap-3 font-montserrat text-[18px] font-bold text-[#0D1B4C]">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0E7C7B] text-[13px] text-white">{n}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </fieldset>
  );
}

export default function RegisterAnglerPage({ onNavigate, onLogin }: RegisterAnglerPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', organization: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [address, setAddress] = useState<AddressValue>({
    address: '', country: 'US', state: '', city: '', zip: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError('');
    if (!form.name || !form.email || !form.password) { setError('Name, email, and password are required.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { user, error: err } = await registerAngler({ ...form, ...address });
    setLoading(false);
    if (err) { setError(err); return; }
    if (user) { onLogin(user); onNavigate('home'); }
  };

  // Brand form styles (shared with AddressSelector)
  const inputClass =
    'h-[48px] w-full rounded-md border border-[#D9E3EC] bg-white px-4 text-[15px] text-[#1F2D3D] placeholder:text-[#7D8BA0] shadow-[0_1px_3px_rgba(10,30,60,0.04)] focus:border-hoox-ui focus:outline-none focus:ring-2 focus:ring-hoox-ui/40';
  const labelClass = 'mb-1.5 block text-[14px] font-medium text-[#0D1B4C]';

  // Plain render function (not a component) so inputs keep focus while typing
  const passwordField = (k: 'password' | 'confirmPassword', label: string, placeholder: string, show: boolean, toggle: () => void) => (
    <div>
      <label htmlFor={`ang-${k}`} className={labelClass}>{label} <span className="text-[#B42318]">*</span></label>
      <div className="relative">
        <input
          id={`ang-${k}`}
          type={show ? 'text' : 'password'}
          value={form[k]}
          onChange={set(k)}
          placeholder={placeholder}
          autoComplete="new-password"
          className={`${inputClass} pr-11`}
        />
        <button type="button" onClick={toggle} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#5F7896] hover:text-[#0D1B4C]">
          {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>
    </div>
  );

  const PROFILE_FIELDS: { key: 'name' | 'organization' | 'email' | 'phone'; label: string; placeholder: string; type?: string; required?: boolean; optional?: boolean; auto?: string }[] = [
    { key: 'name', label: 'Full name', placeholder: 'David Chen', required: true, auto: 'name' },
    { key: 'organization', label: 'Club / team', placeholder: 'Lakeview Bass Club', optional: true, auto: 'organization' },
    { key: 'email', label: 'Email', placeholder: 'david.chen@example.com', type: 'email', required: true, auto: 'email' },
    { key: 'phone', label: 'Phone number', placeholder: '(555) 123-4567', type: 'tel', auto: 'tel' },
  ];

  const BENEFITS = [
    { icon: Search, title: 'Find tournaments & series', text: 'Search by location, species and date, or see what’s near you.' },
    { icon: Ticket, title: 'Quick registration', text: 'Enter solo or as a team and pay your entry online.' },
    { icon: Camera, title: 'Submit catches', text: 'Photo on the board with the tournament code on your hand.' },
    { icon: Trophy, title: 'Live standings & results', text: 'Follow the leaderboard and build your angler profile.' },
  ];

  return (
    <div className="font-roboto">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-start gap-6 px-4 pb-12 pt-8 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:px-[42px] lg:pt-[34px]">
        {/* Why HOOX for anglers */}
        <aside className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#0A2A47] via-[#0B3552] to-[#0E5A6E] px-6 py-8 text-white shadow-[0_6px_20px_rgba(5,30,60,0.18)] sm:px-8 lg:sticky lg:top-[100px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E4F63] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.03em] text-[#3FD6D0]">
            <Fish className="h-3.5 w-3.5" strokeWidth={2.25} /> For Anglers
          </span>
          <h1 className="mt-4 font-montserrat text-[30px] font-bold leading-[1.15] sm:text-[36px]">Create your angler account</h1>
          <p className="mt-3 text-[16px] leading-[25px] text-white/90">
            Join tournaments, submit your catches and track your results, all in one place.
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
          <p className="mt-8 border-t border-white/15 pt-5 text-[14px] text-white/80">
            Running a tournament?{' '}
            <button type="button" onClick={() => onNavigate('register-director')} className="font-semibold text-[#3FD6D0] hover:underline">
              Create a director account
            </button>
          </p>
        </aside>

        {/* Form */}
        <section aria-label="Angler registration form" className="rounded-lg border border-[#E8EEF4] bg-white p-5 shadow-[0_2px_10px_rgba(10,30,60,0.06)] sm:p-8">
          <form
            noValidate
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="space-y-6"
          >
            <Section n={1} title="Profile information">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {PROFILE_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label htmlFor={`ang-${f.key}`} className={labelClass}>
                      {f.label} {f.required ? <span className="text-[#B42318]">*</span> : f.optional && <span className="font-normal text-[#7A8BA3]">(optional)</span>}
                    </label>
                    <input
                      id={`ang-${f.key}`}
                      type={f.type || 'text'}
                      value={form[f.key]}
                      onChange={set(f.key)}
                      placeholder={f.placeholder}
                      autoComplete={f.auto}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </Section>

            <Section n={2} title="Address">
              <AddressSelector value={address} onChange={setAddress} inputClass={inputClass} labelClass={labelClass} required />
            </Section>

            <Section n={3} title="Password">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {passwordField('password', 'Password', 'At least 6 characters', showPassword, () => setShowPassword((v) => !v))}
                {passwordField('confirmPassword', 'Confirm password', 'Re-enter your password', showConfirm, () => setShowConfirm((v) => !v))}
              </div>
            </Section>

            {error && (
              <div role="alert" className="rounded-md border border-[#F5C2BD] bg-[#FEF3F2] px-4 py-3 text-[14px] text-[#B42318]">{error}</div>
            )}

            <div className="border-t border-[#EDF1F5] pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex h-[50px] w-full items-center justify-center gap-3 rounded-md bg-[#0E7C7B] text-[16px] font-semibold text-white shadow-[0_4px_12px_rgba(14,124,123,0.25)] transition hover:bg-[#0B6766] disabled:opacity-60"
              >
                {loading ? 'Creating account…' : <>Create angler account <ArrowRight className="h-5 w-5" strokeWidth={2} /></>}
              </button>
              <p className="mt-4 text-center text-[14px] text-[#536B84]">
                Already have an account?{' '}
                <button type="button" onClick={() => onNavigate('login')} className="font-semibold text-[#0E7C7B] hover:underline">Log in</button>
              </p>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
