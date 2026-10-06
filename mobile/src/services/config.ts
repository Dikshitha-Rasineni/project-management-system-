import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolves the backend URL.
 *
 * 1. EXPO_PUBLIC_API_URL (inlined at build time — set it in .env.local for
 *    development or in eas.json for APK builds). This is what production uses.
 * 2. In development only: the IP of the machine running `expo start`, port
 *    4000. That makes a phone running Expo Go on the same Wi-Fi reach the
 *    backend on your laptop without any configuration (Android and iOS).
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.20:8081"
    const host = hostUri?.split(':')[0];
    if (host) return `http://${host}:4000/api`;
    // Android emulator reaches the host machine via 10.0.2.2; the iOS
    // simulator shares the Mac's network, so localhost works there.
    return Platform.OS === 'android' ? 'http://10.0.2.2:4000/api' : 'http://localhost:4000/api';
  }

  // A release build without EXPO_PUBLIC_API_URL is misconfigured; the app
  // will show a clear connection error rather than silently using localhost.
  return 'https://api-url-not-configured.invalid/api';
}

export const API_URL = resolveApiUrl();
