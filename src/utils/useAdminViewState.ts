import { useEffect, useState } from 'react';

/** Presentation/navigation preferences only; never changes shared club data. */
export function useAdminViewState<T extends string>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try { return (sessionStorage.getItem(key) as T) || fallback; } catch { return fallback; }
  });
  useEffect(() => { try { sessionStorage.setItem(key, value); } catch { /* Optional UI memory. */ } }, [key, value]);
  return [value, setValue] as const;
}
