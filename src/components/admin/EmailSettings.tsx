'use client';

/* Admin → Settings → Email: setup status, test send, and the email log. */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, CheckCircle2, AlertCircle, Loader2, Send, RefreshCw, ArrowDownLeft, ArrowUpRight, Copy, Check, Info } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { INPUT, CARD, BTN, BTN_GHOST } from '@/components/admin/sponsors/shared';

interface Config { sending: boolean; from: string; support: string; replyDomain: string; receiving: boolean; webhookSecret: boolean; appUrl: string; webhookUrl: string }
interface LogRow { id: string; created_at: string; direction: 'out' | 'in'; kind: string; to_email: string; from_email: string | null; subject: string; status: 'sent' | 'failed' | 'skipped' | 'received'; error: string | null }
type Filter = '' | 'failed' | 'skipped' | 'in';

const KIND_LABEL: Record<string, string> = {
  welcome: 'Welcome', account_approved: 'Account approved', password_reset: 'Password reset', judge_invite: 'Judge invite',
  team_invite: 'Team invite', judge_awaiting_director: 'Judge awaiting director', director_invite: 'Director invite',
  ticket_received: 'Ticket received', support_reply: 'Support reply', admin_alert: 'Admin alert', test: 'Test', unmatched: 'Unmatched reply',
};
const STATUS_CHIP: Record<LogRow['status'], string> = {
  sent: 'bg-[#E8F6EE] text-[#1E7A46]', received: 'bg-[#E7F1FB] text-[#1F5E99]', failed: 'bg-red-50 text-red-700', skipped: 'bg-[#FFF4E5] text-[#B4570B]',
};

