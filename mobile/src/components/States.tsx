import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { isNetworkError } from '../services/api';
import { colors } from '../theme';
import { Button } from './Button';

export function LoadingView({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colors.action} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

/**
 * Friendly error screen. Network problems get their own wording and icon —
 * never a crash or a blank screen.
 */
export function ErrorView({ error, message, onRetry }: { error?: unknown; message?: string; onRetry?: () => void }) {
  const offline = isNetworkError(error);
  return (
    <View style={styles.center} accessibilityRole="alert">
      <View style={[styles.iconWrap, { backgroundColor: offline ? colors.progressTint : colors.dangerTint }]}>
        <Ionicons name={offline ? 'cloud-offline-outline' : 'alert-circle-outline'} size={28} color={offline ? colors.progress : colors.danger} />
      </View>
      <Text style={styles.title}>{offline ? 'No connection' : 'Couldn’t load this'}</Text>
      <Text style={styles.body}>{message ?? (error instanceof Error ? error.message : 'Something went wrong.')}</Text>
      {onRetry && <Button title="Try again" variant="secondary" onPress={onRetry} style={{ marginTop: 16, minWidth: 140 }} />}
    </View>
  );
}

export function EmptyView({
  icon,
  title,
  body,
  action,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={30} color={colors.inkMute} />
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {action ? <View style={{ marginTop: 16 }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 6, minHeight: 320 },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.lineStrong,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 17, fontWeight: '600', color: colors.ink, marginTop: 4 },
  body: { fontSize: 14, color: colors.inkSoft, textAlign: 'center', maxWidth: 300, lineHeight: 20 },
  muted: { fontSize: 14, color: colors.inkMute, marginTop: 8 },
});
