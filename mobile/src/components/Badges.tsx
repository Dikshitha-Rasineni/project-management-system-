import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import type { ProjectStatus, TaskPriority, TaskStatus } from '../types';
import {
  PRIORITY_LABEL,
  PROJECT_STATUS_LABEL,
  TASK_STATUS_LABEL,
  priorityColor,
  projectStatusTone,
  taskStatusTone,
} from '../utils/labels';

function Pill({ label, fg, bg, dot }: { label: string; fg: string; bg: string; dot: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]} accessibilityLabel={`Status: ${label}`}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function TaskStatusPill({ status }: { status: TaskStatus }) {
  const t = taskStatusTone[status];
  return <Pill label={TASK_STATUS_LABEL[status]} {...t} />;
}

export function ProjectStatusPill({ status }: { status: ProjectStatus }) {
  const t = projectStatusTone[status];
  return <Pill label={PROJECT_STATUS_LABEL[status]} {...t} />;
}

/** Three rising bars — readable without relying on colour alone. */
export function PriorityMark({ priority, showLabel = true }: { priority: TaskPriority; showLabel?: boolean }) {
  const level = priority === 'HIGH' ? 3 : priority === 'MEDIUM' ? 2 : 1;
  const c = priorityColor[priority];
  return (
    <View style={styles.priority} accessibilityLabel={`${PRIORITY_LABEL[priority]} priority`}>
      <View style={styles.bars}>
        {[6, 10, 14].map((h, i) => (
          <View key={h} style={[styles.bar, { height: h, backgroundColor: i < level ? c : colors.line }]} />
        ))}
      </View>
      {showLabel && <Text style={styles.priorityText}>{PRIORITY_LABEL[priority]}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 8,
    paddingRight: 10,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 12, fontWeight: '600' },
  priority: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 3, borderRadius: 1 },
  priorityText: { fontSize: 12, fontWeight: '500', color: colors.inkSoft },
});
