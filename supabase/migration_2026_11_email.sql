-- ============================================================
-- HOOX: email (Resend) — send log, password resets, support reply-by-email
-- Idempotent: safe to re-run. Safe before or after the code deploy.
--
--   email_log            every email the app sends (or skips when email
--                        isn't configured), for Admin → Settings → Email
--   password_resets      one-time reset links (hashed token, 1 hour)
--   support_threads.email_token
--                        private token used in ticket emails (view link and
--                        reply+<thread>.<token>@reply.hoox.app addresses)
-- Written only by the server (service role); no public access.
-- ============================================================

create table if not exists public.email_log (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  direction    text not null default 'out' check (direction in ('out', 'in')),
  kind         text not null,                 -- e.g. welcome, password_reset, judge_invite, support_reply
  to_email     text not null,
  from_email   text,
  subject      text not null,
  status       text not null check (status in ('sent', 'failed', 'skipped', 'received')),
  provider_id  text,                          -- Resend email id
  error        text,
  related_id   text                           -- ticket / tournament / user id
);
create index if not exists email_log_created_idx on public.email_log (created_at desc);
create index if not exists email_log_to_idx on public.email_log (lower(to_email));

create table if not exists public.password_resets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists password_resets_user_idx on public.password_resets (user_id);

alter table public.support_threads add column if not exists email_token text;

alter table public.email_log enable row level security;
alter table public.password_resets enable row level security;
revoke all on public.email_log from anon, authenticated;
revoke all on public.password_resets from anon, authenticated;
