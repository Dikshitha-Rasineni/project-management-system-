import { API_URL } from './config';

/**
 * Small fetch wrapper used by every screen. It
 *  - attaches the Bearer token,
 *  - applies a timeout,
 *  - turns every failure into an ApiError with a user-friendly message,
 *  - reports 401s to the auth layer (expired/invalid session → login).
 */

export type ApiErrorKind = 'network' | 'timeout' | 'unauthorized' | 'validation' | 'not_found' | 'rate_limited' | 'server' | 'client';

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly kind: ApiErrorKind,
    public readonly status?: number,
    public readonly code?: string,
    public readonly fieldErrors: FieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let authToken: string | null = null;
let onUnauthorized: ((code: string | undefined) => void) | null = null;

export function setApiToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: ((code: string | undefined) => void) | null) {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  timeoutMs?: number;
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const params = Object.entries(query ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${API_URL}${path}${params ? `?${params}` : ''}`;
}

export interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<Envelope<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15_000);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    throw aborted
      ? new ApiError('The server took too long to respond. Check your connection and try again.', 'timeout')
      : new ApiError('Can’t reach the server. Check your internet connection and try again.', 'network');
  } finally {
    clearTimeout(timer);
  }

  let payload: { success?: boolean; message?: string; code?: string; errors?: FieldError[] } & Partial<Envelope<T>> = {};
  try {
    payload = await response.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (response.ok) return payload as Envelope<T>;

  const message = payload.message || `Request failed (${response.status})`;
  const status = response.status;

  if (status === 401) {
    const isLoginAttempt = path.startsWith('/auth/login') || path.startsWith('/auth/register');
    if (!isLoginAttempt && authToken) onUnauthorized?.(payload.code);
    throw new ApiError(message, 'unauthorized', status, payload.code);
  }
  if (status === 422 || status === 400) throw new ApiError(message, 'validation', status, payload.code, payload.errors ?? []);
  if (status === 404) throw new ApiError(message, 'not_found', status, payload.code);
  if (status === 429) throw new ApiError(message, 'rate_limited', status, payload.code);
  if (status >= 500) throw new ApiError('The server ran into a problem. Please try again shortly.', 'server', status, payload.code);
  throw new ApiError(message, 'client', status, payload.code, payload.errors ?? []);
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && (error.kind === 'network' || error.kind === 'timeout');
}
