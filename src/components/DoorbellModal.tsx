import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { HassEntities } from "home-assistant-js-websocket";
import { ENTITIES } from "../config";

const VISIBLE_MS = 60_000;

// Shows for a full minute once the doorbell fires, regardless of how
// quickly the underlying binary_sensor itself flips back to "off" — the
// press is momentary, but a family actually walking to the door isn't.
export function DoorbellModal({ entities }: { entities: HassEntities }) {
  const [visible, setVisible] = useState(false);
  const hideTimeout = useRef<number | undefined>(undefined);
  const lastSeenChange = useRef<string | undefined>(undefined);

  const ding = entities[ENTITIES.frontDoorDing];
  const camera = entities[ENTITIES.frontDoorCamera];

  useEffect(() => {
    if (!ding || ding.state !== "on") return;
    if (ding.last_changed === lastSeenChange.current) return;
    lastSeenChange.current = ding.last_changed;

    setVisible(true);
    window.clearTimeout(hideTimeout.current);
    hideTimeout.current = window.setTimeout(() => setVisible(false), VISIBLE_MS);
  }, [ding]);

  useEffect(() => () => window.clearTimeout(hideTimeout.current), []);

  if (!visible || !camera) return null;

  return createPortal(
    <div className="modal-overlay" onClick={() => setVisible(false)}>
      <div className="doorbell-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hourly-modal-header">
          <div className="hourly-modal-title">Someone's at the Door</div>
          <button
            className="hourly-modal-close"
            onClick={() => setVisible(false)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <img
          className="doorbell-modal-image"
          src={camera.attributes.entity_picture}
          alt="Front door camera"
        />
      </div>
    </div>,
    document.body,
  );
}
