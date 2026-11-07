// Admin-only: email setup status, the email log, and a test send.
//   GET  ?status=failed|skipped|in → { config, log, stats }
//   POST { to }                     → sends a test email

export const runtime = 'edge';

import { getAuthenticatedAdmin } from '@/lib/serverSession';
import { supabaseAdminFetch } from '@/lib/supabaseAdmin';
import { emailEnv, sendEmail } from '@/lib/email';
import { testEmail } from '@/lib/emailTemplates';

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const env = emailEnv();
  const f = new URL(request.url).searchParams.get('status');
  const filter = f === 'failed' || f === 'skipped' ? `&status=eq.${f}` : f === 'in' ? '&direction=eq.in' : '';
  const since = new Date(Date.now() - 30 * 86400_000).toISOString();
  const [log, recent] = await Promise.all([
    supabaseAdminFetch<unknown[]>(`email_log?select=*&order=created_at.desc&limit=200${filter}`),
    supabaseAdminFetch<{ status: string; direction: string }[]>(`email_log?select=status,direction&created_at=gte.${encodeURIComponent(since)}&limit=20000`),
  ]);
  const stats = { sent: 0, failed: 0, skipped: 0, received: 0 };
  for (const r of recent.data ?? []) if (r.status in stats) stats[r.status as keyof typeof stats]++;
  return Response.json({
    config: {
      sending: !!env.apiKey, from: env.from, support: env.support, replyDomain: env.replyDomain,
      receiving: !!(env.replyDomain && env.webhookSecret), webhookSecret: !!env.webhookSecret, appUrl: env.appUrl,
      webhookUrl: `${new URL(request.url).origin}/api/email/inbound`,
    },
    log: log.data ?? [], logError: log.error && /email_log|relation/i.test(log.error) ? 'Run supabase/migration_2026_11_email.sql in Supabase.' : null,
    stats, error: null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });
  let b: Record<string, unknown> = {};
  try { b = await request.json(); } catch { /* default recipient */ }
  const to = typeof b.to === 'string' && b.to.trim() ? b.to.trim().toLowerCase() : admin.email;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) return Response.json({ ok: false, error: 'Enter a valid email.' }, { status: 400 });
  const r = await sendEmail({ to, kind: 'test', relatedId: admin.id, ...testEmail() });
  return Response.json({ ok: r.ok, skipped: !!r.skipped, error: r.ok ? null : r.error });
}
