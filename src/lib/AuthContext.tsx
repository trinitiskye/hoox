'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '@/types';
import { getSession, setSession, clearSession } from '@/lib/auth';

interface AuthContextType {
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: () => {},
  logout: () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session) setCurrentUser(session);
    setLoading(false);
  }, []);

  const login = useCallback((user: User) => {
    setCurrentUser(user);
    setSession(user);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    clearSession();
    // Clear the server-side signed session cookie too. Fire-and-forget:
    // existing callers don't await logout(), so this just needs to not throw.
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
