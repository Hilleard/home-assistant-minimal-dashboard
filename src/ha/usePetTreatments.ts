import { useEffect } from "react";
import type { HassEntities } from "home-assistant-js-websocket";
import { PET_TREATMENTS, type PetTreatment } from "../config";
import { useTurnOff } from "./useServices";

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// The boolean alone decides what's shown — "on" means done, "off" means not
// done yet (due), same convention as the pet feeding alerts. `dueMonths`
// only controls *when the app resets it back to "off" automatically*; it
// never hides a treatment that's genuinely still switched off.
//
// The reset itself: whenever the app notices it's a due month and the
// boolean is "on", it checks whether that "on" is stale (last changed
// before this month started, i.e. left over from marking a *previous*
// cycle done) versus current (marked done already this month). Stale ones
// get turned back "off" by the app itself — nothing on a schedule.
export function useDuePetTreatments(entities: HassEntities): PetTreatment[] {
  const turnOff = useTurnOff();

  const due: PetTreatment[] = [];
  for (const t of PET_TREATMENTS) {
    if (entities[t.entity]?.state === "off") due.push(t);
  }

  useEffect(() => {
    for (const t of PET_TREATMENTS) {
      const current = new Date();
      if (!t.dueMonths.includes(current.getMonth() + 1)) continue;
      const state = entities[t.entity];
      if (!state || state.state !== "on") continue;
      if (new Date(state.last_changed) < startOfMonth(current)) {
        turnOff(t.entity);
      }
    }
  }, [entities, turnOff]);

  return due;
}
