import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_TIMEOUT_MS = 1000;

// Shared "needs two taps to confirm" pattern — the first tap just arms
// (exposed as `armedKey`, for a dimmed/highlighted visual cue) and the
// second, within the timeout, actually runs the action. Used anywhere a
// stray tap shouldn't be able to trigger something by accident.
export function useDoubleTap(timeoutMs: number = DEFAULT_TIMEOUT_MS) {
  const [armedKey, setArmedKey] = useState<string | null>(null);
  const armedTimeout = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(armedTimeout.current), []);

  const handleTap = useCallback(
    (key: string, onConfirm: () => void) => {
      if (armedKey === key) {
        window.clearTimeout(armedTimeout.current);
        setArmedKey(null);
        onConfirm();
        return;
      }
      window.clearTimeout(armedTimeout.current);
      setArmedKey(key);
      armedTimeout.current = window.setTimeout(() => setArmedKey(null), timeoutMs);
    },
    [armedKey, timeoutMs],
  );

  return { armedKey, handleTap };
}
