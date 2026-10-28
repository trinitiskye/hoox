'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import AnglerProfilePage from '@/components/angler/AnglerProfilePage';
import { getAnglerProfile } from '@/lib/anglerProfile';

export default function AnglerProfileLoader({ slug }: { slug: string }) {
  const router = useRouter();
  const profile = useMemo(() => getAnglerProfile(slug), [slug]);

  useEffect(() => {
    if (profile) document.title = `${profile.name} | HOOX`;
  }, [profile]);

  return (
    <PublicLayout bgClassName="bg-hoox-mist">
      {profile ? (
        <AnglerProfilePage a={profile} />
      ) : (
        <div className="font-roboto mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
          <User className="mb-3 h-10 w-10 text-[#B7D9EB]" />
          <h1 className="text-[22px] font-bold text-[#0D1B4C]">Angler not found</h1>
          <p className="mt-1 text-[15px] text-[#68819B]">This profile may have been removed or the link is incorrect.</p>
          <button onClick={() => router.push('/leaderboards')} className="mt-5 rounded-md bg-hoox-navy px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#03385E]">
            Back to leaderboards
          </button>
        </div>
      )}
    </PublicLayout>
  );
}
