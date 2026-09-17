// src/lib/auth.ts
// Authentication utilities for HOOX
// Simple password-based auth stored in Supabase
// NOTE: For production, migrate to Supabase Auth for proper security

import { getUserByEmail, createUser } from './supabase';
import { dbUserToApp } from './supabase';
import { hashPassword } from './passwordHash';
import type { User, UserRole } from '@/types';

const SESSION_KEY = 'hoox_session';

// ============================================================
// SESSION MANAGEMENT
// ============================================================

export function getSession(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setSession(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  // Also set cookie so middleware can read it server-side
  document.cookie = `hoox_session=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; SameSite=Lax`;
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
  // Clear the cookie too
  document.cookie = 'hoox_session=; path=/; max-age=0';
}

// ============================================================
// PASSWORD UTILITIES
// Moved to ./passwordHash so server-only route handlers (src/app/api/**)
// can reuse the exact same logic without importing this client module.
// Re-exported here too, in case any existing code imports them from '@/lib/auth'.
// ============================================================

export { hashPassword } from './passwordHash';

// ============================================================
// LOGIN
// ============================================================

export type LoginErrorCode =
  | 'connection_error'
  | 'not_found'
  | 'wrong_password'
  | 'account_paused'
  | 'account_banned'
  | 'account_pending'
  | 'account_inactive'
  | 'not_admin'
  | 'unknown';

export async function loginUser(email: string, password: string): Promise<{ user: User | null; error: string | null; code?: LoginErrorCode }> {
  // Verified server-side now (src/app/api/auth/login) so the password hash
  // never has to be sent to the browser to be compared here. This function
  // keeps its original signature/return shape so LoginPage/AdminLoginPage
  // don't need to change.
  let res: Response;
  try {
    res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return { user: null, error: 'Connection error. Please try again.', code: 'connection_error' };
  }

  const result = (await res.json().catch(() => null)) as
    | { user: User | null; error: string | null; code?: LoginErrorCode }
    | null;

  if (!result) {
    return { user: null, error: 'Connection error. Please try again.', code: 'connection_error' };
  }

  if (result.user) setSession(result.user);
  return result;
}

// ============================================================
// ADMIN LOGIN
// ============================================================

export async function loginAdmin(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const result = await loginUser(email, password);
  if (result.error) return result;
  if (result.user?.role !== 'admin') {
    clearSession();
    return { user: null, error: 'Access denied. Admin accounts only.' };
  }
  return result;
}

// ============================================================
// REGISTRATION
// ============================================================

export async function registerAngler(data: {
  name: string;
  email: string;
  password: string;
  organization?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  country?: string;
}): Promise<{ user: User | null; error: string | null }> {
  // Check if email exists
  const { data: existing } = await getUserByEmail(data.email.toLowerCase().trim());
  if (existing && existing.length > 0) {
    return { user: null, error: 'An account with this email already exists.' };
  }

  const { data: created, error } = await createUser({
    name: data.name,
    email: data.email.toLowerCase().trim(),
    password_hash: hashPassword(data.password),
    role: 'angler',
    status: 'active',
    organization: data.organization || null,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    zip: data.zip || null,
    phone: data.phone || null,
    website: null,
    avatar: null,
    message: null,
    banner_image: null,
    banner_start_date: null,
    banner_end_date: null,
    country: null,
  });

  if (error || !created?.[0]) return { user: null, error: error || 'Registration failed.' };
  const user = dbUserToApp(created[0]);
  setSession(user);
  return { user, error: null };
}

export async function registerDirector(data: {
  name: string;
  email: string;
  password: string;
  organization?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  website?: string;
  country?: string;
}): Promise<{ user: User | null; error: string | null }> {
  const { data: existing } = await getUserByEmail(data.email.toLowerCase().trim());
  if (existing && existing.length > 0) {
    return { user: null, error: 'An account with this email already exists.' };
  }

  const { data: created, error } = await createUser({
    name: data.name,
    email: data.email.toLowerCase().trim(),
    password_hash: hashPassword(data.password),
    role: 'director',
    status: 'active',
    organization: data.organization || null,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    zip: data.zip || null,
    phone: data.phone || null,
    website: data.website || null,
    avatar: null,
    message: null,
    banner_image: null,
    banner_start_date: null,
    banner_end_date: null,
    country: null,
  });

  if (error || !created?.[0]) return { user: null, error: error || 'Registration failed.' };
  const user = dbUserToApp(created[0]);
  setSession(user);
  return { user, error: null };
}

export type JudgeRegistrationOutcome =
  | 'pending_approval'   // director exists, judge is pending their approval
  | 'invite_sent'        // director not found, invitation email would be sent
  | 'error';

export async function registerJudge(data: {
  name: string;
  email: string;
  password: string;
  directorEmail: string;
  organization?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
}): Promise<{ user: User | null; outcome: JudgeRegistrationOutcome; directorName?: string; error: string | null }> {
  // Check if judge email already exists
  const { data: existing } = await getUserByEmail(data.email.toLowerCase().trim());
  if (existing && existing.length > 0) {
    return { user: null, outcome: 'error', error: 'An account with this email already exists.' };
  }

  // Check if director exists
  const { data: directorData } = await getUserByEmail(data.directorEmail.toLowerCase().trim());
  const directorExists = directorData && directorData.length > 0 && directorData[0].role === 'director';
  const directorName = directorExists ? directorData![0].name : undefined;

  // Status depends on whether director exists:
  // - If director exists: judge is 'pending' until director approves
  // - If director doesn't exist: judge is created 'active' but unconnected; director gets invite
  const status = directorExists ? 'pending' : 'active';

  const { data: created, error } = await createUser({
    name: data.name,
    email: data.email.toLowerCase().trim(),
    password_hash: hashPassword(data.password),
    role: 'judge',
    status,
    organization: data.organization || null,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    zip: data.zip || null,
    phone: data.phone || null,
    website: null,
    avatar: null,
    country: data.country || null,
    // Store director email in message field so director can find their judges
    message: data.directorEmail.toLowerCase().trim(),
    banner_image: null,
    banner_start_date: null,
    banner_end_date: null,
  });

  if (error || !created?.[0]) {
    return { user: null, outcome: 'error', error: error || 'Registration failed.' };
  }

  const user = dbUserToApp(created[0]);

  // Only set session if not pending approval
  if (status === 'active') setSession(user);

  // In production, send emails here via an edge function:
  // - If directorExists: email director at data.directorEmail notifying them of pending judge approval
  // - If !directorExists: email data.directorEmail inviting them to register as a Tournament Director
  // For now we return the outcome so the UI can show the right message.

  const outcome: JudgeRegistrationOutcome = directorExists ? 'pending_approval' : 'invite_sent';
  return { user, outcome, directorName, error: null };
}

export async function registerPartner(data: {
  name: string;
  email: string;
  password: string;
  organization?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  website?: string;
  message?: string;
}): Promise<{ user: User | null; error: string | null }> {
  const { data: existing } = await getUserByEmail(data.email.toLowerCase().trim());
  if (existing && existing.length > 0) {
    return { user: null, error: 'An account with this email already exists.' };
  }

  const { data: created, error } = await createUser({
    name: data.name,
    email: data.email.toLowerCase().trim(),
    password_hash: hashPassword(data.password),
    role: 'sponsor',
    status: 'pending', // partners need approval
    organization: data.organization || null,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    zip: data.zip || null,
    phone: data.phone || null,
    website: data.website || null,
    avatar: null,
    message: data.message || null,
    banner_image: null,
    banner_start_date: null,
    banner_end_date: null,
    country: null,
  });

  if (error || !created?.[0]) return { user: null, error: error || 'Registration failed.' };
  // Don't set session for partners - they need approval
  return { user: dbUserToApp(created[0]), error: null };
}

// ============================================================
// CREATE ALL DEMO ACCOUNTS
// ============================================================

export interface DemoAccountResult {
  email: string;
  role: string;
  status: 'created' | 'updated' | 'error';
  error?: string;
}

export async function createAllDemoAccounts(): Promise<DemoAccountResult[]> {
  // Moved server-side (src/app/api/admin/demo-accounts) — this used to be
  // an exported client function with no permission check of its own, so
  // any visitor could call it from the browser console on any page to
  // (re)create the 4 demo accounts and reset their shared password back to
  // a known value. The route requires a verified admin session.
  let res: Response;
  try {
    res = await fetch('/api/admin/demo-accounts', { method: 'POST' });
  } catch {
    return [];
  }

  const result = (await res.json().catch(() => null)) as { results?: DemoAccountResult[] } | null;
  return result?.results || [];
}

// ============================================================
// CHANGE PASSWORD
// ============================================================

export async function changePassword(opts: {
  userId: string;
  currentPassword?: string;       // required when changing own password
  newPassword: string;
  isAdminOverride?: boolean;       // true when admin changes someone else's password
}): Promise<{ success: boolean; error: string | null }> {
  // Verified server-side now (src/app/api/auth/change-password). The old
  // client-side version trusted `isAdminOverride` from the caller directly,
  // which meant anyone could call this from the browser console with
  // isAdminOverride: true and reset any account's password without knowing
  // the original one. The server route re-derives admin status itself from
  // the signed session cookie, so `isAdminOverride` below is only used to
  // decide whether to send `currentPassword` — the server makes the real
  // decision independently.
  const { userId, currentPassword, newPassword } = opts;

  let res: Response;
  try {
    res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, currentPassword, newPassword }),
    });
  } catch {
    return { success: false, error: 'Connection error. Please try again.' };
  }

  const result = (await res.json().catch(() => null)) as { success: boolean; error: string | null } | null;
  if (!result) return { success: false, error: 'Connection error. Please try again.' };
  return result;
}
