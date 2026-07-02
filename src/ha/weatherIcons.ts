import {
  mdiWeatherNight,
  mdiWeatherCloudy,
  mdiWeatherFog,
  mdiWeatherHail,
  mdiWeatherLightning,
  mdiWeatherLightningRainy,
  mdiWeatherPartlyCloudy,
  mdiWeatherPouring,
  mdiWeatherRainy,
  mdiWeatherSnowy,
  mdiWeatherSnowyRainy,
  mdiWeatherSunny,
  mdiWeatherWindy,
  mdiWeatherWindyVariant,
  mdiAlert,
} from "@mdi/js";

// Home Assistant's standard weather condition strings.
const CONDITION_ICON: Record<string, string> = {
  "clear-night": mdiWeatherNight,
  cloudy: mdiWeatherCloudy,
  fog: mdiWeatherFog,
  hail: mdiWeatherHail,
  lightning: mdiWeatherLightning,
  "lightning-rainy": mdiWeatherLightningRainy,
  partlycloudy: mdiWeatherPartlyCloudy,
  pouring: mdiWeatherPouring,
  rainy: mdiWeatherRainy,
  snowy: mdiWeatherSnowy,
  "snowy-rainy": mdiWeatherSnowyRainy,
  sunny: mdiWeatherSunny,
  windy: mdiWeatherWindy,
  "windy-variant": mdiWeatherWindyVariant,
  exceptional: mdiAlert,
};

export function weatherIcon(condition?: string | null): string {
  return CONDITION_ICON[condition ?? ""] ?? mdiWeatherCloudy;
}

export function formatCondition(condition?: string | null): string {
  if (!condition) return "";
  return condition.charAt(0).toUpperCase() + condition.slice(1).replace(/-/g, " ");
}
