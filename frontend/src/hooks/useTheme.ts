import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'uc-theme';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.classList.contains('dark');

/** Light/dark switch. index.html applies the saved theme before first paint. */
export function useTheme() {
  const dark = useSyncExternalStore(subscribe, isDark);

  const toggle = () => {
    const next = !isDark();
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    } catch {
      // Private mode: the choice just will not persist.
    }
  };

  return { dark, toggle };
}
