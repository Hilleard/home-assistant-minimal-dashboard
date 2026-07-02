import { useCallback, useEffect, useRef, useState } from "react";
import type { HassEntities } from "home-assistant-js-websocket";
import { mdiWarehouse } from "@mdi/js";
import { Icon } from "./Icon";
import { ENTITIES } from "../config";
import { useNow } from "../ha/useNow";
import { useToggle } from "../ha/useServices";

const SLIDE_MS = 300;
// Blocks a second tap for a bit after the first, so a rapid double-tap can't
// send two contradictory toggle commands to a real, physical door.
const TAP_COOLDOWN_MS = 1500;

// Only these cover states mean "show the banner" — notably excludes
// "unavailable" (integration/device offline, nothing meaningful to show),
// which the old (state !== "closed") check would have wrongly shown as open.
const STATE_LABELS: Record<string, string> = {
  open: "Garage Door Open",
  opening: "Garage Door Opening",
  closing: "Garage Door Closing",
  // HA reports "unknown" when a door only has a closed-position sensor and
  // it isn't at that position — genuinely can't tell open/opening/closing
  // apart without a second sensor, so this is the honest description: it's
  // not closed, and that's all we actually know.
  unknown: "Garage Door Partially Open",
};

function elapsedSince(iso: string, now: Date): string {
  const mins = Math.floor((now.getTime() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const h = Math.floor(mins / 60);
  return `${h} ${h === 1 ? "hour" : "hours"} ago`;
}

// A black popover that slides up over the joke bar's exact footprint
// whenever the garage is open/opening/closing/partially-open, and slides
// back down once it's closed. While already showing, switching between
// those sub-states (e.g. opening -> open -> closing) only ever swaps the
// label in place — the effect below keys on `isOpen`, not on which specific
// state it is, so it never re-fires (and never replays the slide) for those.
export function GarageDoorBanner({ entities }: { entities: HassEntities }) {
  const now = useNow(30_000);
  const toggle = useToggle();
  const garage = entities[ENTITIES.garageDoor];
  const label = garage ? STATE_LABELS[garage.state] : undefined;
  const isOpen = !!label;

  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(false);
  const [onCooldown, setOnCooldown] = useState(false);
  const hideTimeout = useRef<number | undefined>(undefined);
  const showTimeout = useRef<number | undefined>(undefined);
  const cooldownTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(hideTimeout.current);
    window.clearTimeout(showTimeout.current);

    if (isOpen) {
      setMounted(true);
      // A short timeout (rather than requestAnimationFrame, which some
      // embedded/kiosk WebViews pause when the surface isn't strictly
      // foregrounded) lets the browser paint the just-mounted, still-hidden
      // (translateY(100%)) state before we flip to visible — so the
      // transform transition has an actual "from" value to animate from,
      // instead of appearing already at its end state.
      showTimeout.current = window.setTimeout(() => setVisible(true), 20);
    } else {
      setVisible(false);
      hideTimeout.current = window.setTimeout(() => setMounted(false), SLIDE_MS);
    }

    return () => {
      window.clearTimeout(hideTimeout.current);
      window.clearTimeout(showTimeout.current);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => window.clearTimeout(cooldownTimeout.current);
  }, []);

  const handleTap = useCallback(() => {
    if (onCooldown) return;
    setOnCooldown(true);
    // cover.toggle opens if it's closed and closes it otherwise — so this
    // always sends it the opposite way from whichever direction it last
    // moved, exactly like a physical remote button.
    toggle(ENTITIES.garageDoor);
    cooldownTimeout.current = window.setTimeout(() => setOnCooldown(false), TAP_COOLDOWN_MS);
  }, [onCooldown, toggle]);

  if (!mounted || !garage) return null;

  return (
    <button
      className={`garage-banner${visible ? " garage-banner--visible" : ""}`}
      onClick={handleTap}
      disabled={onCooldown}
    >
      <Icon path={mdiWarehouse} size="28px" />
      <span className="garage-banner-name">{label ?? STATE_LABELS.open}</span>
      <span className="garage-banner-time">{elapsedSince(garage.last_changed, now)}</span>
    </button>
  );
}
