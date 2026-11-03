'use client';

// Anonymous chat identity for this browser: a random id + secret key, kept in
// localStorage so a visitor's conversations survive page loads. The server
// stores only a hash of the key. Falls back to memory if storage is blocked.

const STORE = 'hoox_support_visitor';
let memory: { id: string; key: string } | null = null;

const rand = (bytes: number) => Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');

export function getVisitorIdentity(): { id: string; key: string } {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) {
      const v = JSON.parse(raw);
      if (typeof v?.id === 'string' && typeof v?.key === 'string') return (memory = v);
    }
  } catch { /* storage blocked */ }
  const v = { id: (crypto.randomUUID?.() ?? rand(16)), key: rand(24) };
  try { localStorage.setItem(STORE, JSON.stringify(v)); } catch { /* memory only */ }
  return (memory = v);
}

/** Start over with a fresh identity (used if the server rejects the key) */
export function resetVisitorIdentity() {
  memory = null;
  try { localStorage.removeItem(STORE); } catch { /* ignore */ }
  return getVisitorIdentity();
}

/** Remember small per-visitor UI state (e.g. which admin chats were already announced) */
export function readPref<T>(k: string, fallback: T): T {
  try { const v = localStorage.getItem(`hoox_support_${k}`); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
export function writePref(k: string, v: unknown) {
  try { localStorage.setItem(`hoox_support_${k}`, JSON.stringify(v)); } catch { /* ignore */ }
}
