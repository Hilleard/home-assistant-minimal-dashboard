import type { HassEntities } from "home-assistant-js-websocket";
import { ENTITIES } from "../config";
import { useUpdateEntity } from "../ha/useServices";
import { useDoubleTap } from "../hooks/useDoubleTap";

export function Joke({ entities }: { entities: HassEntities }) {
  const updateEntity = useUpdateEntity();
  const { armedKey, handleTap } = useDoubleTap();

  const joke = entities[ENTITIES.dadJoke]?.state;
  if (!joke) return <div className="joke" />;

  return (
    <button
      className={`joke${armedKey === "joke" ? " joke--armed" : ""}`}
      onClick={() => handleTap("joke", () => updateEntity(ENTITIES.dadJoke))}
    >
      {joke}
    </button>
  );
}
