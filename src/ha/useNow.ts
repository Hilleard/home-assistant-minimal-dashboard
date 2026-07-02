import { useEffect, useState } from "react";

// Ticks so components showing the clock or "elapsed"/"time remaining" text
// stay current even when no entity has pushed a new state.
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
