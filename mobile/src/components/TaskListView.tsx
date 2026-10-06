import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState, type ReactElement } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks } from '../hooks/queries';
import { useDebounce } from '../hooks/useDebounce';
import { colors } from '../theme';
import type { Task, TaskPriority, TaskStatus } from '../types';
import { PRIORITIES, PRIORITY_LABEL, TASK_STATUSES, TASK_STATUS_LABEL } from '../utils/labels';
import { ChipRow, SearchBar } from './Filters';
import { EmptyView, ErrorView, LoadingView } from './States';
import { TaskRow } from './TaskRow';

interface Props {
  /** Scope the list to one project; omit for "all tasks". */
  projectId?: string;
  /** Rendered above the filters (e.g. project summary). */
  header?: ReactElement;
  /** Extra refetch on pull-to-refresh (e.g. the project itself). */
  onRefreshExtra?: () => Promise<unknown>;
}

/**
 * Searchable, filterable task list with pull-to-refresh and an add button.
 * Search and filters are sent to the backend as query parameters.
 */
export function TaskListView({ projectId, header, onRefreshExtra }: Props) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const debounced = useDebounce(search.trim());

  const query = useTasks({ projectId, search: debounced, status, priority });
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([query.refetch(), onRefreshExtra?.()]);
    } finally {
      setRefreshing(false);
    }
  }, [query, onRefreshExtra]);

  const filtered = Boolean(debounced || status || priority);
  const tasks = query.data ?? [];

  const listHeader = (
    <View style={styles.headerWrap}>
      {header}
      <View style={styles.filters}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search tasks by name" />
        <ChipRow
          label="Status"
          value={status}
          onChange={setStatus}
          options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABEL[s] }))}
        />
        <ChipRow
          label="Priority"
          value={priority}
          onChange={setPriority}
          options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))}
        />
      </View>
      {query.data && (
        <Text style={styles.count}>
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          {filtered ? ' match' : ''}
        </Text>
      )}
    </View>
  );

  const empty = query.isLoading ? (
    <LoadingView label="Loading tasks…" />
  ) : query.isError ? (
    <ErrorView error={query.error} onRetry={() => query.refetch()} />
  ) : filtered ? (
    <EmptyView icon="search-outline" title="No tasks match" body="Try a different name, status or priority." />
  ) : (
    <EmptyView
      icon="checkbox-outline"
      title="No tasks yet"
      body={projectId ? 'Add the first task for this project.' : 'Tasks you add to your projects show up here.'}
    />
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList<Task>
        data={query.isError && !query.data ? [] : tasks}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TaskRow task={item} showProject={!projectId} />}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={<View style={styles.emptyWrap}>{empty}</View>}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.action]} tintColor={colors.action} />}
      />
      <Pressable
        onPress={() => router.push({ pathname: '/task-form', params: projectId ? { projectId } : {} })}
        style={({ pressed }) => [styles.fab, { bottom: 20 + (projectId ? insets.bottom : 0) }, pressed && { backgroundColor: colors.actionPressed }]}
        accessibilityRole="button"
        accessibilityLabel="Add task"
      >
        <Ionicons name="add" size={22} color={colors.white} />
        <Text style={styles.fabText}>Add task</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  filters: { gap: 10 },
  count: { fontSize: 13, color: colors.inkMute, marginTop: 4, marginBottom: 8 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: 52 },
  emptyWrap: { paddingHorizontal: 16 },
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 26,
    backgroundColor: colors.action,
    elevation: 4,
    shadowColor: colors.ink,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: colors.white, fontWeight: '600', fontSize: 15 },
});
