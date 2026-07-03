// Central place for the entity IDs the dashboard reads. Edit these to match
// your Home Assistant instance — nothing else in the app needs to change.
// See README.md for what each entity needs to look like (state/attributes)
// and example helper YAML to create the ones that aren't already sensors.

export const HA_URL = import.meta.env.VITE_HA_URL as string;
export const HA_TOKEN = import.meta.env.VITE_HA_TOKEN as string;

export const ENTITIES = {
  // HA's built-in sun entity — no setup needed, always available. Drives
  // the automatic dark-mode switch at real sunset/sunrise for your location.
  sun: "sun.sun",
  weather: "weather.home",
  minutelySummary: "sensor.pirateweather_minutely_summary",
  climate: "climate.house",
  targetTemperature: "input_number.target_temperature",
  recyclingBin: "sensor.recycling_bin",
  dadJoke: "sensor.dad_joke",
  garageDoor: "cover.garage_door",
  mealSchedule: "calendar.meal_schedule",
  // Optional — a doorbell binary_sensor + a camera to show when it fires.
  // Leave the binary_sensor entity pointing at anything that never turns
  // "on" if you don't have a doorbell, and the banner just never appears.
  frontDoorDing: "binary_sensor.front_door_ding",
  frontDoorCamera: "camera.front_door_camera",
  petAFedMorning: "input_boolean.pet_a_fed_morning",
  petAFedEvening: "input_boolean.pet_a_fed_evening",
} as const;

// Pet treatments — purely calendar-driven, no automation involved. Each is
// an input_boolean ("on" = done, "off" = due — same convention as the pet
// feeding alerts above) so it's trivial to fix by hand in HA if it ever
// gets toggled by mistake — Developer Tools > States, flip it back. The app
// itself is what turns it back "off" when a new due month starts (see
// usePetTreatments.ts), not a scheduled automation. See README.md for the
// helpers these need.
export interface PetTreatment {
  key: string;
  petName: string;
  treatmentName: string;
  entity: string;
  dueMonths: number[]; // 1-12
}

const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const PET_TREATMENTS: PetTreatment[] = [
  {
    key: "pet-a-flea",
    petName: "Pet A",
    treatmentName: "Flea",
    entity: "input_boolean.pet_a_flea_tablet",
    dueMonths: ALL_MONTHS,
  },
  // Quarterly, staggered 3 months apart from Pet B's so they're never both
  // due the same month — adjust these month numbers to suit your own pets'
  // actual treatment schedule.
  {
    key: "pet-a-worming",
    petName: "Pet A",
    treatmentName: "Worming",
    entity: "input_boolean.pet_a_worming_tablet",
    dueMonths: [3, 6, 9, 12],
  },
  {
    key: "pet-b-flea",
    petName: "Pet B",
    treatmentName: "Flea",
    entity: "input_boolean.pet_b_flea_tablet",
    dueMonths: ALL_MONTHS,
  },
  {
    key: "pet-b-worming",
    petName: "Pet B",
    treatmentName: "Worming",
    entity: "input_boolean.pet_b_worming_tablet",
    dueMonths: [1, 4, 7, 10],
  },
];

// Calendars shown in the agenda column (right side) — one entry per HA
// calendar entity you want merged into a single agenda list.
export const AGENDA_CALENDARS = [
  "calendar.person_a",
  "calendar.person_b",
  "calendar.person_c",
  "calendar.household",
];

// Events from these calendars are prefixed "Name - " in the agenda so it's
// clear at a glance whose event it is. Calendars not listed here (e.g. a
// shared household one) show their titles as-is. If a source calendar
// already titles its own events "Name - thing", the prefix is skipped
// rather than doubled up.
export const AGENDA_CALENDAR_LABELS: Record<string, string> = {
  "calendar.person_a": "Person A",
  "calendar.person_b": "Person B",
  "calendar.person_c": "Person C",
};

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
