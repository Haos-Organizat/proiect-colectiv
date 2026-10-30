import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/api/client';

type Result<T> =
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: ApiError };

type State<T> = { status: 'loading'; data?: undefined; error?: undefined } | Result<T>;

/**
 * Loads data with an api function and re-runs when `key` changes.
 * Keep `key` a primitive (e.g. a slug or a query string).
 */
export function useFetch<T>(load: () => Promise<T>, key: string) {
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${key}#${attempt}`;
  // The result remembers which request produced it; a newer key means "loading".
  const [result, setResult] = useState<(Result<T> & { key: string }) | null>(null);

  useEffect(() => {
    let active = true;
    load()
      .then((data) => active && setResult({ key: requestKey, status: 'success', data }))
      .catch((err: unknown) => {
        if (!active) return;
        const error =
          err instanceof ApiError
            ? err
            : new ApiError(0, { code: 'network_error', message: 'Could not reach the server.' });
        setResult({ key: requestKey, status: 'error', error });
      });
    return () => {
      active = false;
    };
    // `load` is recreated every render; `requestKey` decides when to refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const state: State<T> = result && result.key === requestKey ? result : { status: 'loading' };
  return { ...state, retry };
}
