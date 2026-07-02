// Central place for the entity IDs the dashboard reads. Edit these to match
// your Home Assistant instance — nothing else in the app needs to change.
// See README.md for what each entity needs to look like (state/attributes)
// and example helper YAML to create the ones that aren't already sensors.

export const HA_URL = import.meta.env.VITE_HA_URL as string;
export const HA_TOKEN = import.meta.env.VITE_HA_TOKEN as string;

export const ENTITIES = {
  weather: "weather.home",
  minutelySummary: "sensor.pirateweather_minutely_summary",
  climate: "climate.house",
  targetTemperature: "input_number.target_temperature",
  recyclingBin: "sensor.recycling_bin",
  dadJoke: "sensor.dad_joke",
  garageDoor: "cover.garage_door",
  mealSchedule: "calendar.meal_schedule",
  // Two pets, each with a morning/evening feed toggle and a flea/worming
  // tablet toggle — rename the display labels in AlertsBar.tsx, and these
  // entity IDs, to suit however many pets (or none) you actually have.
  petAFedMorning: "input_boolean.pet_a_fed_morning",
  petAFedEvening: "input_boolean.pet_a_fed_evening",
  petAFleaTablet: "input_boolean.pet_a_flea_tablet",
  petBFleaTablet: "input_boolean.pet_b_flea_tablet",
} as const;

// Calendars shown in the agenda column (right side) — one entry per HA
// calendar entity you want merged into a single agenda list.
export const AGENDA_CALENDARS = [
  "calendar.person_a",
  "calendar.person_b",
  "calendar.person_c",
  "calendar.household",
];

// How often to re-pull data that isn't pushed live over the websocket.
export const FORECAST_REFRESH_MS = 5 * 60 * 1000; // 5 min
export const CALENDAR_REFRESH_MS = 2 * 60 * 1000; // 2 min
export const AGENDA_DAYS = 14;
// Weather forecast rows shown below "today" (left column).
export const FORECAST_UPCOMING_DAYS = 6;
// Hours shown in the hourly forecast modal.
export const FORECAST_HOURLY_COUNT = 24;

// =============================================================================
// KIDS' CHARTS — a second swipe page with two simple daily-habit trackers.
// See README.md for the HA helper YAML these need.
// =============================================================================

export const KIDS_ENTITIES = {
  readingDays: "counter.kids_reading_days",
  readingLastDay: "input_datetime.kids_reading_last_day",
  behaviourDays: "counter.kids_behaviour_days",
  behaviourLastCompletedDay: "input_datetime.kids_behaviour_last_completed_day",
} as const;

// Edit this list to change what shows up on the behaviour chart — each entry
// needs a matching input_datetime helper (see README.md) named
// input_datetime.kids_behaviour_<slug>_last_marked.
export const BEHAVIOUR_CATEGORIES: { slug: string; label: string }[] = [
  { slug: "kind_words", label: "Kind words" },
  { slug: "listening", label: "Listening first time" },
  { slug: "tidy", label: "Tidy up" },
  { slug: "brushing_teeth", label: "Brush teeth" },
];

export function behaviourEntity(slug: string): string {
  return `input_datetime.kids_behaviour_${slug}_last_marked`;
}
