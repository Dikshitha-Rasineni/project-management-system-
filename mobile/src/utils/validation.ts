/**
 * Lightweight client-side checks that mirror the backend rules, for instant
 * feedback. The backend validates everything again.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Errors<K extends string> = Partial<Record<K, string>>;

export function validateLogin(email: string, password: string): Errors<'email' | 'password'> {
  const e: Errors<'email' | 'password'> = {};
  if (!email.trim()) e.email = 'Email is required';
  else if (!EMAIL.test(email.trim())) e.email = 'Enter a valid email address';
  if (!password) e.password = 'Password is required';
  return e;
}

export function validateRegister(v: { fullName: string; email: string; password: string; confirm: string }) {
  const e: Errors<'fullName' | 'email' | 'password' | 'confirm'> = {};
  if (v.fullName.trim().length < 2) e.fullName = 'Full name must be at least 2 characters';
  if (!v.email.trim()) e.email = 'Email is required';
  else if (!EMAIL.test(v.email.trim())) e.email = 'Enter a valid email address';
  if (v.password.length < 8) e.password = 'Password must be at least 8 characters';
  else if (v.password.length > 72) e.password = 'Password must be at most 72 characters';
  else if (!/[A-Za-z]/.test(v.password) || !/\d/.test(v.password)) e.password = 'Use at least one letter and one number';
  if (v.confirm !== v.password) e.confirm = 'Passwords do not match';
  return e;
}

export function validateTask(v: { name: string; description: string; projectId: string }) {
  const e: Errors<'name' | 'description' | 'projectId'> = {};
  if (!v.name.trim()) e.name = 'Task name is required';
  else if (v.name.trim().length > 160) e.name = 'Task name must be at most 160 characters';
  if (v.description.length > 2000) e.description = 'Description must be at most 2000 characters';
  if (!v.projectId) e.projectId = 'Choose a project';
  return e;
}

export const hasErrors = (e: object) => Object.keys(e).length > 0;
