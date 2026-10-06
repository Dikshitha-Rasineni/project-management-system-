import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PriorityMark } from '../components/Badges';
import { ErrorView, LoadingView } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../hooks/queries';
import { useRefresh } from '../hooks/useRefresh';
import { colors } from '../theme';
import type { DashboardStats } from '../types';
import { dueLabel } from '../utils/dates';

function Stat({ label, value, onPress, wide }: { label: string; value: number; onPress: () => void; wide?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.stat, wide && { flexBasis: '100%' }, pressed && { backgroundColor: colors.paper }]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </Pressable>
  );
}

function WorkBar({ d }: { d: DashboardStats }) {
  const segs = [
    { label: 'Completed', value: d.completedTasks, color: colors.doneBar },
    { label: 'In progress', value: d.inProgressTasks, color: colors.progressBar },
    { label: 'Pending', value: d.pendingTasks, color: colors.pending + '90' },
  ];
  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>Task progress</Text>
        <Text style={styles.small}>
          <Text style={styles.rate}>{d.completionRate}%</Text> done
        </Text>
      </View>
      <View style={styles.bar}>
        {d.totalTasks === 0 ? (
          <View style={{ flex: 1, backgroundColor: colors.line }} />
        ) : (
          segs.filter((s) => s.value > 0).map((s) => <View key={s.label} style={{ flex: s.value, backgroundColor: s.color }} />)
        )}
      </View>
      <View style={styles.legend}>
        {segs.map((s) => (
          <View key={s.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.small}>
              {s.label} <Text style={styles.strong}>{s.value}</Text>
            </Text>
          </View>
        ))}
        {d.overdueTasks > 0 && (
          <View style={styles.legendItem}>
            <Ionicons name="warning-outline" size={14} color={colors.danger} />
            <Text style={[styles.small, { color: colors.danger, fontWeight: '600' }]}>{d.overdueTasks} overdue</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useDashboard();
  const { refreshing, onRefresh } = useRefresh(refetch);
  const firstName = user?.fullName.split(' ')[0] ?? '';

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.action]} tintColor={colors.action} />}
    >
      <Text style={styles.hello}>Hi, {firstName}</Text>
      <Text style={styles.sub}>Here’s where your work stands.</Text>

      {isLoading ? (
        <LoadingView label="Loading your dashboard…" />
      ) : isError && !data ? (
        <ErrorView error={error} onRetry={() => refetch()} />
      ) : data ? (
        <View style={{ gap: 16 }}>
          <View style={styles.grid}>
            <Stat label="Total projects" value={data.totalProjects} onPress={() => router.navigate('/projects')} />
            <Stat label="In progress" value={data.projectsInProgress} onPress={() => router.navigate('/projects')} />
            <Stat label="Total tasks" value={data.totalTasks} onPress={() => router.navigate('/tasks')} />
            <Stat label="Completed tasks" value={data.completedTasks} onPress={() => router.navigate('/tasks')} />
            <Stat label="Pending tasks" value={data.pendingTasks} onPress={() => router.navigate('/tasks')} wide />
          </View>

          <WorkBar d={data} />

          <View style={styles.card}>
            <Text style={[styles.cardTitle, { marginBottom: 4 }]}>Upcoming deadlines</Text>
            {data.upcomingTasks.length === 0 ? (
              <Text style={[styles.small, { paddingVertical: 12 }]}>No open tasks with a due date.</Text>
            ) : (
              data.upcomingTasks.map((t, i) => {
                const due = dueLabel(t.dueDate, false);
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => router.push({ pathname: '/project/[id]', params: { id: t.projectId } })}
                    style={[styles.upRow, i > 0 && styles.upBorder]}
                    accessibilityRole="button"
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.upName} numberOfLines={1}>
                        {t.name}
                      </Text>
                      <Text style={styles.small} numberOfLines={1}>
                        {t.project?.name}
                      </Text>
                    </View>
                    <PriorityMark priority={t.priority} showLabel={false} />
                    <Text
                      style={[
                        styles.upDue,
                        due.tone === 'late' && { color: colors.danger, fontWeight: '600' },
                        due.tone === 'warn' && { color: colors.progress },
                      ]}
                    >
                      {due.text}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  hello: { fontSize: 26, fontWeight: '700', color: colors.ink, letterSpacing: -0.4 },
  sub: { fontSize: 15, color: colors.inkSoft, marginTop: 2, marginBottom: 18 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
    backgroundColor: colors.line,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    overflow: 'hidden',
  },
  stat: { flexBasis: '49.8%', flexGrow: 1, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 14 },
  statLabel: { fontSize: 13, color: colors.inkSoft },
  statValue: { fontSize: 28, fontWeight: '700', color: colors.ink, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  rate: { fontSize: 20, fontWeight: '700', color: colors.ink },
  small: { fontSize: 13, color: colors.inkSoft },
  strong: { fontWeight: '700', color: colors.ink },
  bar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', gap: 3, marginTop: 14, backgroundColor: colors.paper },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  upRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  upBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  upName: { fontSize: 15, fontWeight: '500', color: colors.ink },
  upDue: { fontSize: 13, color: colors.inkSoft, minWidth: 78, textAlign: 'right' },
});
