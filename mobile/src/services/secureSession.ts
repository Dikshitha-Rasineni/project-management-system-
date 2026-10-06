import * as SecureStore from 'expo-secure-store';
import type { Session, User } from '../types';

/**
 * The session lives ONLY in SecureStore, which is backed by the Android
 * Keystore (encrypted SharedPreferences) and the iOS Keychain — never in
 * plain AsyncStorage.
 */
const KEY = 'pms.session.v1';

const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export interface StoredSession {
  token: string;
  expiresAt: string;
  user: User;
}

export async function saveSession(session: Session): Promise<void> {
  const value: StoredSession = { token: session.token, expiresAt: session.expiresAt, user: session.user };
  await SecureStore.setItemAsync(KEY, JSON.stringify(value), options);
}

export async function loadSession(): Promise<StoredSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY, options);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed?.token && parsed.expiresAt && parsed.user ? parsed : null;
  } catch {
    // Corrupted entry or keystore reset (e.g. app data restored to a new
    // device): treat as signed out.
    await clearSession();
    return null;
  }
}

export async function clearSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY, options);
  } catch {
    /* nothing to delete */
  }
}

export function isExpired(expiresAt: string, skewMs = 5_000): boolean {
  const t = Date.parse(expiresAt);
  return Number.isNaN(t) || t - skewMs <= Date.now();
}
