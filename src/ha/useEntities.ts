import { useEffect, useState } from "react";
import { subscribeEntities, type HassEntities } from "home-assistant-js-websocket";
import { getConnection, isHaConfigured } from "./connection";

interface EntitiesState {
  entities: HassEntities;
  connected: boolean;
  error: string | null;
}

// Live entity states, pushed over the websocket — no polling.
export function useEntities(): EntitiesState {
  const [state, setState] = useState<EntitiesState>({
    entities: {},
    connected: false,
    error: null,
  });

  useEffect(() => {
    if (!isHaConfigured()) return;
    let unsub: (() => void) | undefined;
    let cancelled = false;

    getConnection()
      .then((conn) => {
        if (cancelled) return;
        unsub = subscribeEntities(conn, (entities) => {
          setState({ entities, connected: true, error: null });
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState((s) => ({ ...s, error: String(err?.message ?? err) }));
      });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  return state;
}
