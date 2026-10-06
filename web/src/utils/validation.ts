import { z } from 'zod';

/**
 * Client-side validation mirrors the backend rules for instant feedback.
 * The backend re-validates everything — these are a convenience, not a guard.
 */

const dateString = (label: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be a valid date`)
    .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), `${label} must be a valid date`);

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100, 'Full name is too long'),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address').max(254),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/\d/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export const projectSchema = z
  .object({
    name: z.string().trim().min(1, 'Project name is required').max(120, 'Project name must be at most 120 characters'),
    description: z.string().max(2000, 'Description must be at most 2000 characters'),
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
    startDate: dateString('Start date'),
    endDate: z.union([dateString('End date'), z.literal('')]),
  })
  .refine((d) => !d.endDate || d.endDate >= d.startDate, {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  });

export const taskSchema = z.object({
  name: z.string().trim().min(1, 'Task name is required').max(160, 'Task name must be at most 160 characters'),
  description: z.string().max(2000, 'Description must be at most 2000 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
  dueDate: z.union([dateString('Due date'), z.literal('')]),
  projectId: z.string().min(1, 'Choose a project'),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ProjectValues = z.infer<typeof projectSchema>;
export type TaskValues = z.infer<typeof taskSchema>;
