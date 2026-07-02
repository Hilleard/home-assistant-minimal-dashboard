import {
  createConnection,
  createLongLivedTokenAuth,
  type Connection,
} from "home-assistant-js-websocket";
import { HA_TOKEN, HA_URL } from "../config";

let connectionPromise: Promise<Connection> | null = null;

// Reused across every hook that needs a connection — only ever opens one
// websocket for the whole app.
export function getConnection(): Promise<Connection> {
  if (!connectionPromise) {
    connectionPromise = (async () => {
      const auth = createLongLivedTokenAuth(HA_URL, HA_TOKEN);
      return createConnection({ auth });
    })();
  }
  return connectionPromise;
}

export function isHaConfigured(): boolean {
  return Boolean(HA_URL && HA_TOKEN);
}
