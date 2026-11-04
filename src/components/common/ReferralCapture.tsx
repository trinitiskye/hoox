'use client';

// Remembers an affiliate referral code from the URL (?ref=CODE) in a cookie,
// so a tournament director who signs up later is credited to that affiliate.
// The first link wins: a later ?ref= doesn't overwrite an earlier one.

import { useEffect } from 'react';
import { REF_COOKIE, REF_PARAM, CODE_RE } from '@/lib/affiliates';

export default function ReferralCapture({ days = 60 }: { days?: number }) {
  useEffect(() => {
    try {
      const code = (new URLSearchParams(window.location.search).get(REF_PARAM) || '').trim().toUpperCase();
      if (!CODE_RE.test(code)) return;
      if (document.cookie.split('; ').some((c) => c.startsWith(`${REF_COOKIE}=`))) return;
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${REF_COOKIE}=${encodeURIComponent(code)}; Path=/; Max-Age=${days * 86400}; SameSite=Lax${secure}`;
    } catch { /* cookies blocked */ }
  }, [days]);
  return null;
}
