-- ============================================================
-- HOOX: secure passwords and lock down the users table
-- Project: Hoox (iefjracmxpkpwndrksps)
--
-- RUN THIS ONLY AFTER the "Secure sign-in" code is live on hoox.app
-- (Cloudflare shows the deployment as Success). The old code can't read
-- the new password format, so running this first would lock everyone out.
--
-- Idempotent: safe to re-run.
--
-- What it does
--   1. Installs bcrypt password functions (pgcrypto) that only the HOOX
--      server (service role) can call.
--   2. Converts every stored password to bcrypt. The old 'h_…' format
--      contained a reversible copy of the password; after this nothing
--      reversible is stored.
--   3. Stops the public (anon) key from creating, editing or deleting
--      users. Sign-up now goes through /api/auth/register on the server.
--   4. Stops the public key from reading the users table. Public pages read
--      a new view, users_public, which leaves out password_hash, email,
--      phone, address, zip and message.
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- 1. Password functions -----------------------------------------------------

create or replace function public.hoox_hash_password(p_password text)
returns text
language sql
volatile
security definer
set search_path = public, extensions
as $$
  select extensions.crypt(p_password, extensions.gen_salt('bf', 10));
$$;

create or replace function public.hoox_check_password(p_password text, p_hash text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select p_hash is not null and p_hash ~ '^\$2[aby]\$' and extensions.crypt(p_password, p_hash) = p_hash;
$$;

revoke all on function public.hoox_hash_password(text) from public, anon, authenticated;
revoke all on function public.hoox_check_password(text, text) from public, anon, authenticated;
grant execute on function public.hoox_hash_password(text) to service_role;
grant execute on function public.hoox_check_password(text, text) to service_role;

-- 2. Convert stored passwords to bcrypt -------------------------------------

-- Old format: 'h_' || base36 number || '_' || base64(password) without '=' padding
update public.users
   set password_hash = extensions.crypt(
         convert_from(
           decode(
             split_part(password_hash, '_', 3)
               || repeat('=', (4 - length(split_part(password_hash, '_', 3)) % 4) % 4),
             'base64'),
           'LATIN1'),
         extensions.gen_salt('bf', 10))
 where password_hash like 'h\_%\_%'
   and split_part(password_hash, '_', 3) <> '';

-- Very early demo rows stored the password itself
update public.users
   set password_hash = extensions.crypt(password_hash, extensions.gen_salt('bf', 10))
 where password_hash is not null
   and password_hash <> ''
   and password_hash !~ '^\$2[aby]\$'
   and password_hash not like 'h\_%';

-- 3. No public writes to users ------------------------------------------------

revoke insert, update, delete on public.users from anon, authenticated;
drop policy if exists "Anyone can create user" on public.users;
drop policy if exists "Anyone can update users" on public.users;

-- 4. Public reads: only non-private columns ---------------------------------
-- The public key can no longer read public.users at all. Public pages read
-- public.users_public instead: the same rows without the private columns.
-- The view's column list is built from whatever columns users has today.

revoke select on public.users from anon, authenticated;
do $$
declare
  cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into cols
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'users'
     and column_name not in ('password_hash', 'email', 'phone', 'address', 'zip', 'message');
  execute 'drop view if exists public.users_public';
  execute format('create view public.users_public as select %s from public.users', cols);
end $$;
revoke all on public.users_public from public;
grant select on public.users_public to anon, authenticated;

-- Re-run this file after adding new columns to users so the view picks them up.

-- Check: every row should now be bcrypt (or empty for Google-only accounts
-- created before this). This should return 0.
select count(*) as old_format_passwords_left
  from public.users
 where password_hash is not null and password_hash <> '' and password_hash !~ '^\$2[aby]\$';
