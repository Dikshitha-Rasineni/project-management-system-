import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSaveProject } from '../hooks/queries';
import { applyServerErrors } from '../hooks/useServerErrors';
import type { Project } from '../types';
import { PROJECT_STATUSES, PROJECT_STATUS_LABEL } from '../utils/constants';
import { todayIso } from '../utils/dates';
import { projectSchema, type ProjectValues } from '../utils/validation';
import { FormAlert } from './FormAlert';
import { Button } from './ui/Button';
import { Field, Input, Select, Textarea } from './ui/Field';
import { Modal } from './ui/Modal';

interface Props {
  open: boolean;
  project?: Project | null;
  onClose: () => void;
  onSaved?: (project: Project) => void;
}

const FIELDS = ['name', 'description', 'status', 'startDate', 'endDate'] as const;

function toValues(project?: Project | null): ProjectValues {
  return {
    name: project?.name ?? '',
    description: project?.description ?? '',
    status: project?.status ?? 'NOT_STARTED',
    startDate: project?.startDate ?? todayIso(),
    endDate: project?.endDate ?? '',
  };
}

export function ProjectFormModal({ open, project, onClose, onSaved }: Props) {
  const isEdit = Boolean(project);
  const save = useSaveProject();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ProjectValues>({ resolver: zodResolver(projectSchema), defaultValues: toValues(project) });

  useEffect(() => {
    if (open) {
      reset(toValues(project));
      setFormError(null);
    }
  }, [open, project, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const saved = await save.mutateAsync({
        id: project?.id,
        data: {
          name: values.name.trim(),
          description: values.description.trim() || null,
          status: values.status,
          startDate: values.startDate,
          endDate: values.endDate || null,
        },
      });
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setFormError(applyServerErrors(err, setError, FIELDS));
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit project' : 'New project'}
      description={isEdit ? undefined : 'Give it a name and a start date. You can add tasks next.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormAlert message={formError} />
        <Field label="Project name" required error={errors.name?.message}>
          {(a) => <Input {...a} {...register('name')} invalid={!!errors.name} autoFocus placeholder="e.g. Website redesign" />}
        </Field>
        <Field label="Description" error={errors.description?.message}>
          {(a) => (
            <Textarea
              {...a}
              {...register('description')}
              invalid={!!errors.description}
              placeholder="What is this project about?"
            />
          )}
        </Field>
        <Field label="Status" required error={errors.status?.message}>
          {(a) => (
            <Select {...a} {...register('status')} invalid={!!errors.status}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PROJECT_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date" required error={errors.startDate?.message}>
            {(a) => <Input {...a} type="date" {...register('startDate')} invalid={!!errors.startDate} />}
          </Field>
          <Field label="End date" error={errors.endDate?.message} hint="Optional">
            {(a) => <Input {...a} type="date" {...register('endDate')} invalid={!!errors.endDate} />}
          </Field>
        </div>
      </form>
    </Modal>
  );
}
