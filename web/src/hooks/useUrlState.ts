import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Keeps list filters in the URL (?search=&status=&page=) so they survive a
 * refresh, can be bookmarked, and work with the browser back button.
 */
export function useUrlState<K extends string>(keys: readonly K[]) {
  const [params, setParams] = useSearchParams();
  const values = Object.fromEntries(keys.map((k) => [k, params.get(k) ?? ''])) as Record<K, string>;

  const set = useCallback(
    (patch: Partial<Record<K, string>>, resetPage = true) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch) as [string, string | undefined][]) {
            if (v) next.set(k, v);
            else next.delete(k);
          }
          if (resetPage && !('page' in patch)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return [values, set] as const;
}
