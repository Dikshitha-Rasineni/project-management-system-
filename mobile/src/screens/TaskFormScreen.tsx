import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Segmented } from '../components/Filters';
import { Notice } from '../components/Notice';
import { ErrorView, LoadingView } from '../components/States';
import { TextField } from '../components/TextField';
import { useDeleteTask, useProjects, useSaveTask, useTask } from '../hooks/queries';
import { ApiError, errorMessage } from '../services/api';
import { colors, radius } from '../theme';
import type { TaskPriority, TaskStatus } from '../types';
import { formatDate, fromIsoDate, toIsoDate } from '../utils/dates';
import { PRIORITIES, PRIORITY_LABEL, TASK_STATUSES, TASK_STATUS_LABEL } from '../utils/labels';
import { hasErrors, validateTask, type Errors } from '../utils/validation';

type Field = 'name' | 'description' | 'projectId' | 'dueDate';

/**
 * Create a task (optionally pre-scoped to a project) or edit an existing one.
 * Route params: ?taskId=… (edit) or ?projectId=… (create in project).
 */
export default function TaskFormScreen() {
  const { taskId, projectId: presetProjectId } = useLocalSearchParams<{ taskId?: string; projectId?: string }>();
  const isEdit = Boolean(taskId);
  const insets = useSafeAreaInsets();

  const existing = useTask(taskId);
  const projects = useProjects();
  const save = useSaveTask();
  const del = useDeleteTask();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('PENDING');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [projectId, setProjectId] = useState(presetProjectId ?? '');
  const [showIosPicker, setShowIosPicker] = useState(false);
  const [errors, setErrors] = useState<Errors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(!isEdit);

  // Fill the form once the task to edit has loaded.
  useEffect(() => {
    const t = existing.data;
    if (!t || loaded) return;
    setName(t.name);
    setDescription(t.description ?? '');
    setStatus(t.status);
    setPriority(t.priority);
    setDueDate(t.dueDate);
    setProjectId(t.projectId);
    setLoaded(true);
  }, [existing.data, loaded]);

  const pickDate = () => {
    const value = dueDate ? fromIsoDate(dueDate) : new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'set' && date) setDueDate(toIsoDate(date));
        },
      });
    } else {
      setShowIosPicker((s) => !s);
    }
  };

  const submit = async () => {
    const e = validateTask({ name, description, projectId });
    setErrors(e);
    setFormError(null);
    if (hasErrors(e)) return;
    try {
      await save.mutateAsync({
        id: taskId,
        data: { name: name.trim(), description: description.trim() || null, status, priority, dueDate, projectId },
      });
      router.back();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors.length) {
        setErrors(Object.fromEntries(err.fieldErrors.map((f) => [f.field, f.message])));
      }
      setFormError(errorMessage(err));
    }
  };

  const confirmDelete = () =>
    Alert.alert('Delete task?', `“${name}” will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await del.mutateAsync(taskId!);
            router.back();
          } catch (err) {
            Alert.alert('Couldn’t delete task', errorMessage(err));
          }
        },
      },
    ]);

  if (isEdit && existing.isLoading) return <LoadingView label="Loading task…" />;
  if (isEdit && existing.isError && !existing.data) return <ErrorView error={existing.error} onRetry={() => existing.refetch()} />;

  const projectLocked = Boolean(presetProjectId) && !isEdit;
  const projectName = projects.data?.find((p) => p.id === projectId)?.name;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: isEdit ? 'Edit task' : 'New task' }} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <Notice message={formError} />
        <TextField label="Task name" required value={name} onChangeText={setName} error={errors.name} placeholder="e.g. Implement login page" maxLength={160} />

        {/* Project */}
        <View style={{ gap: 6 }}>
          <Text style={styles.label}>
            Project<Text style={{ color: colors.danger }}> *</Text>
          </Text>
          {projectLocked ? (
            <View style={styles.lockedProject}>
              <Ionicons name="folder-outline" size={16} color={colors.inkSoft} />
              <Text style={styles.lockedText}>{projectName ?? 'This project'}</Text>
            </View>
          ) : projects.isLoading ? (
            <Text style={styles.hint}>Loading projects…</Text>
          ) : projects.data && projects.data.length === 0 ? (
            <Text style={styles.hint}>You have no projects yet. Create one on the web app first.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {projects.data?.map((p) => {
                const active = p.id === projectId;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setProjectId(p.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    style={[styles.projectChip, active && styles.projectChipActive]}
                  >
                    <Text style={[styles.projectChipText, active && { color: colors.white }]} numberOfLines={1}>
                      {p.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
          {errors.projectId ? <Text style={styles.error}>{errors.projectId}</Text> : null}
        </View>

        <TextField
          label="Description"
          value={description}
          onChangeText={setDescription}
          error={errors.description}
          multiline
          placeholder="Details, links or acceptance criteria"
          maxLength={2000}
        />

        <Segmented label="Status" value={status} onChange={setStatus} options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABEL[s] }))} />
        <Segmented label="Priority" value={priority} onChange={setPriority} options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))} />

        {/* Due date */}
        <View style={{ gap: 6 }}>
          <Text style={styles.label}>Due date</Text>
          <View style={styles.dateRow}>
            <Pressable onPress={pickDate} style={styles.dateBtn} accessibilityRole="button" accessibilityLabel="Choose due date">
              <Ionicons name="calendar-outline" size={18} color={colors.inkSoft} />
              <Text style={[styles.dateText, !dueDate && { color: colors.inkMute }]}>{dueDate ? formatDate(dueDate) : 'No due date'}</Text>
            </Pressable>
            {dueDate ? (
              <Pressable onPress={() => setDueDate(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear due date" style={styles.clear}>
                <Text style={{ color: colors.action, fontWeight: '600' }}>Clear</Text>
              </Pressable>
            ) : null}
          </View>
          {errors.dueDate ? <Text style={styles.error}>{errors.dueDate}</Text> : null}
          {showIosPicker && Platform.OS === 'ios' ? (
            <DateTimePicker
              value={dueDate ? fromIsoDate(dueDate) : new Date()}
              mode="date"
              display="inline"
              onChange={(_e, d) => d && setDueDate(toIsoDate(d))}
            />
          ) : null}
        </View>

        <Button title={isEdit ? 'Save changes' : 'Create task'} onPress={submit} loading={save.isPending} style={{ marginTop: 8 }} />
        {isEdit ? <Button title="Delete task" variant="danger" onPress={confirmDelete} loading={del.isPending} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 18 },
  label: { fontSize: 13, fontWeight: '600', color: colors.ink },
  hint: { fontSize: 14, color: colors.inkMute },
  error: { fontSize: 13, color: colors.danger },
  lockedProject: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: radius.control,
    backgroundColor: colors.pendingTint,
  },
  lockedText: { fontSize: 15, color: colors.ink, fontWeight: '500' },
  projectChip: {
    height: 40,
    maxWidth: 220,
    paddingHorizontal: 14,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  projectChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  projectChipText: { fontSize: 14, color: colors.inkSoft, fontWeight: '500' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
  },
  dateText: { fontSize: 15, color: colors.ink },
  clear: { paddingHorizontal: 4 },
});
