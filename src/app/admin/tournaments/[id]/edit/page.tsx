'use client';
import { use } from 'react';
import TournamentEditor from '@/components/admin/tournaments/TournamentEditor';

export const runtime = 'edge';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TournamentEditor id={id} />;
}
