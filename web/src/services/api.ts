import axios, { AxiosError } from 'axios';

/**
 * Base URL of the shared backend. Set VITE_API_URL at build time
 * (e.g. https://pms-api.onrender.com/api). In local dev it falls back to the
 * backend's default port; in a production build without the variable it
 * assumes the API is served from the same origin under /api.
 */
export const API_URL: string = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');

const TOKEN_KEY = 'pms.session';

export const api = axios.create({ baseURL: API_URL, timeout: 15_000 });

let currentToken: string | null = null;
let onSessionInvalid: ((message: string) => void) | null = null;

export function setAuthToken(token: string | null) {
  currentToken = token;
}

/** The auth context registers a handler that logs out + redirects. */
export function registerSessionInvalidHandler(handler: (message: string) => void) {
  onSessionInvalid = handler;
}

api.interceptors.request.use((config) => {
  if (currentToken) config.headers.Authorization = `Bearer ${currentToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ code?: string; message?: string }>) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const isAuthCall = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
    if (status === 401 && !isAuthCall && currentToken && onSessionInvalid) {
      onSessionInvalid(
        code === 'TOKEN_EXPIRED'
          ? 'Your session has expired. Please log in again.'
          : 'Your session is no longer valid. Please log in again.',
      );
    }
    return Promise.reject(error);
  },
);

export interface FieldError {
  field: string;
  message: string;
}

/** Turns any thrown value into a human-readable message. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return error.code === 'ECONNABORTED'
        ? 'The server took too long to respond. Check your connection and try again.'
        : 'Cannot reach the server. Check your internet connection and try again.';
    }
    const data = error.response.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function getFieldErrors(error: unknown): FieldError[] {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { errors?: FieldError[] } | undefined;
    return data?.errors ?? [];
  }
  return [];
}

// ---- Session persistence --------------------------------------------------
// Web: localStorage keeps the user signed in across browser restarts until
// logout or token expiry (see README → Security for the trade-off).

export interface StoredSession {
  token: string;
  expiresAt: string;
}

export function loadStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed.token || !parsed.expiresAt) return null;
    if (Date.parse(parsed.expiresAt) <= Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function storeSession(session: StoredSession | null) {
  try {
    if (session) localStorage.setItem(TOKEN_KEY, JSON.stringify(session));
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable (private mode) — session lasts for this tab only */
  }
}
