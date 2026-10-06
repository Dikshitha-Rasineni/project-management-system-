import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { memo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useDeleteTask, useUpdateTask } from '../hooks/queries';
import { errorMessage } from '../services/api';
import { colors } from '../theme';
import type { Task, TaskInput, TaskPriority, TaskStatus } from '../types';
import { dueLabel } from '../utils/dates';
import { PRIORITIES, PRIORITY_LABEL, TASK_STATUSES, TASK_STATUS_LABEL } from '../utils/labels';
import { PriorityMark, TaskStatusPill } from './Badges';

/**
 * One task:
 *  - tick box      → mark completed / reopen
 *  - status pill   → choose a new status
 *  - priority mark → choose a new priority
 *  - tap the row   → edit form;  long-press → delete
 */
function TaskRowImpl({ task, showProject }: { task: Task; showProject?: boolean }) {
  const update = useUpdateTask();
  const del = useDeleteTask();
  const done = task.status === 'COMPLETED';
  const due = dueLabel(task.dueDate, done);
  const busy = update.isPending || del.isPending;

  const change = (data: Partial<TaskInput>) =>
    update.mutate({ id: task.id, data }, { onError: (e) => Alert.alert('Couldn’t update task', errorMessage(e)) });

  const pickStatus = () =>
    Alert.alert(
      'Change status',
      task.name,
      TASK_STATUSES.map((s: TaskStatus) => ({ text: TASK_STATUS_LABEL[s], onPress: () => s !== task.status && change({ status: s }) })),
      { cancelable: true },
    );

  const pickPriority = () =>
    Alert.alert(
      'Change priority',
      task.name,
      PRIORITIES.map((p: TaskPriority) => ({ text: PRIORITY_LABEL[p], onPress: () => p !== task.priority && change({ priority: p }) })),
      { cancelable: true },
    );

  const confirmDelete = () =>
    Alert.alert('Delete task?', `“${task.name}” will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => del.mutate(task.id, { onError: (e) => Alert.alert('Couldn’t delete task', errorMessage(e)) }),
      },
    ]);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/task-form', params: { taskId: task.id } })}
      onLongPress={confirmDelete}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.paper }, busy && { opacity: 0.55 }]}
      accessibilityRole="button"
      accessibilityLabel={`${task.name}, ${TASK_STATUS_LABEL[task.status]}, ${PRIORITY_LABEL[task.priority]} priority, ${due.text}`}
      accessibilityHint="Opens the task to edit. Long-press to delete."
    >
      <Pressable
        onPress={() => change({ status: done ? 'PENDING' : 'COMPLETED' })}
        disabled={busy}
        hitSlop={10}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? 'Mark as not completed' : 'Mark as completed'}
        style={[styles.check, done && styles.checkDone]}
      >
        {done && <Ionicons name="checkmark" size={16} color={colors.white} />}
      </Pressable>

      <View style={styles.body}>
        <Text style={[styles.name, done && styles.nameDone]} numberOfLines={2}>
          {task.name}
        </Text>
        {showProject && task.project ? (
          <Text style={styles.project} numberOfLines={1}>
            {task.project.name}
          </Text>
        ) : task.description ? (
          <Text style={styles.project} numberOfLines={1}>
            {task.description}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <Pressable onPress={pickStatus} hitSlop={6} accessibilityRole="button" accessibilityLabel="Change status">
            <TaskStatusPill status={task.status} />
          </Pressable>
          <Pressable onPress={pickPriority} hitSlop={6} accessibilityRole="button" accessibilityLabel="Change priority">
            <PriorityMark priority={task.priority} />
          </Pressable>
          <Text style={[styles.due, due.tone === 'late' && styles.late, due.tone === 'warn' && styles.warn]}>{due.text}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.lineStrong} />
    </Pressable>
  );
}

export const TaskRow = memo(TaskRowImpl);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  checkDone: { backgroundColor: colors.doneBar, borderColor: colors.doneBar },
  body: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: '600', color: colors.ink },
  nameDone: { color: colors.inkMute, textDecorationLine: 'line-through' },
  project: { fontSize: 13, color: colors.inkMute },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  due: { fontSize: 12, color: colors.inkMute },
  late: { color: colors.danger, fontWeight: '600' },
  warn: { color: colors.progress, fontWeight: '500' },
});
