import { useEffect, useState } from 'react';
import { flaskAdminRequests } from '@/api/flask';

const listeners = new Set<(count: number) => void>();
let lastCount = 0;

export function refreshPendingRequestCount() {
  flaskAdminRequests
    .pendingCount()
    .then((count) => {
      lastCount = count;
      listeners.forEach((listener) => listener(count));
    })
    .catch(() => {
      // The badge is a hint; if the server can't answer, keep the last number.
    });
}

export function usePendingRequestCount(enabled: boolean) {
  const [count, setCount] = useState(lastCount);

  useEffect(() => {
    if (!enabled) return;
    listeners.add(setCount);
    refreshPendingRequestCount();
    return () => {
      listeners.delete(setCount);
    };
  }, [enabled]);

  return enabled ? count : 0;
}

export function formatRequestCount(count: number) {
  if (count === 0) return 'Nicio cerere';
  if (count === 1) return '1 cerere';
  const lastTwo = count % 100;
  return lastTwo === 0 || lastTwo >= 20 ? `${count} de cereri` : `${count} cereri`;
}
