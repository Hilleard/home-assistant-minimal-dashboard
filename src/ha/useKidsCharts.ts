import { useCallback } from "react";
import type { HassEntities } from "home-assistant-js-websocket";
import { KIDS_ENTITIES, BEHAVIOUR_CATEGORIES, behaviourEntity } from "../config";
import { useIncrementCounter, useDecrementCounter, useSetDate } from "./useServices";

// Used to "clear" an input_datetime back to not-today, since the domain has
// no clear/unset service — any date this far in the past reads as false from
// isToday() and is otherwise inert.
const NOT_TODAY = "2000-01-01";

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isToday(dateState: string | undefined): boolean {
  return !!dateState && dateState === todayStr();
}

export const READING_ROW_SIZE = 7;
export const READING_ROWS = 4;
const READING_CYCLE = READING_ROW_SIZE * READING_ROWS; // 28 — grid resets after 4 full rows

export interface ReadingChartState {
  count: number;
  starredToday: boolean;
  grid: boolean[][]; // READING_ROWS rows of READING_ROW_SIZE cells, filled left-to-right/top-to-bottom
  spotsLeftInRow: number; // 0-6, how many more stars complete the current row
  justCompletedRow: boolean; // true right after today's star finished a row of 7
  addStar: () => Promise<void>;
  removeStar: () => Promise<void>; // undo today's star — only works same-day
}

// One running star count, laid out as a 4x7 grid. Every completed row of 7
// is a reward; the grid wraps back to empty after all 4 rows (28 stars) fill.
// Ships as a reading-streak tracker, but the mechanic (one star per day, max
// once/day, undo same-day) works for any daily habit — rename freely.
export function useReadingChart(entities: HassEntities): ReadingChartState {
  const increment = useIncrementCounter();
  const decrement = useDecrementCounter();
  const setDate = useSetDate();

  const count = Number(entities[KIDS_ENTITIES.readingDays]?.state ?? 0) || 0;
  const starredToday = isToday(entities[KIDS_ENTITIES.readingLastDay]?.state);

  // 1-indexed position within the current 28-star cycle (0 if count is 0).
  const posInCycle = count === 0 ? 0 : ((count - 1) % READING_CYCLE) + 1;

  const grid: boolean[][] = Array.from({ length: READING_ROWS }, (_, r) =>
    Array.from({ length: READING_ROW_SIZE }, (_, c) => r * READING_ROW_SIZE + c < posInCycle),
  );

  const justCompletedRow = starredToday && count > 0 && count % READING_ROW_SIZE === 0;

  // How many stars are in the *next* row still being filled — 0 only means
  // "haven't started this row yet" (fresh grid, or the row before this one
  // just completed), never "this row is full and staying that way".
  const posInRow = count % READING_ROW_SIZE;

  const addStar = useCallback(async () => {
    if (starredToday) return;
    await increment(KIDS_ENTITIES.readingDays);
    await setDate(KIDS_ENTITIES.readingLastDay, todayStr());
  }, [starredToday, increment, setDate]);

  const removeStar = useCallback(async () => {
    if (!starredToday || count <= 0) return;
    await decrement(KIDS_ENTITIES.readingDays);
    await setDate(KIDS_ENTITIES.readingLastDay, NOT_TODAY);
  }, [starredToday, count, decrement, setDate]);

  return {
    count,
    starredToday,
    grid,
    spotsLeftInRow: posInRow === 0 ? READING_ROW_SIZE : READING_ROW_SIZE - posInRow,
    justCompletedRow,
    addStar,
    removeStar,
  };
}

export interface BehaviourCategoryState {
  slug: string;
  label: string;
  markedToday: boolean;
}

export interface BehaviourChartState {
  categories: BehaviourCategoryState[];
  days: number;
  nextMilestone: number;
  toggleCategory: (slug: string) => Promise<void>;
}

// A day only counts toward the streak once every category on the list has
// been marked that day — the last one marked/unmarked is what flips the day
// counter, guarded so a day only ever gets counted once.
export function useBehaviourChart(entities: HassEntities): BehaviourChartState {
  const increment = useIncrementCounter();
  const decrement = useDecrementCounter();
  const setDate = useSetDate();

  const categories: BehaviourCategoryState[] = BEHAVIOUR_CATEGORIES.map((c) => ({
    slug: c.slug,
    label: c.label,
    markedToday: isToday(entities[behaviourEntity(c.slug)]?.state),
  }));

  const days = Number(entities[KIDS_ENTITIES.behaviourDays]?.state ?? 0) || 0;
  const nextMilestone = days - (days % 10) + 10;

  const toggleCategory = useCallback(
    async (slug: string) => {
      const target = categories.find((c) => c.slug === slug);
      if (!target) return;

      const dayWasCounted = isToday(entities[KIDS_ENTITIES.behaviourLastCompletedDay]?.state);

      if (target.markedToday) {
        // Undo this category's mark. If that breaks a just-completed day,
        // roll the day counter back too so it stays accurate.
        await setDate(behaviourEntity(slug), NOT_TODAY);
        if (dayWasCounted && days > 0) {
          await decrement(KIDS_ENTITIES.behaviourDays);
          await setDate(KIDS_ENTITIES.behaviourLastCompletedDay, NOT_TODAY);
        }
        return;
      }

      await setDate(behaviourEntity(slug), todayStr());
      const restAlreadyDone = categories.filter((c) => c.slug !== slug).every((c) => c.markedToday);
      if (restAlreadyDone && !dayWasCounted) {
        await increment(KIDS_ENTITIES.behaviourDays);
        await setDate(KIDS_ENTITIES.behaviourLastCompletedDay, todayStr());
      }
    },
    [categories, entities, setDate, increment, decrement, days],
  );

  return { categories, days, nextMilestone, toggleCategory };
}
