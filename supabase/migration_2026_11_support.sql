-- ============================================================
-- HOOX support: live chat, "ask our team" questions and tickets
-- Run once in Supabase SQL Editor. Project: Hoox (iefjracmxpkpwndrksps)
-- Idempotent: safe to re-run.
--
-- Creates:
--   support_threads   one conversation: a live chat / question from the chat
--                     bubble, or a ticket from /support/ticket
--   support_messages  messages in a thread (visitor, admin or system)
--   support_visitors  anonymous visitor presence (heartbeat from the chat
--                     bubble), so admins can see who's on the site and start
--                     a chat
--   support_agents    admin availability + heartbeat for the "online" dot
--
-- Security: RLS on, no public policies. Everything goes through
-- src/app/api/support/** (visitor key or ticket link token checked
-- server-side) and src/app/api/admin/support/** (admin session).
-- Visitor keys and ticket tokens are stored only as SHA-256 hashes.
-- ============================================================

create table if not exists public.support_visitors (
  visitor_id   text primary key,
  key_hash     text not null,
  user_id      uuid references public.users(id) on delete set null,
  name         text,
  email        text,
  page_url     text,
  last_seen    timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
create index if not exists support_visitors_last_seen_idx on public.support_visitors (last_seen desc);

create table if not exists public.support_threads (
  id                  uuid primary key default gen_random_uuid(),
  number              bigint generated always as identity (start with 1001),
  kind                text not null check (kind in ('chat', 'ticket')),
  status              text not null default 'open' check (status in ('open', 'pending', 'resolved', 'closed')),
  priority            text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  category            text,
  subject             text,
  name                text,
  email               text,
  user_id             uuid references public.users(id) on delete set null,
  visitor_id          text,
  access_hash         text,                 -- private link token (tickets / offline questions)
  started_by          text not null default 'visitor' check (started_by in ('visitor', 'admin')),
  page_url            text,
  admin_notes         text,
  last_message_at     timestamptz not null default now(),
  last_message_from   text not null default 'visitor',
  admin_last_read_at  timestamptz,
  visitor_last_read_at timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create unique index if not exists support_threads_number_idx on public.support_threads (number);
create index if not exists support_threads_kind_status_idx on public.support_threads (kind, status, last_message_at desc);
create index if not exists support_threads_visitor_idx on public.support_threads (visitor_id, last_message_at desc);

create table if not exists public.support_messages (
  id           uuid primary key default gen_random_uuid(),
  thread_id    uuid not null references public.support_threads(id) on delete cascade,
  author       text not null check (author in ('visitor', 'admin', 'system')),
  author_name  text,
  body         text not null,
  created_at   timestamptz not null default now()
);
create index if not exists support_messages_thread_idx on public.support_messages (thread_id, created_at);

create table if not exists public.support_agents (
  user_id    uuid primary key references public.users(id) on delete cascade,
  name       text,
  available  boolean not null default true,
  last_seen  timestamptz not null default now()
);

create or replace function public.support_threads_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists support_threads_touch_updated_at on public.support_threads;
create trigger support_threads_touch_updated_at
  before update on public.support_threads
  for each row execute function public.support_threads_touch_updated_at();

alter table public.support_visitors enable row level security;
alter table public.support_threads  enable row level security;
alter table public.support_messages enable row level security;
alter table public.support_agents   enable row level security;
-- Intentionally no policies: only the service role (server API routes) can access.
