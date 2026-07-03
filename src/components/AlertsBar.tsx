import type { HassEntities } from "home-assistant-js-websocket";
import { mdiSilverwareForkKnife, mdiTrashCanOutline, mdiPaw, mdiPill, mdiMedication } from "@mdi/js";
import { Icon } from "./Icon";
import { ENTITIES } from "../config";
import { useNow } from "../ha/useNow";
import { useToggle } from "../ha/useServices";
import { useDuePetTreatments } from "../ha/usePetTreatments";
import { useDoubleTap } from "../hooks/useDoubleTap";

interface Alert {
  key: string;
  icon: string;
  name: string;
  label: string;
  onClick?: () => void;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function binDaysAway(entities: HassEntities): number | null {
  const s = entities[ENTITIES.recyclingBin];
  if (!s) return null;
  const a = s.attributes ?? {};

  // This sensor's own attribute holds the next collection date (e.g. "2026-07-02"),
  // with the state itself just describing the bin type, not a countdown.
  const nextCollection = a.next_collection ?? a.nextCollection;
  if (nextCollection) {
    const target = new Date(nextCollection);
    target.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / 86_400_000);
  }

  // Fallback for other bin-sensor integrations that report a countdown directly.
  let n = a.days ?? a.daysUntilCollection ?? a.days_until_collection ?? a["Days Until Collection"];
  if (n == null) {
    const txt = String(s.state ?? "").toLowerCase();
    if (txt.includes("today")) n = 0;
    else if (txt.includes("tomorrow")) n = 1;
    else {
      const m = txt.match(/in\s+(\d+)\s+day/);
      if (m) n = Number(m[1]);
    }
  }
  return n == null ? null : Number(n);
}

export function AlertsBar({ entities }: { entities: HassEntities }) {
  const now = useNow(30_000);
  const toggle = useToggle();
  const dueTreatments = useDuePetTreatments(entities);
  const alerts: Alert[] = [];

  const { armedKey, handleTap } = useDoubleTap();
  const handleDoubleTap = (key: string, entityId: string) => handleTap(key, () => toggle(entityId));

  let meal: Alert | null = null;
  const mealEvent = entities[ENTITIES.mealSchedule];
  if (mealEvent?.attributes?.start_time) {
    const start = new Date(mealEvent.attributes.start_time);
    if (isSameDay(start, now)) {
      meal = {
        key: "meal",
        icon: mdiSilverwareForkKnife,
        name: mealEvent.attributes.message || "Meal",
        label: "",
      };
    }
  }

  const binDays = binDaysAway(entities);
  if (binDays === 0 || binDays === 1) {
    alerts.push({
      key: "bin",
      icon: mdiTrashCanOutline,
      name: "Bin Day",
      label: binDays === 0 ? "today" : "Tomorrow",
    });
  }

  for (const t of dueTreatments) {
    alerts.push({
      key: t.key,
      icon: t.treatmentName === "Worming" ? mdiMedication : mdiPill,
      name: t.petName,
      label: t.treatmentName,
      onClick: () => handleDoubleTap(t.key, t.entity),
    });
  }

  if (entities[ENTITIES.petAFedMorning]?.state === "off") {
    alerts.push({
      key: "feed-am",
      icon: mdiPaw,
      name: "Feed Pet A",
      label: "Morning",
      onClick: () => handleDoubleTap("feed-am", ENTITIES.petAFedMorning),
    });
  }
  if (entities[ENTITIES.petAFedEvening]?.state === "off") {
    alerts.push({
      key: "feed-pm",
      icon: mdiPaw,
      name: "Feed Pet A",
      label: "Evening",
      onClick: () => handleDoubleTap("feed-pm", ENTITIES.petAFedEvening),
    });
  }

  function chip(a: Alert) {
    return (
      <button
        key={a.key}
        className={`alert-chip${a.key === armedKey ? " alert-chip--armed" : ""}`}
        onClick={a.onClick}
        disabled={!a.onClick}
      >
        <Icon path={a.icon} size="2.3vh" />
        <span className="alert-name">{a.name}</span>
        {a.label && <span className="alert-label">{a.label}</span>}
      </button>
    );
  }

  return (
    <div className="alerts-bar">
      <div className="alerts-bar-left">{alerts.map(chip)}</div>
      {meal && <div className="alerts-bar-right">{chip(meal)}</div>}
    </div>
  );
}
