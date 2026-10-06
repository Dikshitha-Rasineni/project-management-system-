import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../services/config';
import { colors } from '../theme';
import { formatDate } from '../utils/dates';

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);

  const confirmLogout = () =>
    Alert.alert('Log out?', 'You’ll need to log in again to see your projects.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          await logout();
        },
      },
    ]);

  const initials = (user?.fullName ?? '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.createdAt ? <Text style={styles.meta}>Member since {formatDate(user.createdAt.slice(0, 10))}</Text> : null}
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.done} />
          <Text style={styles.infoText}>Your sign-in is stored in the device’s secure keystore.</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="server-outline" size={18} color={colors.inkMute} />
          <Text style={styles.infoText} numberOfLines={2}>
            Connected to {API_URL}
          </Text>
        </View>
      </View>

      <Button
        title="Log out"
        variant="danger"
        onPress={confirmLogout}
        loading={busy}
        icon={<Ionicons name="log-out-outline" size={18} color={colors.danger} />}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 16 },
  card: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 24 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 22, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: 12 },
  email: { fontSize: 15, color: colors.inkSoft, marginTop: 2 },
  meta: { fontSize: 13, color: colors.inkMute, marginTop: 8 },
  infoCard: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { flex: 1, fontSize: 13, color: colors.inkSoft },
});
