import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function Notice({ message, tone = 'danger' }: { message: string | null; tone?: 'danger' | 'warn' }) {
  if (!message) return null;
  const c = tone === 'danger' ? { fg: colors.danger, bg: colors.dangerTint } : { fg: colors.progress, bg: colors.progressTint };
  return (
    <View style={[styles.box, { backgroundColor: c.bg, borderColor: c.fg + '40' }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Ionicons name={tone === 'danger' ? 'alert-circle' : 'time-outline'} size={18} color={c.fg} />
      <Text style={[styles.text, { color: c.fg }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, borderRadius: 10, borderWidth: 1 },
  text: { flex: 1, fontSize: 14, lineHeight: 20 },
});
