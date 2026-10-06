import { useCallback, useState } from 'react';

/**
 * Pull-to-refresh state that only shows the spinner for user-initiated
 * refreshes (not for background refetches).
 */
export function useRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);
  return { refreshing, onRefresh };
}
