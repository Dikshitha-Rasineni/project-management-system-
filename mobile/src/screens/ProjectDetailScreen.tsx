import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ProjectStatusPill } from '../components/Badges';
import { ProgressBar } from '../components/ProgressBar';
import { EmptyView, ErrorView, LoadingView } from '../components/States';
import { TaskListView } from '../components/TaskListView';
import { useProject } from '../hooks/queries';
import { ApiError } from '../services/api';
import { colors } from '../theme';
import { formatDate } from '../utils/dates';

/** Project summary on top, then the project's tasks with search & filters. */
export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: project, isLoading, isError, error, refetch } = useProject(id ?? '');

  if (isLoading) return <LoadingView label="Loading project…" />;
  if (isError && !project) {
    if (error instanceof ApiError && (error.kind === 'not_found' || error.status === 400)) {
      return (
        <View style={{ padding: 16 }}>
          <EmptyView icon="folder-open-outline" title="Project not found" body="It may have been deleted on another device." />
        </View>
      );
    }
    return <ErrorView error={error} onRetry={() => refetch()} />;
  }
  if (!project) return null;

  const header = (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.name}>{project.name}</Text>
        <ProjectStatusPill status={project.status} />
      </View>
      {project.description ? <Text style={styles.desc}>{project.description}</Text> : null}
      <View style={styles.dates}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Start</Text>
          <Text style={styles.dateValue}>{formatDate(project.startDate)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>End</Text>
          <Text style={styles.dateValue}>{formatDate(project.endDate, 'Not set')}</Text>
        </View>
      </View>
      <View style={{ gap: 6 }}>
        <View style={styles.progressText}>
          <Text style={styles.label}>Progress</Text>
          <Text style={styles.label}>
            {project.completedTaskCount} of {project.taskCount} tasks · {project.progress}%
          </Text>
        </View>
        <ProgressBar value={project.progress} />
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: project.name }} />
      <TaskListView projectId={project.id} header={header} onRefreshExtra={refetch} />
    </>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 12 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  name: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.ink },
  desc: { fontSize: 14, color: colors.inkSoft, lineHeight: 20 },
  dates: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 12, color: colors.inkMute },
  dateValue: { fontSize: 15, fontWeight: '500', color: colors.ink, marginTop: 2 },
  progressText: { flexDirection: 'row', justifyContent: 'space-between' },
});
