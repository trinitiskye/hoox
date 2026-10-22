'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trophy } from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import EventDetailPage from '@/components/event/EventDetailPage';
import { toPath } from '@/lib/routes';
import {
  getTournamentById, getUserById, getRegistrationsByTournament, dbTournamentToApp, dbUserToApp,
} from '@/lib/supabase';
import { DEMO_EVENT, DEMO_EVENT_ID, eventFromTournament, type EventDetail } from '@/lib/eventDetail';

export default function EventDetailLoader({ id }: { id: string }) {
  const router = useRouter();
  const navigate = (view: string) => router.push(toPath(view));
  const [event, setEvent] = useState<EventDetail | null | 'missing'>(id === DEMO_EVENT_ID ? DEMO_EVENT : null);

  useEffect(() => {
    if (id === DEMO_EVENT_ID) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getTournamentById(encodeURIComponent(id));
        const row = data?.[0];
        if (!row) {
          if (!cancelled) setEvent('missing');
          return;
        }
        const t = dbTournamentToApp(row);
        const [hostRes, regRes] = await Promise.all([
          t.createdBy ? getUserById(t.createdBy).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
          getRegistrationsByTournament(t.id).catch(() => ({ data: null })),
        ]);
        const hostRow = hostRes.data?.[0];
        const host = hostRow ? dbUserToApp(hostRow) : null;
        if (!cancelled) setEvent(eventFromTournament(t, host, regRes.data ? regRes.data.length : undefined));
      } catch {
        if (!cancelled) setEvent('missing');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (event && event !== 'missing') document.title = `${event.name} | HOOX`;
  }, [event]);

  return (
    <PublicLayout bgClassName="bg-hoox-mist">
      {event === null ? (
        <div className="font-roboto flex min-h-[60vh] items-center justify-center text-[#7586A0]">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading tournament…
        </div>
      ) : event === 'missing' ? (
        <div className="font-roboto mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
          <Trophy className="mb-3 h-10 w-10 text-[#B7D9EB]" />
          <h1 className="text-[22px] font-bold text-[#0D1B4C]">Tournament not found</h1>
          <p className="mt-1 text-[15px] text-[#68819B]">It may have been removed or the link is incorrect.</p>
          <button onClick={() => navigate('tournaments')} className="mt-5 rounded-md bg-hoox-navy px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#03385E]">
            Browse tournaments
          </button>
        </div>
      ) : (
        <EventDetailPage e={event} onNavigate={navigate} />
      )}
    </PublicLayout>
  );
}
