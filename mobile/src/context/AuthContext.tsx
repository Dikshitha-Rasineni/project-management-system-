import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { ApiError, setApiToken, setUnauthorizedHandler } from '../services/api';
import { authApi } from '../services/endpoints';
import { clearSession, isExpired, loadSession, saveSession, type StoredSession } from '../services/secureSession';
import type { Session, User } from '../types';

type Status = 'restoring' | 'signedIn' | 'signedOut';

interface AuthContextValue {
  status: Status;
  user: User | null;
  /** Shown on the login screen, e.g. "Your session has expired…". */
  notice: string | null;
  clearNotice: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const EXPIRED = 'Your session has expired. Please log in again.';
const INVALID = 'You’ve been signed out. Please log in again.';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>('restoring');
  const [user, setUser] = useState<User | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const session = useRef<StoredSession | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /** Clears token, secure storage and cached data; optional message for the login screen. */
  const endSession = useCallback(
    async (message: string | null) => {
      clearTimeout(timer.current);
      session.current = null;
      setApiToken(null);
      await clearSession();
      queryClient.clear();
      setUser(null);
      setNotice(message);
      setStatus('signedOut');
    },
    [queryClient],
  );

  const scheduleExpiry = useCallback(
    (expiresAt: string) => {
      clearTimeout(timer.current);
      const ms = Date.parse(expiresAt) - Date.now();
      if (ms > 0 && ms < 2 ** 31 - 1) timer.current = setTimeout(() => endSession(EXPIRED), ms);
    },
    [endSession],
  );

  const beginSession = useCallback(
    async (s: Session) => {
      await saveSession(s);
      session.current = { token: s.token, expiresAt: s.expiresAt, user: s.user };
      setApiToken(s.token);
      queryClient.clear();
      setUser(s.user);
      setNotice(null);
      setStatus('signedIn');
      scheduleExpiry(s.expiresAt);
    },
    [queryClient, scheduleExpiry],
  );

  // Any 401 from the API ends the session and returns to login with a reason.
  useEffect(() => {
    setUnauthorizedHandler((code) => {
      void endSession(code === 'TOKEN_EXPIRED' ? EXPIRED : INVALID);
    });
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  // Restore the session from SecureStore on launch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadSession();
      if (cancelled) return;
      if (!stored) {
        setStatus('signedOut');
        return;
      }
      if (isExpired(stored.expiresAt)) {
        await endSession(EXPIRED);
        return;
      }
      session.current = stored;
      setApiToken(stored.token);
      setUser(stored.user);
      setStatus('signedIn');
      scheduleExpiry(stored.expiresAt);
      // Confirm with the server in the background. A 401 is handled by the
      // unauthorized handler; a network error keeps the user signed in so the
      // screens can show "no connection" instead of kicking them out.
      try {
        const me = await authApi.me();
        if (!cancelled) setUser(me);
      } catch (err) {
        if (!(err instanceof ApiError)) await endSession(INVALID);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [endSession, scheduleExpiry]);

  // Timers don't run while the app is in the background — re-check on resume.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && session.current && isExpired(session.current.expiresAt)) {
        void endSession(EXPIRED);
      }
    });
    return () => sub.remove();
  }, [endSession]);

  const login = useCallback(
    async (email: string, password: string) => beginSession(await authApi.login(email, password)),
    [beginSession],
  );

  const register = useCallback(
    async (fullName: string, email: string, password: string) =>
      beginSession(await authApi.register(fullName, email, password)),
    [beginSession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout(); // revoke server-side; ignore if offline
    } catch {
      /* still sign out locally */
    }
    await endSession(null);
  }, [endSession]);

  const value = useMemo(
    () => ({ status, user, notice, clearNotice: () => setNotice(null), login, register, logout }),
    [status, user, notice, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
