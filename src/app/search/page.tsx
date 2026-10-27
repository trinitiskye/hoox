'use client';

import { Suspense } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import SearchPage from '@/components/search/SearchPage';

// /search — tournaments & series search (filters are kept in the URL)
export default function Page() {
  return (
    <PublicLayout bgClassName="bg-[#F1F6FA]">
      <Suspense fallback={<div className="py-24" />}>
        <SearchPage />
      </Suspense>
    </PublicLayout>
  );
}
