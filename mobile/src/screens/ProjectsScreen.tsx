import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ProjectStatusPill } from '../components/Badges';
import { ChipRow, SearchBar } from '../components/Filters';
import { ProgressBar } from '../components/ProgressBar';
import { EmptyView, ErrorView, LoadingView } from '../components/States';
import { useProjects } from '../hooks/queries';
import { useDebounce } from '../hooks/useDebounce';
import { useRefresh } from '../hooks/useRefresh';
import { colors } from '../theme';
import type { Project, ProjectStatus } from '../types';
import { formatDate } from '../utils/dates';
import { PROJECT_STATUSES, PROJECT_STATUS_LABEL } from '../utils/labels';

function ProjectCard({ p }: { p: Project }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/project/[id]', params: { id: p.id } })}
      style={({ pressed }) => [styles.card, pressed && { borderColor: colors.inkMute }]}
      accessibilityRole="button"
      accessibilityLabel={`${p.name}, ${PROJECT_STATUS_LABEL[p.status]}, ${p.progress}% complete`}
    >
      <View style={styles.cardTop}>
        <Text style={styles.name} numberOfLines={2}>
          {p.name}
        </Text>
        <ProjectStatusPill status={p.status} />
      </View>
      {p.description ? (
        <Text style={styles.desc} numberOfLines={2}>
          {p.description}
        </Text>
      ) : null}
      <View style={styles.progressRow}>
        <View style={{ flex: 1 }}>
          <ProgressBar value={p.progress} />
        </View>
        <Text style={styles.meta}>
          {p.completedTaskCount}/{p.taskCount} tasks
        </Text>
      </View>
      <View style={styles.dates}>
        <Ionicons name="calendar-outline" size={13} color={colors.inkMute} />
        <Text style={styles.meta}>
          {formatDate(p.startDate, '—', false)} – {p.endDate ? formatDate(p.endDate, '—', false) : 'No end date'}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ProjectsScreen() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProjectStatus | ''>('');
  const debounced = useDebounce(search.trim());
  const { data, isLoading, isError, error, refetch } = useProjects({ search: debounced, status });
  const { refreshing, onRefresh } = useRefresh(refetch);
  const filtered = Boolean(debounced || status);

  return (
    <FlatList<Project>
      data={isError && !data ? [] : (data ?? [])}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => <ProjectCard p={item} />}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.header}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search projects by name" />
          <ChipRow
            label="Status"
            value={status}
            onChange={setStatus}
            options={PROJECT_STATUSES.map((s) => ({ value: s, label: PROJECT_STATUS_LABEL[s] }))}
          />
        </View>
      }
      ListEmptyComponent={
        isLoading ? (
          <LoadingView label="Loading projects…" />
        ) : isError ? (
          <ErrorView error={error} onRetry={() => refetch()} />
        ) : filtered ? (
          <EmptyView icon="search-outline" title="No projects match" body="Try a different name or status." />
        ) : (
          <EmptyView icon="folder-open-outline" title="No projects yet" body="Create a project on the web app, then pull down to refresh." />
        )
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.action]} tintColor={colors.action} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  header: { gap: 10, marginBottom: 4 },
  card: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  name: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.ink },
  desc: { fontSize: 14, color: colors.inkSoft, lineHeight: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  meta: { fontSize: 12, color: colors.inkMute },
  dates: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
