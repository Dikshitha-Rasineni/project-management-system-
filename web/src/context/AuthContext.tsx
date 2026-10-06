import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { loadStoredSession, registerSessionInvalidHandler, setAuthToken, storeSession } from '../services/api';
import { authApi } from '../services/endpoints';
import type { Session, User } from '../types';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: Status;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);
  const expiryTimer = useRef<number | undefined>(undefined);

  const clearSession = useCallback(() => {
    window.clearTimeout(expiryTimer.current);
    setAuthToken(null);
    storeSession(null);
    setUser(null);
    setStatus('anonymous');
    queryClient.clear(); // never show one user's cached data to the next
  }, [queryClient]);

  const expireSession = useCallback(
    (message: string) => {
      clearSession();
      toast.error(message, { id: 'session-expired' });
    },
    [clearSession],
  );

  const startSession = useCallback(
    (session: Pick<Session, 'token' | 'expiresAt'>, sessionUser: User) => {
      setAuthToken(session.token);
      storeSession({ token: session.token, expiresAt: session.expiresAt });
      setUser(sessionUser);
      setStatus('authenticated');
      // Log out exactly when the token expires, even if the tab stays idle.
      window.clearTimeout(expiryTimer.current);
      const ms = Date.parse(session.expiresAt) - Date.now();
      if (ms > 0 && ms < 2 ** 31 - 1) {
        expiryTimer.current = window.setTimeout(() => expireSession('Your session has expired. Please log in again.'), ms);
      }
    },
    [expireSession],
  );

  // Any 401 from the API (expired / revoked token) ends the session.
  useEffect(() => {
    registerSessionInvalidHandler(expireSession);
  }, [expireSession]);

  // Restore a saved session on load and confirm it with GET /auth/me.
  useEffect(() => {
    const stored = loadStoredSession();
    if (!stored) {
      setStatus('anonymous');
      return;
    }
    setAuthToken(stored.token);
    authApi
      .me()
      .then((me) => startSession(stored, me))
      .catch(() => clearSession());
  }, [startSession, clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await authApi.login({ email, password });
      queryClient.clear();
      startSession(session, session.user);
    },
    [queryClient, startSession],
  );

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      const session = await authApi.register({ fullName, email, password });
      queryClient.clear();
      startSession(session, session.user);
    },
    [queryClient, startSession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout(); // revoke the token server-side
    } catch {
      /* offline or already expired — still clear locally */
    }
    clearSession();
    toast.success('You have been logged out');
  }, [clearSession]);

  const value = useMemo(() => ({ status, user, login, register, logout }), [status, user, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
