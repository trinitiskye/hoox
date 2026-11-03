'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Clock, Mail, Megaphone } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

/* /clubs/submit/success — shown after a club is submitted (and the person signed in). */

const ROLE_LABEL: Record<string, string> = { angler: 'Angler', director: 'Tournament Director' };

export default function SubmitClubSuccess() {
  const params = useSearchParams();
  const { currentUser } = useAuth();
  const club = (params.get('club') || '').slice(0, 160);
  const newRole = params.get('new');

  const NEXT = [
    { icon: Clock, title: 'We review your listing', text: 'Our team checks the details, usually within a few business days.' },
    { icon: Mail, title: 'You’ll get an email', text: `We’ll write to ${currentUser?.email || 'you'} when your club is live or if we have questions.` },
    { icon: Megaphone, title: 'Want more members?', text: 'Featured clubs appear at the top of the directory and on the home page.' },
  ];

  return (
    <section className="font-roboto mx-auto max-w-[760px] px-4 py-14 sm:py-20">
      <div className="rounded-lg border border-[#E8EEF4] bg-white px-6 py-10 text-center shadow-[0_2px_10px_rgba(10,30,60,0.06)] sm:px-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E6F4F5] text-[#0E7C7B]">
          <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#14889A]">Club submitted</p>
        <h1 className="mt-2 font-montserrat text-[28px] font-bold leading-tight text-[#0D1B4C] sm:text-[34px]">
          {club ? <>Thanks for submitting {club}!</> : 'Thanks for submitting your club!'}
        </h1>
        {newRole && ROLE_LABEL[newRole] ? (
          <p className="mx-auto mt-4 max-w-[540px] text-[16px] leading-relaxed text-[#536B84]">
            Welcome to HOOX{currentUser ? `, ${currentUser.name.split(' ')[0]}` : ''}. Your {ROLE_LABEL[newRole]} account is ready and you’re signed in.
          </p>
        ) : currentUser ? (
          <p className="mx-auto mt-4 max-w-[540px] text-[16px] leading-relaxed text-[#536B84]">
            You’re signed in as <strong className="text-[#0D1B4C]">{currentUser.name}</strong>. Your club is in our review queue.
          </p>
        ) : null}

        <ul className="mx-auto mt-8 max-w-[520px] space-y-4 text-left">
          {NEXT.map((n) => (
            <li key={n.title} className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#F1F6FA] text-[#0E7C7B]">
                <n.icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-[#0D1B4C]">{n.title}</span>
                <span className="block text-[14px] leading-[20px] text-[#5F6F86]">{n.text}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/clubs" className="flex h-[46px] items-center justify-center gap-2 rounded-md bg-[#0E7C7B] px-6 text-[15px] font-semibold text-white transition hover:bg-[#0B6766]">
            Browse clubs <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
          <Link href="/clubs/feature" className="flex h-[46px] items-center justify-center rounded-md border border-[#1FA3A6] px-6 text-[15px] font-medium text-[#0E7C7B] transition hover:bg-[#F1F9F9]">
            Feature your club
          </Link>
          <Link href="/clubs/submit" className="flex h-[46px] items-center justify-center rounded-md px-6 text-[15px] font-medium text-[#0E7C7B] hover:underline">
            Submit another club
          </Link>
        </div>
      </div>
    </section>
  );
}