function Step({ ok, info, title, children }: { ok: boolean; info?: boolean; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      {info ? <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#8A9AB0]" /> : ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0E7C7B]" /> : <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#C4560E]" />}
      <div className="min-w-0 text-sm text-[#2E3F5C]"><p className="font-semibold text-[#0D1B4C]">{title}</p><div className="mt-0.5 space-y-1 text-[13px] leading-[20px] text-[#5F6F86]">{children}</div></div>
    </li>
  );
}
const Code = ({ children }: { children: React.ReactNode }) => <code className="rounded bg-[#F2F6F9] px-1.5 py-0.5 font-mono text-[12px] text-[#0D1B4C]">{children}</code>;

export default function EmailSettings() {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState<Config | null>(null);
  const [log, setLog] = useState<LogRow[]>([]);
  const [stats, setStats] = useState({ sent: 0, failed: 0, skipped: 0, received: 0 });
  const [logError, setLogError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('');
  const [loading, setLoading] = useState(true);
  const [to, setTo] = useState('');
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const j = await fetch(`/api/admin/email${filter ? `?status=${filter}` : ''}`, { cache: 'no-store' }).then((r) => r.json());
      setConfig(j.config || null); setLog(j.log || []); setStats(j.stats || stats); setLogError(j.logError || j.error || null);
    } catch { setLogError('Couldn’t load email settings.'); }
    finally { setLoading(false); }
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (currentUser?.email && !to) setTo(currentUser.email); }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  async function test() {
    setTesting(true); setTestMsg(null);
    try {
      const j = await fetch('/api/admin/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to }) }).then((r) => r.json());
      setTestMsg(j.ok ? { ok: true, text: `Test email sent to ${to}. Check the inbox (and spam folder).` } : { ok: false, text: j.skipped ? 'Not sent: add RESEND_API_KEY in Cloudflare first (step 2).' : `Not sent: ${j.error}` });
      load();
    } catch { setTestMsg({ ok: false, text: 'Couldn’t reach the server.' }); }
    finally { setTesting(false); }
  }

  const fmt = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  return (
    <div className="font-roboto mx-auto w-full max-w-[1100px] px-4 py-8 md:px-5">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-sm">
        <Link href="/admin" className="text-[#0E7C7B] hover:underline">Admin</Link>
        <ChevronRight className="h-3.5 w-3.5 text-[#B9C6D4]" aria-hidden />
        <Link href="/admin/settings" className="text-[#0E7C7B] hover:underline">Settings</Link>
        <ChevronRight className="h-3.5 w-3.5 text-[#B9C6D4]" aria-hidden />
        <span className="font-medium text-[#0D1B4C]" aria-current="page">Email</span>
      </nav>
      <h2 className="font-montserrat text-2xl font-bold text-[#0D1B4C]">Email</h2>
      <p className="mt-0.5 text-sm text-[#5F6F86]">Registration, password reset, invites, support replies and admin alerts. Sent through Resend; replies to support emails come back into Support.</p>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section className={CARD} aria-labelledby="setup-h">
          <h3 id="setup-h" className="font-montserrat text-[17px] font-bold text-[#0D1B4C]">Setup</h3>
          {!config ? <p className="mt-3 text-sm text-[#8A9AB0]">Loading…</p> : (
            <ol className="mt-4 space-y-4">
              <Step ok info title="1. Support inbox (Cloudflare Email Routing)">
                <p>In Cloudflare → hoox.app → Email → Email Routing, forward <Code>{config.support}</Code> to your own inbox. Admin alerts are sent there.</p>
              </Step>
              <Step ok={config.sending} title={config.sending ? '2. Sending is on' : '2. Turn on sending (Resend)'}>
                {config.sending ? <p>Sending from <Code>{config.from}</Code>.</p> : (
                  <p>Add hoox.app as a domain in Resend and add its DNS records in Cloudflare. Then create an API key and add it in Cloudflare Pages → Settings → Variables as <Code>RESEND_API_KEY</Code> (and optionally <Code>EMAIL_FROM</Code>, <Code>SUPPORT_EMAIL</Code>). Redeploy after saving.</p>
                )}
              </Step>
              <Step ok={config.receiving} title={config.receiving ? '3. Replies by email are on' : '3. Replies by email (optional)'}>
                {config.receiving ? <p>Support emails use reply addresses at <Code>{config.replyDomain}</Code>.</p> : (
                  <>
                    <p>In Resend → Receiving, add the subdomain <Code>reply.hoox.app</Code> and its MX record in Cloudflare (this doesn’t affect hoox.app’s own email).</p>
                    <p>In Resend → Webhooks, add an <Code>email.received</Code> webhook to:</p>
                    <p className="flex flex-wrap items-center gap-2"><Code>{config.webhookUrl}</Code>
                      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(config.webhookUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } }} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0E7C7B] hover:underline">{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{copied ? 'Copied' : 'Copy'}</button>
                    </p>
                    <p>Then add <Code>EMAIL_REPLY_DOMAIN</Code> = reply.hoox.app and <Code>RESEND_WEBHOOK_SECRET</Code> = the webhook’s signing secret{config.replyDomain && !config.webhookSecret ? ' (the secret is still missing)' : ''}. Until then, people reply from the ticket link in the email.</p>
                  </>
                )}
              </Step>
            </ol>
          )}
        </section>

        <section className={CARD} aria-labelledby="test-h">
          <h3 id="test-h" className="font-montserrat text-[17px] font-bold text-[#0D1B4C]">Send a test email</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <input aria-label="Send test to" type="email" className={`${INPUT} min-w-0 flex-1`} value={to} onChange={(e) => setTo(e.target.value)} />
            <button type="button" onClick={test} disabled={testing} className={BTN}>{testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Send test</button>
          </div>
          {testMsg && <p className={`mt-2 text-sm ${testMsg.ok ? 'text-green-700' : 'text-red-600'}`}>{testMsg.text}</p>}
          <dl className="mt-6 grid grid-cols-2 gap-3 text-center">
            {([['Sent', stats.sent, 'text-[#1E7A46]'], ['Received', stats.received, 'text-[#1F5E99]'], ['Failed', stats.failed, 'text-red-700'], ['Not sent (setup)', stats.skipped, 'text-[#B4570B]']] as const).map(([l, n, c]) => (
              <div key={l} className="rounded-lg border border-[#E3EAF1] px-3 py-3"><dd className={`font-montserrat text-2xl font-bold ${c}`}>{n}</dd><dt className="text-xs text-[#6B7D93]">{l}</dt></div>
            ))}
          </dl>
          <p className="mt-2 text-center text-xs text-[#8A9AB0]">Last 30 days</p>
        </section>
      </div>

      <section className={`${CARD} mt-5`} aria-labelledby="log-h">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="log-h" className="font-montserrat text-[17px] font-bold text-[#0D1B4C]">Email log</h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-[200px]">
              <select aria-label="Filter the log" className={INPUT} value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
                <option value="">All emails</option><option value="failed">Failed</option><option value="skipped">Not sent (setup)</option><option value="in">Received replies</option>
              </select>
            </div>
            <button type="button" onClick={load} className={BTN_GHOST} aria-label="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
          </div>
        </div>
        {logError && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{logError}</p>}
        {!logError && log.length === 0 && !loading && <p className="mt-4 text-sm text-[#8A9AB0]">No emails yet.</p>}
        {log.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead><tr className="border-b border-[#E3EAF1] text-xs uppercase tracking-wide text-[#6B7D93]"><th className="py-2 pr-3 font-semibold">When</th><th className="py-2 pr-3 font-semibold">Type</th><th className="py-2 pr-3 font-semibold">To / from</th><th className="py-2 pr-3 font-semibold">Subject</th><th className="py-2 font-semibold">Status</th></tr></thead>
              <tbody>
                {log.map((r) => (
                  <tr key={r.id} className="border-b border-[#EEF3F8] align-top">
                    <td className="whitespace-nowrap py-2.5 pr-3 text-[#5F6F86]">{fmt(r.created_at)}</td>
                    <td className="whitespace-nowrap py-2.5 pr-3"><span className="inline-flex items-center gap-1 text-[#2E3F5C]">{r.direction === 'in' ? <ArrowDownLeft className="h-3.5 w-3.5 text-[#1F5E99]" /> : <ArrowUpRight className="h-3.5 w-3.5 text-[#0E7C7B]" />}{KIND_LABEL[r.kind] || r.kind}</span></td>
                    <td className="max-w-[220px] truncate py-2.5 pr-3 text-[#2E3F5C]" title={r.direction === 'in' ? r.from_email || '' : r.to_email}>{r.direction === 'in' ? r.from_email : r.to_email}</td>
                    <td className="max-w-[320px] py-2.5 pr-3 text-[#2E3F5C]"><span className="line-clamp-1">{r.subject}</span>{r.error && <span className="mt-0.5 block text-xs text-red-600">{r.error}</span>}</td>
                    <td className="py-2.5"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CHIP[r.status]}`}>{r.status === 'skipped' ? 'Not sent' : r.status[0].toUpperCase() + r.status.slice(1)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
