import { useCallback } from "react";
import { getConnection, isHaConfigured } from "./connection";

// Exposes a single `toggle(entityId)` used by the alert chips (feed/pet
// reminders) to dismiss themselves on tap.
export function useToggle() {
  return useCallback(async (entityId: string) => {
    if (!isHaConfigured()) return;
    const domain = entityId.split(".")[0];
    const conn = await getConnection();
    await conn.sendMessagePromise({
      type: "call_service",
      domain,
      service: "toggle",
      target: { entity_id: entityId },
    });
  }, []);
}

// Explicit turn_off (unlike toggle, safe to call repeatedly) — used to
// auto-reset pet treatment booleans back to "not done" when a new due month
// starts.
export function useTurnOff() {
  return useCallback(async (entityId: string) => {
    if (!isHaConfigured()) return;
    const domain = entityId.split(".")[0];
    const conn = await getConnection();
    await conn.sendMessagePromise({
      type: "call_service",
      domain,
      service: "turn_off",
      target: { entity_id: entityId },
    });
  }, []);
}

// Forces HA to immediately re-poll an entity rather than waiting for its
// next scheduled interval — used to fetch a new joke on double-tap.
export function useUpdateEntity() {
  return useCallback(async (entityId: string) => {
    if (!isHaConfigured()) return;
    const conn = await getConnection();
    await conn.sendMessagePromise({
      type: "call_service",
      domain: "homeassistant",
      service: "update_entity",
      target: { entity_id: entityId },
    });
  }, []);
}

// Bumps a `counter.*` entity by one — used by the kids' charts.
export function useIncrementCounter() {
  return useCallback(async (entityId: string) => {
    if (!isHaConfigured()) return;
    const conn = await getConnection();
    await conn.sendMessagePromise({
      type: "call_service",
      domain: "counter",
      service: "increment",
      target: { entity_id: entityId },
    });
  }, []);
}

// Steps a `counter.*` entity back by one — used to undo a same-day mark on
// the kids' charts.
export function useDecrementCounter() {
  return useCallback(async (entityId: string) => {
    if (!isHaConfigured()) return;
    const conn = await getConnection();
    await conn.sendMessagePromise({
      type: "call_service",
      domain: "counter",
      service: "decrement",
      target: { entity_id: entityId },
    });
  }, []);
}

// Sets an `input_datetime.*` (date-only) entity — used to record "last done
// on this date" for the kids' charts, which is how the one-per-day limit works.
export function useSetDate() {
  return useCallback(async (entityId: string, date: string) => {
    if (!isHaConfigured()) return;
    const conn = await getConnection();
    await conn.sendMessagePromise({
      type: "call_service",
      domain: "input_datetime",
      service: "set_datetime",
      service_data: { date },
      target: { entity_id: entityId },
    });
  }, []);
}
