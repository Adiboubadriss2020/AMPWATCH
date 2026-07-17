import { useEffect, useRef, useState } from 'react';

/** Briefly toggles `true` whenever `key` changes (after first mount). */
export function useFlashOnChange(key: string | number, durationMs = 480): boolean {
  const [flash, setFlash] = useState(false);
  const prev = useRef(key);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      prev.current = key;
      return;
    }
    if (prev.current === key) return;
    prev.current = key;
    setFlash(true);
    const id = window.setTimeout(() => setFlash(false), durationMs);
    return () => window.clearTimeout(id);
  }, [key, durationMs]);

  return flash;
}
