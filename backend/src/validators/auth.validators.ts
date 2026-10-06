import { z } from 'zod';
import { requiredText } from './common';

const email = z
  .string({ required_error: 'Email is required', invalid_type_error: 'Email must be text' })
  .trim()
  .min(1, 'Email is required')
  .max(254, 'Email must be at most 254 characters')
  .email('Enter a valid email address')
  .transform((v) => v.toLowerCase());

/**
 * Password policy: 8–72 characters (bcrypt only uses the first 72 bytes),
 * at least one letter and one number.
 */
const password = z
  .string({ required_error: 'Password is required', invalid_type_error: 'Password must be text' })
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number');

export const registerSchema = z.object({
  fullName: requiredText('Full name', 100).refine(
    (v) => v.length >= 2,
    'Full name must be at least 2 characters',
  ),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  // On login we only check presence — policy is enforced at registration.
  password: z
    .string({ required_error: 'Password is required', invalid_type_error: 'Password must be text' })
    .min(1, 'Password is required')
    .max(200, 'Password is too long'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
