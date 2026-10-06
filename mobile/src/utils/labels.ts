import { colors } from '../theme';
import type { ProjectStatus, TaskPriority, TaskStatus } from '../types';

export const TASK_STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
export const PROJECT_STATUSES: ProjectStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
export const PRIORITIES: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW'];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };

type Tone = { fg: string; bg: string; dot: string };

const pending: Tone = { fg: colors.pending, bg: colors.pendingTint, dot: colors.pending };
const progress: Tone = { fg: colors.progress, bg: colors.progressTint, dot: colors.progressBar };
const done: Tone = { fg: colors.done, bg: colors.doneTint, dot: colors.doneBar };

export const taskStatusTone: Record<TaskStatus, Tone> = { PENDING: pending, IN_PROGRESS: progress, COMPLETED: done };
export const projectStatusTone: Record<ProjectStatus, Tone> = { NOT_STARTED: pending, IN_PROGRESS: progress, COMPLETED: done };

export const priorityColor: Record<TaskPriority, string> = {
  HIGH: colors.danger,
  MEDIUM: colors.progressBar,
  LOW: colors.pending,
};
