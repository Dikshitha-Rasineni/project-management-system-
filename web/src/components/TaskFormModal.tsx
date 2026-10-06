import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useProjects, useSaveTask } from '../hooks/queries';
import { applyServerErrors } from '../hooks/useServerErrors';
import type { Task } from '../types';
import { PRIORITIES, PRIORITY_LABEL, TASK_STATUSES, TASK_STATUS_LABEL } from '../utils/constants';
import { taskSchema, type TaskValues } from '../utils/validation';
import { FormAlert } from './FormAlert';
import { Button } from './ui/Button';
import { Field, Input, Select, Textarea } from './ui/Field';
import { Modal } from './ui/Modal';

interface Props {
  open: boolean;
  task?: Task | null;
  /** Pre-selected (and locked) project when adding from a project page. */
  projectId?: string;
  onClose: () => void;
}

const FIELDS = ['name', 'description', 'priority', 'status', 'dueDate', 'projectId'] as const;

function toValues(task?: Task | null, projectId?: string): TaskValues {
  return {
    name: task?.name ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? 'MEDIUM',
    status: task?.status ?? 'PENDING',
    dueDate: task?.dueDate ?? '',
    projectId: task?.projectId ?? projectId ?? '',
  };
}

export function TaskFormModal({ open, task, projectId, onClose }: Props) {
  const isEdit = Boolean(task);
  const save = useSaveTask();
  const [formError, setFormError] = useState<string | null>(null);
  // Project picker is only needed when the project is not fixed by context.
  const needsPicker = !projectId;
  const projects = useProjects({ limit: 100, sortBy: 'name', order: 'asc' }, open && needsPicker);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TaskValues>({ resolver: zodResolver(taskSchema), defaultValues: toValues(task, projectId) });

  useEffect(() => {
    if (open) {
      reset(toValues(task, projectId));
      setFormError(null);
    }
  }, [open, task, projectId, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await save.mutateAsync({
        id: task?.id,
        data: {
          name: values.name.trim(),
          description: values.description.trim() || null,
          priority: values.priority,
          status: values.status,
          dueDate: values.dueDate || null,
          projectId: values.projectId,
        },
      });
      onClose();
    } catch (err) {
      setFormError(applyServerErrors(err, setError, FIELDS));
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit task' : 'New task'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormAlert message={formError} />
        <Field label="Task name" required error={errors.name?.message}>
          {(a) => (
            <Input {...a} {...register('name')} invalid={!!errors.name} autoFocus placeholder="e.g. Implement login page" />
          )}
        </Field>
        {needsPicker && (
          <Field label="Project" required error={errors.projectId?.message}>
            {(a) => (
              <Select {...a} {...register('projectId')} invalid={!!errors.projectId} disabled={projects.isLoading}>
                <option value="">{projects.isLoading ? 'Loading projects…' : 'Choose a project'}</option>
                {projects.data?.items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <Field label="Description" error={errors.description?.message}>
          {(a) => (
            <Textarea
              {...a}
              {...register('description')}
              invalid={!!errors.description}
              placeholder="Add details, links or acceptance criteria"
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Status" required error={errors.status?.message}>
            {(a) => (
              <Select {...a} {...register('status')} invalid={!!errors.status}>
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {TASK_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Priority" required error={errors.priority?.message}>
            {(a) => (
              <Select {...a} {...register('priority')} invalid={!!errors.priority}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Due date" error={errors.dueDate?.message}>
            {(a) => <Input {...a} type="date" {...register('dueDate')} invalid={!!errors.dueDate} />}
          </Field>
        </div>
      </form>
    </Modal>
  );
}
