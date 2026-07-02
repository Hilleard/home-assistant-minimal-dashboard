import type { HassEntities } from "home-assistant-js-websocket";
import { ENTITIES } from "../config";

export function Joke({ entities }: { entities: HassEntities }) {
  const joke = entities[ENTITIES.dadJoke]?.state;
  if (!joke) return <div className="joke" />;
  return <div className="joke">{joke}</div>;
}
