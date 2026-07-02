import { useEffect, useState } from "react";
import { getConnection, isHaConfigured } from "./connection";
import { ENTITIES, FORECAST_HOURLY_COUNT, FORECAST_REFRESH_MS } from "../config";
import type { DailyForecast } from "./useForecast";

interface HourlyForecastResponse {
  response: {
    [entityId: string]: { forecast: DailyForecast[] };
  };
}

// Same weather.get_forecasts service as the daily forecast, just asking for
// hourly instead — only fetched while the hourly modal is open, since it's
// a much bigger payload (a week's worth of hours) than anything else on the
// dashboard needs.
export function useHourlyForecast(enabled: boolean): DailyForecast[] {
  const [hourly, setHourly] = useState<DailyForecast[]>([]);

  useEffect(() => {
    if (!enabled || !isHaConfigured()) return;
    let cancelled = false;

    async function fetchHourly() {
      try {
        const conn = await getConnection();
        const result = await conn.sendMessagePromise<HourlyForecastResponse>({
          type: "call_service",
          domain: "weather",
          service: "get_forecasts",
          service_data: { type: "hourly" },
          target: { entity_id: ENTITIES.weather },
          return_response: true,
        });
        if (!cancelled) {
          const forecast = result.response?.[ENTITIES.weather]?.forecast ?? [];
          setHourly(forecast.slice(0, FORECAST_HOURLY_COUNT));
        }
      } catch (err) {
        console.error("Failed to fetch hourly forecast", err);
      }
    }

    fetchHourly();
    const interval = setInterval(fetchHourly, FORECAST_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [enabled]);

  return hourly;
}
