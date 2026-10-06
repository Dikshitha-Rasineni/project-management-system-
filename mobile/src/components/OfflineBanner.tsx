import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

/** App-wide banner shown whenever the device has no network connection. */
export function OfflineBanner() {
  const net = useNetInfo();
  const insets = useSafeAreaInsets();
  // isConnected is null while unknown — only warn when we know we're offline.
  const offline = net.isConnected === false || net.isInternetReachable === false;
  if (!offline) return null;
  return (
    <View style={[styles.banner, { paddingTop: insets.top + 8 }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Ionicons name="cloud-offline-outline" size={16} color={colors.progress} />
      <Text style={styles.text}>You’re offline. Changes can’t be saved until you reconnect.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: colors.progressTint,
  },
  text: { flex: 1, fontSize: 13, color: colors.progress, fontWeight: '500' },
});
