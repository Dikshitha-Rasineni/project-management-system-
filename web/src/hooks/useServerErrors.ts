import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { getErrorMessage, getFieldErrors } from '../services/api';

/**
 * Maps a failed API call onto the form: per-field errors go under the
 * matching input, anything else is returned as a form-level message.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  knownFields: readonly string[],
): string | null {
  const fieldErrors = getFieldErrors(error);
  let unmatched = false;
  for (const fe of fieldErrors) {
    if (knownFields.includes(fe.field)) setError(fe.field as Path<T>, { type: 'server', message: fe.message });
    else unmatched = true;
  }
  if (fieldErrors.length === 0 || unmatched) return getErrorMessage(error);
  return null;
}
