// src/lib/auth.ts
// Authentication utilities for HOOX
// Simple password-based auth stored in Supabase
// NOTE: For production, migrate to Supabase Auth for proper security

import { getUserByEmail, createUser, updateUser } from './supabase';
import { dbUserToApp } from './supabase';
import type { User, UserRole } from '@/types';

const SESSION_KEY = 'hoox_session';

// ============================================================
// SESSION MANAGEMENT
// ============================================================

export function getSession(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setSession(user: User): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}

// ============================================================
// PASSWORD UTILITIES
// Simple hash for demo - in production use Supabase Auth
// ============================================================

export function hashPassword(password: string): string {
  // Simple deterministic hash for demo purposes
  // In production: use Supabase Auth which handles bcrypt server-side
  let hash = 0;
  const str = password + 'hoox_salt_2026';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + btoa(password).replace(/=/g, '');
}

export function verifyPassword(password: string, hash: string): boolean {
  if (!hash) return false;
  // Check new hash format
  if (hash.startsWith('h_')) {
    return hashPassword(password) === hash;
  }
  // Legacy: plain text comparison (for demo accounts created early)
  return password === hash;
}

// ============================================================
// LOGIN
// ============================================================

export async function loginUser(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await getUserByEmail(email.toLowerCase().trim());

  if (error) return { user: null, error: 'Connection error. Please try again.' };
  if (!data || data.length === 0) return { user: null, error: 'No account found with that email.' };

  const dbUser = data[0];

  if (!dbUser.password_hash) {
    return { user: null, error: 'Account not set up correctly. Please contact support.' };
  }

  if (!verifyPassword(password, dbUser.password_hash)) {
    return { user: null, error: 'Incorrect password.' };
  }

  if (dbUser.status === 'inactive' || dbUser.status === 'paused') {
    return { user: null, error: 'Your account is not active. Please contact support.' };
  }

  if (dbUser.status === 'pending') {
    return { user: null, error: 'Your account is pending approval. You will receive an email when approved.' };
  }

  const user = dbUserToApp(dbUser);
  setSession(user);
  return { user, error: null };
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
  });

  if (error || !created?.[0]) return { user: null, error: error || 'Registration failed.' };
  // Don't set session for partners - they need approval
  return { user: dbUserToApp(created[0]), error: null };
}

// ============================================================
// CREATE DEMO ADMIN ACCOUNT
// ============================================================

export async function createDemoAdmin(): Promise<{ success: boolean; error: string | null }> {
  const email = 'cher.chronis@gmail.com';
  const { data: existing } = await getUserByEmail(email);

  if (existing && existing.length > 0) {
    // Update to admin if exists
    await updateUser(existing[0].id, {
      role: 'admin',
      status: 'active',
      password_hash: hashPassword('DemoAdmin123!'),
    });
    return { success: true, error: null };
  }

  const { error } = await createUser({
    name: 'Cher Chronis',
    email,
    password_hash: hashPassword('DemoAdmin123!'),
    role: 'admin',
    status: 'active',
    organization: 'HOOX Software LLC',
    address: null, city: null, state: null, zip: null,
    phone: null, website: null, avatar: null, message: null,
    banner_image: null, banner_start_date: null, banner_end_date: null,
  });

  if (error) return { success: false, error };
  return { success: true, error: null };
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
  const password = hashPassword('demo123');
  const results: DemoAccountResult[] = [];

  const accounts = [
    {
      email: 'tournamentdirector@hoox.app',
      name: 'Demo Director',
      role: 'director' as const,
      organization: 'HOOX Demo Club',
      message: null,
    },
    {
      email: 'angler@hoox.app',
      name: 'Demo Angler',
      role: 'angler' as const,
      organization: null,
      message: null,
    },
    {
      email: 'judge@hoox.app',
      name: 'Demo Judge',
      role: 'judge' as const,
      organization: null,
      // connected to the demo director
      message: 'tournamentdirector@hoox.app',
    },
    {
      email: 'partner@hoox.app',
      name: 'Demo Partner',
      role: 'sponsor' as const,
      organization: 'Demo Sponsor Co.',
      message: null,
    },
  ];

  for (const account of accounts) {
    const { data: existing } = await getUserByEmail(account.email);

    if (existing && existing.length > 0) {
      // Update existing account - ensure correct role, status, and password
      const { error } = await updateUser(existing[0].id, {
        role: account.role,
        status: 'active',
        password_hash: password,
        organization: account.organization,
        message: account.message,
      });
      results.push({
        email: account.email,
        role: account.role,
        status: error ? 'error' : 'updated',
        error: error ?? undefined,
      });
    } else {
      // Create new account
      const { error } = await createUser({
        name: account.name,
        email: account.email,
        password_hash: password,
        role: account.role,
        status: 'active',
        organization: account.organization,
        message: account.message,
        address: null, city: null, state: null, zip: null,
        phone: null, website: null, avatar: null,
        banner_image: null, banner_start_date: null, banner_end_date: null,
      });
      results.push({
        email: account.email,
        role: account.role,
        status: error ? 'error' : 'created',
        error: error ?? undefined,
      });
    }
  }

  return results;
}
